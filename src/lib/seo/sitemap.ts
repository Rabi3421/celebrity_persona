import 'server-only';

import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import UserOutfit from '@/models/UserOutfit';
import { absoluteUrl } from '@/lib/seo/site';
import { releasedMovieQuery, upcomingMovieQuery } from '@/lib/seo/publicData';

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

const MAX_SITEMAP_URLS = 50000;
const DEFAULT_SOURCE_LIMIT = 7000;
const DEFAULT_STATIC_LAST_MODIFIED = '2026-05-14T00:00:00.000Z';
const configuredSourceLimit = Number(process.env.SITEMAP_SOURCE_LIMIT || DEFAULT_SOURCE_LIMIT);
const SOURCE_LIMIT = Math.max(
  100,
  Math.min(
    Number.isFinite(configuredSourceLimit) ? configuredSourceLimit : DEFAULT_SOURCE_LIMIT,
    MAX_SITEMAP_URLS
  )
);

const hasSlugFilter = {
  slug: { $type: 'string', $ne: '' },
};

type SitemapSource = {
  model: any;
  query: Record<string, any>;
  pathPrefix: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

function validDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function lastModified(doc: Record<string, unknown>, fallback: Date): Date {
  return (
    validDate(doc.updatedAt) ||
    validDate(doc.publishDate) ||
    validDate(doc.releaseDate) ||
    validDate(doc.createdAt) ||
    fallback
  );
}

function fallbackLastModified(): Date {
  return (
    validDate(process.env.SITEMAP_STATIC_LAST_MODIFIED) ||
    validDate(process.env.NEXT_PUBLIC_SITE_LAST_MODIFIED) ||
    new Date(DEFAULT_STATIC_LAST_MODIFIED)
  );
}

function indexableSeoFilter(field: 'seo' | 'seoData') {
  return {
    $and: [
      {
        $or: [
          { [`${field}.noindex`]: { $exists: false } },
          { [`${field}.noindex`]: { $ne: true } },
        ],
      },
      {
        $or: [
          { [`${field}.robotsIndex`]: { $exists: false } },
          { [`${field}.robotsIndex`]: { $ne: false } },
        ],
      },
      { [`${field}.robots`]: { $not: /noindex/i } },
    ],
  };
}

function andQuery(...filters: Array<Record<string, any>>) {
  return { $and: filters };
}

function createEntry(
  path: string,
  modifiedAt: Date,
  changeFrequency: ChangeFrequency,
  priority: number
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    lastModified: modifiedAt,
    changeFrequency,
    priority,
  };
}

function createStaticRoutes(modifiedAt: Date): SitemapEntry[] {
  return [
    createEntry('/', modifiedAt, 'daily', 1),
    createEntry('/celebrity-profiles', modifiedAt, 'daily', 0.9),
    createEntry('/fashion-gallery', modifiedAt, 'daily', 0.9),
    createEntry('/celebrity-news', modifiedAt, 'daily', 0.9),
    createEntry('/movie-details', modifiedAt, 'daily', 0.85),
    createEntry('/upcoming-movies', modifiedAt, 'daily', 0.85),
    createEntry('/reviews', modifiedAt, 'daily', 0.85),
    createEntry('/api-docs', modifiedAt, 'monthly', 0.55),
    createEntry('/api-pricing', modifiedAt, 'monthly', 0.55),
    createEntry('/privacy', modifiedAt, 'yearly', 0.25),
    createEntry('/terms', modifiedAt, 'yearly', 0.25),
    createEntry('/cookie-policy', modifiedAt, 'yearly', 0.25),
  ];
}

function sitemapSources(): SitemapSource[] {
  return [
    {
      model: Celebrity,
      query: andQuery(
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        hasSlugFilter,
        indexableSeoFilter('seo')
      ),
      pathPrefix: '/celebrity-profiles',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      model: CelebrityOutfit,
      query: andQuery(
        {
          $and: [
            { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
            { $or: [{ status: { $exists: false } }, { status: 'published' }] },
          ],
        },
        hasSlugFilter,
        indexableSeoFilter('seo')
      ),
      pathPrefix: '/celebrity-outfits',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      model: UserOutfit,
      query: andQuery(
        { isPublished: true, isApproved: true },
        hasSlugFilter
      ),
      pathPrefix: '/user-outfits',
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      model: CelebrityNews,
      query: andQuery(
        { status: 'published' },
        hasSlugFilter,
        indexableSeoFilter('seo')
      ),
      pathPrefix: '/celebrity-news',
      changeFrequency: 'daily',
      priority: 0.82,
    },
    {
      model: MovieReview,
      query: andQuery(
        { status: 'published' },
        hasSlugFilter,
        indexableSeoFilter('seo'),
        indexableSeoFilter('seoData')
      ),
      pathPrefix: '/reviews',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      model: Movie,
      query: andQuery(
        releasedMovieQuery(),
        hasSlugFilter,
        indexableSeoFilter('seoData')
      ),
      pathPrefix: '/movie-details',
      changeFrequency: 'weekly',
      priority: 0.72,
    },
    {
      model: Movie,
      query: andQuery(
        upcomingMovieQuery(),
        hasSlugFilter,
        indexableSeoFilter('seoData')
      ),
      pathPrefix: '/upcoming-movies',
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}

async function fetchSourceEntries(source: SitemapSource, fallbackDate: Date): Promise<SitemapEntry[]> {
  const docs = await source.model
    .find(source.query)
    .select('slug updatedAt createdAt publishDate releaseDate')
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(SOURCE_LIMIT)
    .lean();

  return docs
    .map((doc: Record<string, unknown>) => {
      const slug = typeof doc.slug === 'string' ? doc.slug.trim() : '';
      if (!slug) return null;

      return createEntry(
        `${source.pathPrefix}/${encodeURIComponent(slug)}`,
        lastModified(doc, fallbackDate),
        source.changeFrequency,
        source.priority
      );
    })
    .filter(Boolean) as SitemapEntry[];
}

function uniqueEntries(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  const byUrl = new Map<string, SitemapEntry>();

  for (const item of entries) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  }

  return Array.from(byUrl.values()).slice(0, MAX_SITEMAP_URLS);
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const fallbackDate = fallbackLastModified();
  const staticRoutes = createStaticRoutes(fallbackDate);

  try {
    await dbConnect();

    const dynamicRoutes = (
      await Promise.all(
        sitemapSources().map((source) => fetchSourceEntries(source, fallbackDate))
      )
    ).flat();

    return uniqueEntries([...staticRoutes, ...dynamicRoutes]);
  } catch {
    return staticRoutes;
  }
}
