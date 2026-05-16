import 'server-only';

import type { Metadata } from 'next';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_HANDLE,
  createMetadata,
  stripHtml,
  truncate,
} from './site';
import { getCelebrityKeywordSet } from './celebrityProfile';

type AnyRecord = Record<string, any>;

export type SeoSource = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  keywords?: string[];
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogUrl?: string;
  ogImage?: string;
  ogImages?: string[];
  ogLocale?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: string[];
  focusKeyword?: string;
  relatedTopics?: string[];
};

type DynamicMetadataInput = {
  seo?: SeoSource | null;
  title: string;
  description?: string;
  path: string;
  images?: Array<string | undefined | null>;
  imageAlt?: string;
  keywords?: Array<string | undefined | null> | string;
  type?: 'website' | 'article' | 'profile' | 'video.movie' | string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: Array<string | undefined | null>;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function unique(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = text(raw);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function hasRobotsDirective(seo: SeoSource | null | undefined, directive: 'noindex' | 'nofollow') {
  return text(seo?.robots)
    .toLowerCase()
    .split(',')
    .map((item) => item.trim())
    .includes(directive);
}

export function pickSeoSource(...sources: Array<SeoSource | null | undefined>): SeoSource {
  return sources.find(Boolean) || {};
}

export function isNoIndex(seo?: SeoSource | null) {
  return seo?.noindex === true || seo?.robotsIndex === false || hasRobotsDirective(seo, 'noindex');
}

export function isNoFollow(seo?: SeoSource | null) {
  return seo?.nofollow === true || seo?.robotsFollow === false || hasRobotsDirective(seo, 'nofollow');
}

export function createDynamicSeoMetadata({
  seo,
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  images = [],
  imageAlt,
  keywords = [],
  type = 'website',
  publishedTime,
  modifiedTime,
  authors = [],
}: DynamicMetadataInput): Metadata {
  const source = seo || {};
  const finalTitle = text(source.metaTitle) || title;
  const finalDescription = text(source.metaDescription) || truncate(description, 155);
  const fallbackKeywords = Array.isArray(keywords) ? keywords : [keywords];
  const keywordList = unique([
    ...textArray(source.metaKeywords),
    ...textArray(source.keywords),
    text(source.focusKeyword),
    ...textArray(source.tags),
    ...textArray(source.relatedTopics),
    ...fallbackKeywords,
  ]);
  const ogImages = unique([
    ...(source.ogImages || []),
    source.ogImage,
    ...images,
    DEFAULT_OG_IMAGE,
  ]);
  const twitterImages = unique([
    source.twitterImage,
    ...ogImages,
  ]);
  const authorList = unique([
    text(source.authorName),
    ...authors,
  ]);

  return createMetadata({
    title: finalTitle,
    description: finalDescription,
    path: text(source.canonicalUrl) || path,
    images: ogImages,
    imageAlt: imageAlt || finalTitle,
    keywords: keywordList,
    type,
    noIndex: isNoIndex(source),
    noFollow: isNoFollow(source),
    publishedTime: text(source.publishedTime) || publishedTime,
    modifiedTime: text(source.modifiedTime) || modifiedTime,
    authors: authorList,
    ogTitle: text(source.ogTitle) || finalTitle,
    ogDescription: text(source.ogDescription) || finalDescription,
    ogType: text(source.ogType) || undefined,
    ogSiteName: text(source.ogSiteName) || SITE_NAME,
    ogLocale: text(source.ogLocale) || 'en_US',
    twitterCard: text(source.twitterCard) || 'summary_large_image',
    twitterTitle: text(source.twitterTitle) || text(source.ogTitle) || finalTitle,
    twitterDescription: text(source.twitterDescription) || text(source.ogDescription) || finalDescription,
    twitterImages,
    twitterSite: text(source.twitterSite) || TWITTER_HANDLE,
    twitterCreator: text(source.twitterCreator) || TWITTER_HANDLE,
  });
}

export function createNoIndexMetadata(title: string, description: string, path: string): Metadata {
  return createMetadata({
    title,
    description,
    path,
    noIndex: true,
    noFollow: true,
  });
}

function occupationText(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ');
  return text(value);
}

function personName(value: unknown, fallback = 'Celebrity') {
  if (value && typeof value === 'object') {
    const name = text((value as AnyRecord).name);
    if (name) return name;
  }
  return text(value) || fallback;
}

function castKeywords(cast: unknown) {
  if (!Array.isArray(cast)) return [];
  return cast
    .map((member) => {
      if (typeof member === 'string') return member;
      if (member && typeof member === 'object') return text((member as AnyRecord).name);
      return '';
    })
    .filter(Boolean)
    .slice(0, 8);
}

export function createCelebrityProfileMetadata(celebrity: AnyRecord): Metadata {
  const name = text(celebrity.name) || 'Celebrity Profile';
  const occupation = occupationText(celebrity.occupation || celebrity.profession);
  const description =
    truncate(celebrity.introduction || celebrity.bio || '', 155) ||
    `Explore ${name}'s celebrity profile, biography, movies, career highlights, and fashion coverage.`;

  return createDynamicSeoMetadata({
    seo: pickSeoSource(celebrity.seo, celebrity.seoData),
    title: `${name} - Celebrity Profile`,
    description,
    path: `/celebrity-profiles/${celebrity.slug}`,
    images: [celebrity.coverImage, celebrity.profileImage],
    imageAlt: `${name} celebrity profile`,
    type: 'profile',
    keywords: getCelebrityKeywordSet(celebrity),
    publishedTime: celebrity.createdAt,
    modifiedTime: celebrity.updatedAt,
  });
}

export function createCelebrityOutfitMetadata(outfit: AnyRecord): Metadata {
  const celebrityName = personName(outfit.primaryCelebrity || outfit.celebrity);
  const title = text(outfit.title) || `${celebrityName} outfit`;
  const seo: AnyRecord = pickSeoSource(outfit.seo, outfit.seoData) as AnyRecord;
  const description =
    truncate(outfit.excerpt || outfit.outfitDescription || outfit.description || '', 155) ||
    `Shop ${celebrityName}'s ${title}. Discover brand details, designer notes, and celebrity fashion inspiration.`;

  return createDynamicSeoMetadata({
    seo,
    title: `${title} | ${celebrityName} Outfit`,
    description,
    path: `/celebrity-outfits/${outfit.slug}`,
    images: [seo.ogImage, outfit.featuredImage, ...(Array.isArray(outfit.images) ? outfit.images : [outfit.image])].filter(Boolean),
    imageAlt: outfit.featuredImageAlt || `${title} celebrity outfit`,
    type: 'article',
    keywords: [
      celebrityName,
      title,
      outfit.brand,
      outfit.designer,
      outfit.category,
      outfit.outfitType,
      outfit.eventName || outfit.event,
      seo.focusKeyword,
      ...(seo.secondaryKeywords || []),
      'celebrity outfit',
      'shop the look',
      'celebrity fashion',
    ],
    publishedTime: outfit.publishedAt || outfit.createdAt,
    modifiedTime: outfit.updatedAt,
  });
}

export function createCommunityOutfitMetadata(outfit: AnyRecord): Metadata {
  const title = text(outfit.title) || 'Community Outfit';
  const creator = personName(outfit.userId, 'Community member');
  const description =
    truncate(outfit.description || '', 155) ||
    `Browse ${title}, a celebrity-inspired community outfit shared by ${creator}.`;

  return createDynamicSeoMetadata({
    seo: pickSeoSource(outfit.seo, outfit.seoData),
    title: `${title} - Community Outfit`,
    description,
    path: `/user-outfits/${outfit.slug}`,
    images: Array.isArray(outfit.images) ? outfit.images : [outfit.image],
    imageAlt: `${title} community outfit`,
    type: 'article',
    keywords: [
      title,
      outfit.brand,
      outfit.category,
      ...(outfit.tags || []),
      'community outfit',
      'celebrity inspired outfit',
      'celebrity fashion',
    ],
    publishedTime: outfit.createdAt,
    modifiedTime: outfit.updatedAt,
    authors: [creator],
  });
}

export function createNewsArticleMetadata(article: AnyRecord): Metadata {
  const title = text(article.title) || 'Celebrity News';
  const description =
    truncate(article.excerpt || article.body || article.content || '', 155) ||
    'Read the latest celebrity news, entertainment updates, fashion stories, and culture coverage.';
  const seo = pickSeoSource(article.seo, article.seoData);

  return createDynamicSeoMetadata({
    seo: {
      ...seo,
      metaTitle: seo.metaTitle || article.metaTitle,
      metaDescription: seo.metaDescription || article.metaDescription,
      canonicalUrl: seo.canonicalUrl || article.canonicalUrl,
      noindex: seo.noindex ?? article.robotsIndex === false,
      nofollow: seo.nofollow ?? article.robotsFollow === false,
      ogTitle: seo.ogTitle || article.ogTitle,
      ogDescription: seo.ogDescription || article.ogDescription,
      ogImages: seo.ogImages || [seo.ogImage || article.ogImage].filter(Boolean),
      twitterTitle: seo.twitterTitle || article.twitterTitle,
      twitterDescription: seo.twitterDescription || article.twitterDescription,
      twitterImage: seo.twitterImage || article.twitterImage,
    },
    title,
    description,
    path: `/celebrity-news/${article.slug}`,
    images: [article.featuredImage || article.thumbnail, article.seo?.ogImage, ...(Array.isArray(article.images) ? article.images : [])],
    imageAlt: article.featuredImageAlt || `${title} article image`,
    type: 'article',
    keywords: [article.category, article.newsType, ...(article.seo?.contentTags || article.tags || []), 'celebrity news', 'entertainment news'],
    publishedTime: article.publishedAt || article.publishDate || article.createdAt,
    modifiedTime: article.updatedAt,
    authors: [article.authorName || article.author],
  });
}

export function createMovieReviewMetadata(review: AnyRecord): Metadata {
  const title = text(review.title) || `${review.movieTitle || 'Movie'} Review`;
  const description =
    truncate(review.excerpt || review.content || review.verdict || '', 155) ||
    `Read ${review.movieTitle || 'this movie'} review, rating, verdict, cast notes, and audience context.`;

  return createDynamicSeoMetadata({
    seo: pickSeoSource(review.seoData, review.seo),
    title,
    description,
    path: `/reviews/${review.slug}`,
    images: [review.backdropImage, review.poster],
    imageAlt: `${title} review image`,
    type: 'article',
    keywords: [
      review.title,
      review.movieTitle,
      'movie review',
      'film review',
      ...(review.pros || []),
      ...(review.cons || []),
    ],
    publishedTime: review.publishDate || review.createdAt,
    modifiedTime: review.updatedAt,
    authors: [review.author?.name],
  });
}

export function createMoviePageMetadata(movie: AnyRecord, kind: 'released' | 'upcoming'): Metadata {
  const title = text(movie.title) || 'Movie Details';
  const isUpcoming = kind === 'upcoming';
  const description =
    truncate(movie.synopsis || movie.plotSummary || movie.productionNotes || '', 155) ||
    (isUpcoming
      ? `Everything about ${title}: release date, cast, trailers, tickets, and upcoming movie updates.`
      : `Explore ${title}: cast, director, synopsis, trailer, reviews, and movie details.`);

  return createDynamicSeoMetadata({
    seo: pickSeoSource(movie.seoData, movie.seo),
    title: `${title} | ${isUpcoming ? 'Upcoming Movie' : 'Movie Details'}`,
    description,
    path: `/${isUpcoming ? 'upcoming-movies' : 'movie-details'}/${movie.slug}`,
    images: [movie.backdrop, movie.poster, ...(Array.isArray(movie.images) ? movie.images : [])],
    imageAlt: `${title} movie poster`,
    type: 'video.movie',
    keywords: [
      title,
      movie.director,
      movie.studio,
      ...(movie.genre || []),
      ...castKeywords(movie.cast),
      isUpcoming ? 'upcoming movie' : 'movie details',
    ],
    publishedTime: movie.createdAt,
    modifiedTime: movie.updatedAt,
    authors: [movie.seoData?.authorName, movie.seo?.authorName],
  });
}
