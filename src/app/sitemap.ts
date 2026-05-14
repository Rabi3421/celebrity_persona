import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import UserOutfit from '@/models/UserOutfit';
import { SITE_URL, absoluteUrl } from '@/lib/seo/site';
import { releasedMovieQuery, upcomingMovieQuery } from '@/lib/seo/publicData';

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes: SitemapEntry[] = [
  { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
  { url: absoluteUrl('/celebrity-profiles'), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/fashion-gallery'), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/celebrity-news'), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/movie-details'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/upcoming-movies'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/reviews'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/api-docs'), changeFrequency: 'monthly', priority: 0.55 },
  { url: absoluteUrl('/api-pricing'), changeFrequency: 'monthly', priority: 0.55 },
  { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.25 },
  { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.25 },
  { url: absoluteUrl('/cookie-policy'), changeFrequency: 'yearly', priority: 0.25 },
];

function entry(path: string, updatedAt?: Date | string, priority = 0.7): SitemapEntry {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await dbConnect();

    const [
      celebrities,
      outfits,
      userOutfits,
      releasedMovies,
      upcomingMovies,
      reviews,
      news,
    ] = await Promise.all([
      Celebrity.find({ $or: [{ status: { $exists: false } }, { status: 'published' }] })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      CelebrityOutfit.find({
        $and: [
          { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
          { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        ],
      })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      UserOutfit.find({ isPublished: true, isApproved: true })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      Movie.find(releasedMovieQuery())
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      Movie.find(upcomingMovieQuery())
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      MovieReview.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      CelebrityNews.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
    ]);

    return [
      ...staticRoutes,
      ...celebrities.map((doc: any) => entry(`/celebrity-profiles/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.8)),
      ...outfits.map((doc: any) => entry(`/celebrity-outfits/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.75)),
      ...userOutfits.map((doc: any) => entry(`/user-outfits/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.55)),
      ...releasedMovies.map((doc: any) => entry(`/movie-details/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.75)),
      ...upcomingMovies.map((doc: any) => entry(`/upcoming-movies/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.75)),
      ...reviews.map((doc: any) => entry(`/reviews/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.75)),
      ...news.map((doc: any) => entry(`/celebrity-news/${doc.slug}`, doc.updatedAt || doc.createdAt, 0.75)),
    ];
  } catch {
    return staticRoutes;
  }
}
