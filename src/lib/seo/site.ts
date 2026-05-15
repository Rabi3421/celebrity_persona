import type { Metadata } from 'next';

export const SITE_NAME = 'CelebrityPersona';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://celebritypersona.com').replace(/\/+$/, '');
export const TWITTER_HANDLE = '@CelebrityPersona';
export const DEFAULT_DESCRIPTION =
  'CelebrityPersona covers celebrity profiles, fashion inspiration, entertainment news, movie details, and reviews.';
export const BRAND_ICON = '/icon.png';
export const BRAND_LOGO = '/brand/celebritypersona-logo-dark.svg';
export const DEFAULT_OG_IMAGE = '/og-image.png';

export type MetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  images?: string[];
  imageAlt?: string;
  keywords?: string | string[];
  type?: 'website' | 'article' | 'profile' | 'video.movie' | string;
  noIndex?: boolean;
  noFollow?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player' | string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImages?: string[];
  twitterSite?: string;
  twitterCreator?: string;
};

export function absoluteUrl(pathOrUrl = '/'): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

export function stripHtml(value = ''): string {
  return value
    .replace(/<\/p>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(value = '', length = 155): string {
  const text = stripHtml(value);
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}...`;
}

export function withSiteTitle(title: string): string {
  const trimmed = stripHtml(title || SITE_NAME);
  return trimmed.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? trimmed
    : `${trimmed} | ${SITE_NAME}`;
}

const VALID_OPEN_GRAPH_TYPES = new Set([
  'website',
  'article',
  'book',
  'profile',
  'music.song',
  'music.album',
  'music.playlist',
  'music.radio_station',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other',
]);

const OPEN_GRAPH_TYPE_ALIASES: Record<string, string> = {
  blog: 'article',
  blogposting: 'article',
  news: 'article',
  newsarticle: 'article',
  outfit: 'article',
  person: 'profile',
  celebrity: 'profile',
  film: 'video.movie',
  movie: 'video.movie',
  video: 'video.other',
};

function normalizeOpenGraphType(type?: string, fallback = 'website') {
  const fallbackType = normalizeOpenGraphTypeValue(fallback) || 'website';
  const candidate = normalizeOpenGraphTypeValue(type);

  if (candidate) return candidate;

  if (stripHtml(type || '').trim().toLowerCase() === 'product') {
    return fallbackType === 'website' ? 'website' : fallbackType;
  }

  return fallbackType;
}

function normalizeOpenGraphTypeValue(type?: string) {
  const value = stripHtml(type || '').trim().toLowerCase();
  if (!value) return '';
  if (VALID_OPEN_GRAPH_TYPES.has(value)) return value;
  return OPEN_GRAPH_TYPE_ALIASES[value] || '';
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  images,
  imageAlt,
  keywords,
  type = 'website',
  noIndex = false,
  noFollow = false,
  publishedTime,
  modifiedTime,
  authors,
  ogTitle,
  ogDescription,
  ogType,
  ogSiteName,
  ogLocale,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImages,
  twitterSite,
  twitterCreator,
}: MetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = withSiteTitle(title);
  const finalDescription = truncate(description || DEFAULT_DESCRIPTION, 160);
  const imageList = (images?.length ? images : [image || DEFAULT_OG_IMAGE]).filter(Boolean).map(absoluteUrl);
  const twitterImageList = (twitterImages?.length ? twitterImages : imageList).filter(Boolean).map(absoluteUrl);
  const keywordList = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  const socialTitle = withSiteTitle(ogTitle || title);
  const socialDescription = truncate(ogDescription || finalDescription, 200);
  const xTitle = withSiteTitle(twitterTitle || ogTitle || title);
  const xDescription = truncate(twitterDescription || ogDescription || finalDescription, 200);
  const openGraphType = normalizeOpenGraphType(ogType || type, type);

  return {
    title: { absolute: fullTitle },
    description: finalDescription,
    ...(keywordList ? { keywords: keywordList } : {}),
    alternates: { canonical },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonical,
      siteName: ogSiteName || SITE_NAME,
      locale: ogLocale || 'en_US',
      type: openGraphType as any,
      images: imageList.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: imageAlt || stripHtml(title),
      })),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: twitterCard as any,
      title: xTitle,
      description: xDescription,
      site: twitterSite || TWITTER_HANDLE,
      creator: twitterCreator || TWITTER_HANDLE,
      images: twitterImageList,
    },
  };
}
