import mongoose from 'mongoose';

export const NEWS_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export const NEWS_SCHEMA_TYPES = ['NewsArticle', 'Article', 'BlogPosting'] as const;

export type NewsStatus = (typeof NEWS_STATUSES)[number];

const SITE_URL = 'https://www.celebritypersona.com';

export function slugifyNewsTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function estimateReadingTime(...values: Array<string | undefined>) {
  const words = stripHtml(values.filter(Boolean).join(' ')).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => stringValue(item)).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function dateValue(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isValidObjectId(value: unknown) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function optionalObjectId(value: unknown) {
  return isValidObjectId(value) ? value : null;
}

export function publicNewsFilter(extra: Record<string, any> = {}) {
  return { ...extra, status: 'published' };
}

export function normalizeNewsPayload(body: any, existing: any = {}) {
  const title = stringValue(body.title ?? existing.title);
  const slug = stringValue(body.slug) || (title ? slugifyNewsTitle(title) : existing.slug);
  const excerpt = stringValue(body.excerpt ?? existing.excerpt);
  const introduction = stringValue(body.introduction ?? existing.introduction);
  const content = stringValue(body.body ?? body.content ?? existing.body ?? existing.content);
  const featuredImage = stringValue(body.featuredImage ?? body.thumbnail ?? existing.featuredImage ?? existing.thumbnail);
  const authorName = stringValue(body.authorName ?? body.author ?? existing.authorName ?? existing.author);
  const publishedAt = dateValue(body.publishedAt ?? body.publishDate ?? existing.publishedAt ?? existing.publishDate);
  const isFeatured = Boolean(body.isFeatured ?? body.featured ?? existing.isFeatured ?? existing.featured);
  const seo = { ...(existing.seo || {}), ...(body.seo || {}) };
  const schema = { ...(existing.schema || {}), ...(body.schema || {}) };

  seo.focusKeyword = stringValue(body.focusKeyword ?? seo.focusKeyword);
  seo.secondaryKeywords = stringArray(body.secondaryKeywords ?? seo.secondaryKeywords ?? seo.metaKeywords);
  seo.metaKeywords = seo.secondaryKeywords;
  seo.metaTitle = stringValue(body.metaTitle ?? seo.metaTitle);
  seo.metaDescription = stringValue(body.metaDescription ?? seo.metaDescription);
  seo.canonicalUrl = stringValue(body.canonicalUrl ?? seo.canonicalUrl);
  seo.robotsIndex = body.robotsIndex ?? seo.robotsIndex ?? (seo.noindex === undefined ? true : !seo.noindex);
  seo.robotsFollow = body.robotsFollow ?? seo.robotsFollow ?? (seo.nofollow === undefined ? true : !seo.nofollow);
  seo.noindex = seo.robotsIndex === false;
  seo.nofollow = seo.robotsFollow === false;
  seo.robots = `${seo.robotsIndex === false ? 'noindex' : 'index'},${seo.robotsFollow === false ? 'nofollow' : 'follow'}`;
  seo.ogTitle = stringValue(body.ogTitle ?? seo.ogTitle);
  seo.ogDescription = stringValue(body.ogDescription ?? seo.ogDescription);
  seo.ogImage = stringValue(body.ogImage ?? seo.ogImage);
  seo.ogImages = seo.ogImage ? [seo.ogImage] : stringArray(seo.ogImages);
  seo.twitterTitle = stringValue(body.twitterTitle ?? seo.twitterTitle);
  seo.twitterDescription = stringValue(body.twitterDescription ?? seo.twitterDescription);
  seo.twitterImage = stringValue(body.twitterImage ?? seo.twitterImage);
  seo.contentTags = stringArray(body.contentTags ?? seo.contentTags ?? body.tags);
  seo.tags = seo.contentTags;

  schema.schemaType = NEWS_SCHEMA_TYPES.includes(body.schemaType) ? body.schemaType : (schema.schemaType || 'NewsArticle');
  schema.schemaHeadline = stringValue(body.schemaHeadline ?? schema.schemaHeadline ?? seo.metaTitle ?? title);
  schema.schemaDescription = stringValue(body.schemaDescription ?? schema.schemaDescription ?? seo.metaDescription ?? excerpt);
  schema.schemaImage = stringValue(body.schemaImage ?? schema.schemaImage ?? seo.ogImage ?? featuredImage);
  schema.schemaArticleSection = stringValue(body.schemaArticleSection ?? schema.schemaArticleSection ?? body.category ?? existing.category);
  schema.schemaKeywords = stringArray(body.schemaKeywords ?? schema.schemaKeywords ?? seo.secondaryKeywords);
  schema.publisherName = stringValue(body.publisherName ?? schema.publisherName) || 'CelebrityPersona';
  schema.publisherLogo = stringValue(body.publisherLogo ?? schema.publisherLogo);
  schema.mainEntityOfPage = stringValue(body.mainEntityOfPage ?? schema.mainEntityOfPage) || (slug ? `${SITE_URL}/celebrity-news/${slug}` : '');

  const galleryImages = Array.isArray(body.galleryImages)
    ? body.galleryImages
        .map((item: any) => ({
          url: stringValue(item.url),
          alt: stringValue(item.alt),
          caption: stringValue(item.caption),
          credit: stringValue(item.credit),
          sourceUrl: stringValue(item.sourceUrl),
        }))
        .filter((item: any) => item.url)
    : Array.isArray(existing.galleryImages) ? existing.galleryImages : [];

  const legacyImages = stringArray(body.images ?? existing.images);
  const imageOnlyGallery = galleryImages.map((image: any) => image.url);

  return {
    title,
    slug,
    excerpt,
    category: stringValue(body.category ?? existing.category),
    newsType: stringValue(body.newsType ?? existing.newsType) || 'Entertainment',
    status: NEWS_STATUSES.includes(body.status) ? body.status : (existing.status || 'draft'),
    isFeatured,
    featured: isFeatured,
    isTrending: Boolean(body.isTrending ?? existing.isTrending),
    isBreaking: Boolean(body.isBreaking ?? existing.isBreaking),
    publishedAt,
    publishDate: publishedAt,
    scheduledAt: dateValue(body.scheduledAt ?? existing.scheduledAt),
    authorName,
    author: authorName,
    reviewerName: stringValue(body.reviewerName ?? existing.reviewerName),
    readingTime: Number(body.readingTime || existing.readingTime) || estimateReadingTime(introduction, content),
    celebrity: optionalObjectId(body.primaryCelebrity ?? body.celebrity ?? existing.primaryCelebrity ?? existing.celebrity),
    primaryCelebrity: optionalObjectId(body.primaryCelebrity ?? body.celebrity ?? existing.primaryCelebrity ?? existing.celebrity),
    primaryCelebritySlug: stringValue(body.primaryCelebritySlug ?? existing.primaryCelebritySlug),
    relatedCelebrities: Array.isArray(body.relatedCelebrities) ? body.relatedCelebrities : (existing.relatedCelebrities || []),
    introduction,
    body: content,
    content,
    backgroundContext: stringValue(body.backgroundContext ?? existing.backgroundContext),
    whatHappened: stringValue(body.whatHappened ?? existing.whatHappened),
    whyItMatters: stringValue(body.whyItMatters ?? existing.whyItMatters),
    publicReaction: stringValue(body.publicReaction ?? existing.publicReaction),
    officialStatement: stringValue(body.officialStatement ?? existing.officialStatement),
    celebrityQuote: stringValue(body.celebrityQuote ?? existing.celebrityQuote),
    conclusion: stringValue(body.conclusion ?? existing.conclusion),
    featuredImage,
    thumbnail: featuredImage,
    featuredImageAlt: stringValue(body.featuredImageAlt ?? existing.featuredImageAlt),
    featuredImageCaption: stringValue(body.featuredImageCaption ?? existing.featuredImageCaption),
    imageCredit: stringValue(body.imageCredit ?? existing.imageCredit),
    imageSourceUrl: stringValue(body.imageSourceUrl ?? existing.imageSourceUrl),
    images: legacyImages.length ? legacyImages : imageOnlyGallery,
    galleryImages,
    videoEmbedUrl: stringValue(body.videoEmbedUrl ?? existing.videoEmbedUrl),
    instagramEmbedUrl: stringValue(body.instagramEmbedUrl ?? existing.instagramEmbedUrl),
    youtubeEmbedUrl: stringValue(body.youtubeEmbedUrl ?? existing.youtubeEmbedUrl),
    xEmbedUrl: stringValue(body.xEmbedUrl ?? existing.xEmbedUrl),
    sourceType: stringValue(body.sourceType ?? existing.sourceType),
    sourceName: stringValue(body.sourceName ?? existing.sourceName),
    sourceUrl: stringValue(body.sourceUrl ?? existing.sourceUrl),
    sourcePublishedAt: dateValue(body.sourcePublishedAt ?? existing.sourcePublishedAt),
    isSourceVerified: Boolean(body.isSourceVerified ?? existing.isSourceVerified),
    sourceCreditText: stringValue(body.sourceCreditText ?? existing.sourceCreditText),
    additionalReferences: Array.isArray(body.additionalReferences) ? body.additionalReferences : (existing.additionalReferences || []),
    factCheckNotes: stringValue(body.factCheckNotes ?? existing.factCheckNotes),
    tags: stringArray(body.tags ?? existing.tags),
    seo,
    schema,
  };
}

function validUrl(value?: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateNewsPayload(payload: any, { requirePublishFields = false } = {}) {
  const errors: Record<string, string> = {};
  const isPublishing = requirePublishFields || payload.status === 'published';
  if (!payload.title) errors.title = 'Title is required';
  if (!payload.slug) errors.slug = 'Slug is required';
  if (isPublishing && !payload.excerpt) errors.excerpt = 'Excerpt is required before publishing';
  if (isPublishing && !payload.category) errors.category = 'Category is required before publishing';
  if (isPublishing && !payload.newsType) errors.newsType = 'News type is required before publishing';
  if (isPublishing && !payload.body) errors.body = 'Article body is required before publishing';
  if (isPublishing && !payload.featuredImage) errors.featuredImage = 'Featured image is required before publishing';
  if (isPublishing && !payload.featuredImageAlt) errors.featuredImageAlt = 'Featured image alt text is required before publishing';
  if (isPublishing && !payload.sourceType) errors.sourceType = 'Source type is required before publishing';
  if (isPublishing && !payload.sourceName) errors.sourceName = 'Source name is required before publishing';
  if (isPublishing && !payload.sourceUrl) errors.sourceUrl = 'Source URL is required before publishing';
  if (isPublishing && !payload.seo?.focusKeyword) errors.focusKeyword = 'Focus keyword is required before publishing';
  if (isPublishing && !payload.seo?.metaTitle) errors.metaTitle = 'Meta title is required before publishing';
  if (isPublishing && !payload.seo?.metaDescription) errors.metaDescription = 'Meta description is required before publishing';
  if (isPublishing && !payload.publishedAt) errors.publishedAt = 'Published date is required for published news';
  if (payload.status === 'scheduled' && !payload.scheduledAt) errors.scheduledAt = 'Scheduled date is required';
  if (!validUrl(payload.sourceUrl)) errors.sourceUrl = 'Source URL must be a valid URL';
  if (!validUrl(payload.seo?.canonicalUrl)) errors.canonicalUrl = 'Canonical URL must be valid';
  if (!validUrl(payload.imageSourceUrl)) errors.imageSourceUrl = 'Image source URL must be valid';
  return errors;
}

export function serializeNews(doc: any) {
  const id = String(doc._id || doc.id || '');
  const seo = doc.seo || {};
  const schema = doc.schema || {};
  const featuredImage = doc.featuredImage || doc.thumbnail || '';
  const publishedAt = doc.publishedAt || doc.publishDate || doc.createdAt;
  return {
    ...doc,
    id,
    _id: id,
    body: doc.body || doc.content || '',
    content: doc.body || doc.content || '',
    featuredImage,
    thumbnail: featuredImage,
    authorName: doc.authorName || doc.author || 'CelebrityPersona',
    author: doc.authorName || doc.author || 'CelebrityPersona',
    publishedAt,
    publishDate: publishedAt,
    isFeatured: doc.isFeatured ?? doc.featured ?? false,
    featured: doc.isFeatured ?? doc.featured ?? false,
    galleryImages: doc.galleryImages || (doc.images || []).map((url: string) => ({ url, alt: doc.featuredImageAlt || doc.title })),
    seo: {
      ...seo,
      focusKeyword: seo.focusKeyword || '',
      secondaryKeywords: seo.secondaryKeywords || seo.metaKeywords || [],
      metaTitle: seo.metaTitle || doc.title,
      metaDescription: seo.metaDescription || doc.excerpt,
      robotsIndex: seo.robotsIndex ?? (seo.noindex === undefined ? true : !seo.noindex),
      robotsFollow: seo.robotsFollow ?? (seo.nofollow === undefined ? true : !seo.nofollow),
      ogTitle: seo.ogTitle || seo.metaTitle || doc.title,
      ogDescription: seo.ogDescription || seo.metaDescription || doc.excerpt,
      ogImage: seo.ogImage || seo.ogImages?.[0] || featuredImage,
      twitterTitle: seo.twitterTitle || seo.ogTitle || seo.metaTitle || doc.title,
      twitterDescription: seo.twitterDescription || seo.ogDescription || seo.metaDescription || doc.excerpt,
      twitterImage: seo.twitterImage || seo.ogImage || seo.ogImages?.[0] || featuredImage,
      contentTags: seo.contentTags || seo.tags || doc.tags || [],
    },
    schema: {
      schemaType: schema.schemaType || seo.schemaType || 'NewsArticle',
      schemaHeadline: schema.schemaHeadline || seo.metaTitle || doc.title,
      schemaDescription: schema.schemaDescription || seo.metaDescription || doc.excerpt,
      schemaImage: schema.schemaImage || seo.ogImage || seo.ogImages?.[0] || featuredImage,
      schemaArticleSection: schema.schemaArticleSection || doc.category,
      schemaKeywords: schema.schemaKeywords || seo.secondaryKeywords || seo.metaKeywords || doc.tags || [],
      publisherName: schema.publisherName || 'CelebrityPersona',
      publisherLogo: schema.publisherLogo || '',
      mainEntityOfPage: schema.mainEntityOfPage || (doc.slug ? `${SITE_URL}/celebrity-news/${doc.slug}` : ''),
    },
  };
}
