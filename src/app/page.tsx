import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import {
  absoluteUrl,
  createItemListJsonLd,
  createMetadata,
  stripHtml,
  truncate,
} from '@/lib/seo/site';
import {
  getCelebrityList,
  getCommunityOutfits,
  getNewsList,
  getOutfitList,
  getUpcomingMovies,
} from '@/lib/seo/publicData';
import HeroSection from './components/HeroSection';
import CelebrityCarousel from './components/CelebrityCarousel';
import FashionBentoGrid from './components/FashionBentoGrid';
import NewsSection from './components/NewsSection';
import MoviesTimeline from './components/MoviesTimeline';
import CommunityUploads from './components/CommunityUploads';
import CTASection from './components/CTASection';
import {
  HOME_DESCRIPTION,
  HOME_HERO_IMAGE,
  HOME_TITLE,
  compactNumber,
  estimateReadTime,
  fallbackArticles,
  fallbackCelebrities,
  fallbackMovies,
  fallbackOutfits,
  fallbackUploads,
  formatDisplayDate,
  isoDate,
  safeImage,
  type HomeArticle,
  type HomeCelebrity,
  type HomeMovie,
  type HomeOutfit,
  type HomeUpload,
} from './components/homepageContent';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
  image: HOME_HERO_IMAGE,
  keywords: [
    'celebrity style',
    'celebrity fashion',
    'celebrity profiles',
    'entertainment news',
    'movie details',
    'movie reviews',
  ],
});

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstImage(...values: unknown[]): string {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      const image = firstImage(...value);
      if (image) return image;
    }
    const src = firstString(value);
    if (src) return safeImage(src);
  }
  return '';
}

function compactList(values: unknown, fallback: string) {
  if (!Array.isArray(values) || values.length === 0) return fallback;
  return values
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'name' in item) return String((item as { name?: string }).name || '');
      return '';
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || fallback;
}

function getCelebrityName(value: unknown, fallback: string) {
  if (value && typeof value === 'object' && 'name' in value) {
    return firstString((value as { name?: string }).name) || fallback;
  }
  return fallback;
}

function toCelebrities(raw: unknown[]): HomeCelebrity[] {
  return raw.map((celebrity: any, index) => {
    const name = firstString(celebrity.name) || `Celebrity profile ${index + 1}`;
    const slug = firstString(celebrity.slug);
    const profession = firstString(celebrity.profession, celebrity.occupation) || 'Celebrity profile';
    const description =
      truncate(firstString(celebrity.introduction, celebrity.description), 145) ||
      `${name} profile with biography, style coverage, movie updates, and entertainment news.`;

    return {
      id: firstString(celebrity.id, celebrity._id) || `celebrity-${index}`,
      name,
      path: slug ? `/celebrity-profiles/${slug}` : '/celebrity-profiles',
      profession,
      image: firstImage(celebrity.profileImage, celebrity.coverImage) || fallbackCelebrities[index % fallbackCelebrities.length].image,
      alt: `${name} celebrity profile photo`,
      description,
      metric: compactNumber(celebrity.viewCount || celebrity.popularityScore, celebrity.isFeatured ? 'Featured profile' : 'Popular profile'),
    };
  });
}

function toArticles(raw: unknown[]): HomeArticle[] {
  return raw.map((article: any, index) => {
    const title = firstString(article.title, article.headline) || `Celebrity article ${index + 1}`;
    const slug = firstString(article.slug);
    const excerpt =
      truncate(firstString(article.excerpt, stripHtml(article.content || '')), 160) ||
      'Latest entertainment news, celebrity fashion coverage, and culture updates.';
    const celebrityName = getCelebrityName(article.celebrity, firstString(article.celebrityName));

    return {
      id: firstString(article.id, article._id) || `article-${index}`,
      title,
      path: slug ? `/celebrity-news/${slug}` : '/celebrity-news',
      excerpt,
      image: firstImage(article.thumbnail, article.images) || fallbackArticles[index % fallbackArticles.length].image,
      alt: `${title} article image`,
      category: firstString(article.category) || 'Celebrity news',
      date: formatDisplayDate(article.publishDate || article.createdAt),
      dateTime: isoDate(article.publishDate || article.createdAt),
      readTime: estimateReadTime(`${title} ${excerpt}`),
      celebrity: celebrityName || undefined,
    };
  });
}

function toOutfits(raw: unknown[]): HomeOutfit[] {
  return raw.map((outfit: any, index) => {
    const celebrityName = getCelebrityName(outfit.celebrity, firstString(outfit.celebrityName, outfit.name, 'Celebrity style'));
    const title = firstString(outfit.title) || `${celebrityName} outfit`;
    const slug = firstString(outfit.slug);
    const description =
      truncate(firstString(outfit.description), 150) ||
      `${celebrityName} inspired outfit with shoppable style details and fashion notes.`;

    return {
      id: firstString(outfit.id, outfit._id) || `outfit-${index}`,
      title,
      path: slug ? `/celebrity-outfits/${slug}` : '/fashion-gallery',
      celebrityName,
      occasion: firstString(outfit.event, outfit.category) || 'Celebrity style',
      image: firstImage(outfit.images, outfit.image) || fallbackOutfits[index % fallbackOutfits.length].image,
      alt: `${title} celebrity outfit`,
      price: firstString(outfit.price),
      description,
    };
  });
}

function toMovies(raw: unknown[]): HomeMovie[] {
  return raw.map((movie: any, index) => {
    const title = firstString(movie.title) || `Upcoming movie ${index + 1}`;
    const slug = firstString(movie.slug);
    const synopsis =
      truncate(firstString(movie.synopsis, movie.description), 150) ||
      `${title} release information, cast details, posters, and movie updates.`;

    return {
      id: firstString(movie.id, movie._id) || `movie-${index}`,
      title,
      path: slug ? `/upcoming-movies/${slug}` : '/upcoming-movies',
      releaseDate: formatDisplayDate(movie.releaseDate, 'Release date to be announced'),
      dateTime: isoDate(movie.releaseDate),
      cast: compactList(movie.cast, 'Cast details coming soon'),
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : firstString(movie.genre) || 'Movie',
      poster: firstImage(movie.poster, movie.backdrop, movie.images) || fallbackMovies[index % fallbackMovies.length].poster,
      alt: `${title} movie poster`,
      description: synopsis,
    };
  });
}

function toUploads(raw: unknown[]): HomeUpload[] {
  return raw.map((upload: any, index) => {
    const title = firstString(upload.title, upload.description) || `Community outfit ${index + 1}`;
    const slug = firstString(upload.slug);
    const userName = getCelebrityName(upload.userId, firstString(upload.uploaderName, 'Community member'));

    return {
      id: firstString(upload.id, upload._id) || `upload-${index}`,
      title,
      path: slug ? `/user-outfits/${slug}` : '/fashion-gallery',
      uploaderName: userName,
      image: firstImage(upload.images, upload.image) || fallbackUploads[index % fallbackUploads.length].image,
      alt: `${title} community outfit`,
      category: firstString(upload.category) || 'Community style',
      views: compactNumber(upload.views, 'New'),
      likes: Array.isArray(upload.likes) ? compactNumber(upload.likes.length, '0') : compactNumber(upload.likesCount, '0'),
    };
  });
}

async function getHomepageData() {
  const [celebrityResult, outfitResult, newsResult, upcomingResult, communityResult] = await Promise.all([
    getCelebrityList({ limit: 6, sort: 'popular' }),
    getOutfitList({ limit: 8 }),
    getNewsList({ limit: 7 }),
    getUpcomingMovies({ limit: 6 }),
    getCommunityOutfits({ limit: 6 }),
  ]);

  return {
    celebrities: toCelebrities((celebrityResult.celebrities || []) as unknown[]),
    outfits: toOutfits((outfitResult.data || []) as unknown[]),
    articles: toArticles((newsResult.data || []) as unknown[]),
    movies: toMovies((upcomingResult.data || []) as unknown[]),
    uploads: toUploads((communityResult || []) as unknown[]),
  };
}

export default async function Homepage() {
  const data = await getHomepageData();
  const celebrities = data.celebrities.length > 0 ? data.celebrities : fallbackCelebrities;
  const articles = data.articles.length > 0 ? data.articles : fallbackArticles;
  const outfits = data.outfits.length > 0 ? data.outfits : fallbackOutfits;
  const movies = data.movies.length > 0 ? data.movies : fallbackMovies;
  const uploads = data.uploads.length > 0 ? data.uploads : fallbackUploads;
  const heroImage = celebrities[0]?.image || articles[0]?.image || HOME_HERO_IMAGE;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: absoluteUrl('/'),
      primaryImageOfPage: absoluteUrl(safeImage(heroImage, HOME_HERO_IMAGE)),
      isPartOf: {
        '@type': 'WebSite',
        name: 'CelebrityPersona',
        url: absoluteUrl('/'),
      },
    },
    createItemListJsonLd(
      'Featured celebrity profiles',
      '/',
      celebrities.slice(0, 6).map((celebrity) => ({
        name: celebrity.name,
        path: celebrity.path,
        image: celebrity.image,
        description: celebrity.description,
      }))
    ),
    createItemListJsonLd(
      'Latest celebrity articles',
      '/',
      articles.slice(0, 6).map((article) => ({
        name: article.title,
        path: article.path,
        image: article.image,
        description: article.excerpt,
      }))
    ),
  ];

  return (
    <>
      <PublicHeader />
      <main id="main-content" className="min-h-screen bg-background">
        <HeroSection
          heroImage={heroImage}
          featuredCelebrity={celebrities[0]}
          latestArticle={articles[0]}
        />
        <CelebrityCarousel celebrities={celebrities} />
        <FashionBentoGrid outfits={outfits} />
        <NewsSection articles={articles} />
        <MoviesTimeline movies={movies} />
        <CommunityUploads uploads={uploads} />
        <CTASection />
      </main>
      <JsonLd data={jsonLd} />
      <PublicFooter />
    </>
  );
}
