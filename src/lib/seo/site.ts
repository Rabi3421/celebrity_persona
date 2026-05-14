import type { Metadata } from 'next';

export const SITE_NAME = 'CelebrityPersona';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://celebritypersona.com').replace(/\/+$/, '');
export const TWITTER_HANDLE = '@CelebrityPersona';
export const DEFAULT_DESCRIPTION =
  'CelebrityPersona covers celebrity profiles, fashion inspiration, entertainment news, movie details, and reviews.';
export const DEFAULT_OG_IMAGE = '/assets/images/no_image.png';

type MetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  images?: string[];
  keywords?: string | string[];
  type?: 'website' | 'article' | 'profile' | 'video.movie';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
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

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  images,
  keywords,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  authors,
}: MetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const imageList = (images?.length ? images : [image || DEFAULT_OG_IMAGE]).filter(Boolean).map(absoluteUrl);
  const keywordList = Array.isArray(keywords) ? keywords.join(', ') : keywords;

  return {
    title: { absolute: fullTitle },
    description,
    ...(keywordList ? { keywords: keywordList } : {}),
    alternates: { canonical },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: type as any,
      images: imageList.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: title,
      })),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      images: imageList,
    },
  };
}

export function createBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createItemListJsonLd(
  name: string,
  path: string,
  items: Array<{ name: string; path: string; image?: string; description?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(item.path),
      item: {
        '@type': 'Thing',
        name: item.name,
        url: absoluteUrl(item.path),
        ...(item.image ? { image: absoluteUrl(item.image) } : {}),
        ...(item.description ? { description: truncate(item.description, 200) } : {}),
      },
    })),
  };
}

export function createWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/celebrity-profiles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function createOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.ico'),
    sameAs: [
      'https://twitter.com',
      'https://facebook.com',
      'https://linkedin.com',
    ],
  };
}
