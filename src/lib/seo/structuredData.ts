import 'server-only';

import {
  BRAND_ICON,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  stripHtml,
  truncate,
} from './site';

export type JsonLdSchema = Record<string, any>;
export type BreadcrumbItem = { name: string; path: string };

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function namedText(value: unknown): string {
  if (value && typeof value === 'object') {
    return text((value as Record<string, unknown>).name);
  }

  return text(value);
}

function textArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(namedText).filter(Boolean);
  const single = namedText(value);
  return single ? [single] : [];
}

function dateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function imageArray(...values: unknown[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      result.push(...imageArray(...value));
      continue;
    }

    const src = text(value);
    if (src) result.push(absoluteUrl(src));
  }

  return Array.from(new Set(result));
}

function personName(value: unknown, fallback = SITE_NAME): string {
  return namedText(value) || fallback;
}

function slugPart(value: string): string {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item-list';
}

function configuredSameAs(): string[] {
  return [
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_X_URL,
    process.env.NEXT_PUBLIC_TWITTER_URL,
    process.env.NEXT_PUBLIC_YOUTUBE_URL,
    process.env.NEXT_PUBLIC_LINKEDIN_URL,
  ].map(text).filter(Boolean);
}

function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => compact(item))
      .filter((item) => item !== undefined && item !== null && item !== '') as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => {
        if (item === undefined || item === null || item === '') return false;
        if (Array.isArray(item) && item.length === 0) return false;
        return !(typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0);
      });

    return Object.fromEntries(entries) as T;
  }

  return value;
}

export function createOrganizationSchema(): JsonLdSchema {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: absoluteUrl(BRAND_ICON),
      width: 512,
      height: 512,
    },
    image: absoluteUrl(BRAND_ICON),
    sameAs: configuredSameAs(),
  });
}

export function createWebsiteSchema(): JsonLdSchema {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/celebrity-profiles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

export function createWebPageSchema({
  name,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
}: {
  name: string;
  description?: string;
  path?: string;
  image?: string;
}): JsonLdSchema {
  const url = absoluteUrl(path);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}/#webpage`,
    name,
    description: truncate(description, 200),
    url,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    primaryImageOfPage: image
      ? {
          '@type': 'ImageObject',
          url: absoluteUrl(image),
        }
      : undefined,
  });
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdSchema {
  const last = items[items.length - 1];

  return compact({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(last?.path || '/')}/#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

export function createFAQPageSchema(
  items: Array<{ question: string; answer: string }>,
  path: string
): JsonLdSchema {
  const url = absoluteUrl(path);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}/#faq`,
    url,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: truncate(item.answer, 500),
      },
    })),
  });
}

export function createItemListSchema(
  name: string,
  path: string,
  items: Array<{ name: string; path: string; image?: string; description?: string }>
): JsonLdSchema {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}/#${slugPart(name)}`,
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
        image: item.image ? absoluteUrl(item.image) : undefined,
        description: item.description ? truncate(item.description, 200) : undefined,
      },
    })),
  });
}

export function createPersonSchema(celebrity: Record<string, any>): JsonLdSchema {
  const profileUrl = absoluteUrl(`/celebrity-profiles/${celebrity.slug}`);
  const social = celebrity.socialMedia || {};
  const sameAs = [
    social.instagram,
    social.twitter,
    social.facebook,
    social.youtube,
    social.tiktok,
    social.threads,
    social.imdb,
    social.wikipedia,
    social.website,
  ].filter(Boolean);
  const occupation = textArray(celebrity.occupation);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${profileUrl}/#person`,
    name: celebrity.name,
    url: profileUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': profileUrl },
    description: truncate(celebrity.introduction || celebrity.bio || '', 300),
    image: imageArray(celebrity.profileImage, celebrity.coverImage, celebrity.galleryImages),
    birthDate: dateValue(celebrity.born),
    birthPlace: celebrity.birthPlace ? { '@type': 'Place', name: celebrity.birthPlace } : undefined,
    deathDate: dateValue(celebrity.died),
    nationality: celebrity.nationality ? { '@type': 'Country', name: celebrity.nationality } : undefined,
    jobTitle: occupation.join(', ') || text(celebrity.profession),
    hasOccupation: occupation.map((name) => ({ '@type': 'Occupation', name })),
    height: celebrity.height ? { '@type': 'QuantitativeValue', description: celebrity.height } : undefined,
    weight: celebrity.weight ? { '@type': 'QuantitativeValue', description: celebrity.weight } : undefined,
    award: Array.isArray(celebrity.awards)
      ? celebrity.awards.map((award: Record<string, unknown>) =>
          [award.title, award.organization, award.year].filter(Boolean).join(' - ')
        )
      : undefined,
    spouse: celebrity.spouse
      ? { '@type': 'Person', name: celebrity.spouse }
      : Array.isArray(celebrity.marriages) && celebrity.marriages[0]?.name
        ? { '@type': 'Person', name: celebrity.marriages[0].name }
        : undefined,
    parent: textArray(celebrity.parents).map((name) => ({ '@type': 'Person', name })),
    children: textArray(celebrity.children).map((name) => ({ '@type': 'Person', name })),
    sameAs,
    knowsAbout: textArray(celebrity.categories),
  });
}

export function createNewsArticleSchema(article: Record<string, any>): JsonLdSchema {
  const url = absoluteUrl(`/celebrity-news/${article.slug}`);
  const schema = article.schema || {};
  const seo = article.seo || {};
  const description = schema.schemaDescription || seo.metaDescription || article.excerpt || truncate(article.body || article.content, 200) || DEFAULT_DESCRIPTION;

  return compact({
    '@context': 'https://schema.org',
    '@type': schema.schemaType || seo.schemaType || 'NewsArticle',
    '@id': `${url}/#newsarticle`,
    headline: schema.schemaHeadline || article.title,
    description,
    image: imageArray(schema.schemaImage || article.featuredImage || article.thumbnail, article.images),
    datePublished: dateValue(article.publishedAt || article.publishDate || article.createdAt),
    dateModified: dateValue(article.updatedAt || article.publishedAt || article.publishDate || article.createdAt),
    author: { '@type': 'Person', name: article.authorName || article.author || SITE_NAME },
    publisher: schema.publisherName
      ? { '@type': 'Organization', name: schema.publisherName, logo: schema.publisherLogo ? { '@type': 'ImageObject', url: schema.publisherLogo } : undefined }
      : { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': schema.mainEntityOfPage || url },
    url,
    articleSection: schema.schemaArticleSection || article.category,
    keywords: textArray(schema.schemaKeywords || seo.contentTags || article.tags).join(', '),
    articleBody: stripHtml(article.body || article.content || '').slice(0, 5000),
    isAccessibleForFree: true,
  });
}

export function createOutfitArticleSchema(outfit: Record<string, any>): JsonLdSchema {
  const url = absoluteUrl(`/celebrity-outfits/${outfit.slug}`);
  const celebrityName = personName(outfit.primaryCelebrity || outfit.celebrity, 'Celebrity');
  const seo = outfit.seo || {};
  const schema = outfit.schema || {};
  const featuredImage = schema.schemaImage || seo.ogImage || outfit.featuredImage || outfit.images?.[0];

  return compact({
    '@context': 'https://schema.org',
    '@type': schema.schemaType || 'Article',
    '@id': `${url}/#article`,
    headline: schema.schemaHeadline || seo.metaTitle || outfit.title,
    description: schema.schemaDescription || seo.metaDescription || outfit.excerpt || outfit.outfitDescription || outfit.description || `${outfit.title} worn by ${celebrityName}`,
    image: imageArray([featuredImage, ...(outfit.images || [])].filter(Boolean)),
    datePublished: dateValue(outfit.publishedAt || outfit.createdAt),
    dateModified: dateValue(outfit.updatedAt || outfit.publishedAt || outfit.createdAt),
    author: outfit.authorName ? { '@type': 'Person', name: outfit.authorName } : { '@id': ORGANIZATION_ID },
    publisher: schema.publisherName
      ? { '@type': 'Organization', name: schema.publisherName, logo: schema.publisherLogo ? { '@type': 'ImageObject', url: schema.publisherLogo } : undefined }
      : { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': schema.mainEntityOfPage || url },
    url,
    articleSection: schema.schemaArticleSection || outfit.category || outfit.eventName || outfit.event || 'Celebrity Fashion',
    keywords: textArray(schema.schemaKeywords || seo.secondaryKeywords || seo.contentTags || outfit.tags).concat([
      celebrityName,
      outfit.title,
      outfit.brand,
      outfit.designer,
      outfit.category,
      outfit.outfitType,
      outfit.eventName || outfit.event,
      'celebrity outfit',
      'celebrity fashion',
    ]).filter(Boolean).join(', '),
    about: { '@type': 'Person', name: celebrityName },
    mentions: [
      outfit.brand ? { '@type': 'Brand', name: outfit.brand } : undefined,
      outfit.designer ? { '@type': 'Person', name: outfit.designer } : undefined,
    ].filter(Boolean),
    isAccessibleForFree: true,
  });
}

export function createOutfitProductSchemas(outfit: Record<string, any>): JsonLdSchema[] {
  if (outfit.schema?.enableProductSchema === false) return [];
  const pageImage = outfit.featuredImage || outfit.images?.[0];
  const products = [
    outfit.originalOutfitAvailable && (outfit.originalProductName || outfit.originalBuyUrl || outfit.originalAffiliateUrl)
      ? {
          productName: outfit.originalProductName || outfit.title,
          productImage: pageImage,
          productBrand: outfit.originalBrand || outfit.brand,
          productPrice: outfit.originalPrice || outfit.price,
          productCurrency: outfit.originalCurrency,
          productBuyUrl: outfit.originalBuyUrl,
          affiliateUrl: outfit.originalAffiliateUrl,
          storeName: outfit.originalBrand || outfit.brand,
          availability: outfit.productAvailability,
        }
      : null,
    ...(Array.isArray(outfit.similarProducts) ? outfit.similarProducts : []),
  ].filter(Boolean);

  return products
    .filter((product: any) => product.productName && (product.productImage || pageImage))
    .map((product: any) => compact({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.productName,
      image: product.productImage || pageImage,
      brand: product.productBrand ? { '@type': 'Brand', name: product.productBrand } : undefined,
      category: product.productCategory,
      offers: (product.productBuyUrl || product.affiliateUrl)
        ? compact({
            '@type': 'Offer',
            url: product.affiliateUrl || product.productBuyUrl,
            price: product.productPrice,
            priceCurrency: product.productCurrency,
            availability: product.availability ? `https://schema.org/${String(product.availability).replace(/\s+/g, '')}` : undefined,
          })
        : undefined,
    }));
}

export function createCommunityOutfitArticleSchema(outfit: Record<string, any>): JsonLdSchema {
  const url = absoluteUrl(`/user-outfits/${outfit.slug}`);
  const creator = personName(outfit.userId, 'Community member');

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}/#article`,
    headline: outfit.title,
    description: outfit.description || `${outfit.title} community outfit on ${SITE_NAME}`,
    image: imageArray(outfit.images),
    datePublished: dateValue(outfit.createdAt),
    dateModified: dateValue(outfit.updatedAt || outfit.createdAt),
    author: { '@type': 'Person', name: creator },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: outfit.category || 'Community Fashion',
    keywords: [outfit.title, outfit.brand, outfit.category, ...textArray(outfit.tags)].filter(Boolean).join(', '),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: outfit.views || 0 },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: outfit.likes?.length || 0 },
    ],
    isAccessibleForFree: true,
  });
}

export function createMovieSchema(movie: Record<string, any>, path: string): JsonLdSchema {
  const url = absoluteUrl(path);
  const ratingValue = Number(movie.anticipationScore);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Movie',
    '@id': `${url}/#movie`,
    name: movie.title,
    url,
    image: imageArray(movie.poster, movie.backdrop, movie.images),
    datePublished: dateValue(movie.releaseDate),
    genre: movie.genre,
    director: movie.director ? { '@type': 'Person', name: movie.director } : undefined,
    actor: Array.isArray(movie.cast)
      ? movie.cast.slice(0, 10).map((member: Record<string, unknown>) => ({ '@type': 'Person', name: member.name }))
      : undefined,
    description: stripHtml(movie.synopsis || movie.plotSummary || '').slice(0, 500),
    duration: movie.duration ? `PT${movie.duration}M` : undefined,
    aggregateRating: Number.isFinite(ratingValue)
      ? { '@type': 'AggregateRating', ratingValue, bestRating: 10, ratingCount: 1 }
      : undefined,
  });
}

export function createReviewSchema(review: Record<string, any>): JsonLdSchema {
  const url = absoluteUrl(`/reviews/${review.slug}`);
  const ratingValue = Number(review.rating);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${url}/#review`,
    name: review.title,
    url,
    image: imageArray(review.poster, review.backdropImage),
    datePublished: dateValue(review.publishDate || review.createdAt),
    dateModified: dateValue(review.updatedAt || review.publishDate || review.createdAt),
    reviewBody: stripHtml(review.content || review.excerpt || review.verdict || '').slice(0, 5000),
    reviewRating: Number.isFinite(ratingValue)
      ? {
          '@type': 'Rating',
          ratingValue,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    author: { '@type': 'Person', name: review.author?.name || SITE_NAME },
    publisher: { '@id': ORGANIZATION_ID },
    itemReviewed: {
      '@type': 'Movie',
      name: review.movieTitle,
      image: review.poster ? absoluteUrl(review.poster) : undefined,
      dateCreated: review.movieDetails?.releaseYear,
      director: review.movieDetails?.director
        ? { '@type': 'Person', name: review.movieDetails.director }
        : undefined,
    },
  });
}

function schemaKey(schema: JsonLdSchema): string {
  const type = Array.isArray(schema['@type']) ? schema['@type'].join(',') : text(schema['@type']);
  return [
    type,
    text(schema['@id']),
    text(schema.url),
    text(schema.name || schema.headline),
  ].filter(Boolean).join('|');
}

export function dedupeStructuredData(data: JsonLdSchema | JsonLdSchema[]): JsonLdSchema | JsonLdSchema[] {
  const list = Array.isArray(data) ? data : [data];
  const seen = new Set<string>();
  const result: JsonLdSchema[] = [];

  for (const item of list) {
    const schema = compact(item);
    const key = schemaKey(schema);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push(schema);
  }

  return Array.isArray(data) ? result : result[0] || {};
}
