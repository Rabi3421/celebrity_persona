import mongoose from 'mongoose';

export const OUTFIT_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export const OUTFIT_SCHEMA_TYPES = ['Article', 'BlogPosting'] as const;

const SITE_URL = 'https://www.celebritypersona.com';

export function slugifyOutfitTitle(value: string) {
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

export function estimateOutfitReadingTime(...values: Array<string | undefined>) {
  const words = stripHtml(values.filter(Boolean).join(' ')).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrString(value: unknown) {
  if (typeof value === 'number') return String(value);
  return stringValue(value);
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

function validUrl(value?: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function publicOutfitFilter(extra: Record<string, any> = {}) {
  return {
    ...extra,
    status: 'published',
    $and: [
      ...(Array.isArray(extra.$and) ? extra.$and : []),
      { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
    ],
  };
}

function normalizeGalleryImages(value: unknown, existing: any[] = []) {
  const raw = Array.isArray(value) ? value : existing;
  return raw
    .map((item: any) => ({
      url: stringValue(item.url ?? item),
      alt: stringValue(item.alt),
      caption: stringValue(item.caption),
      credit: stringValue(item.credit),
      sourceUrl: stringValue(item.sourceUrl),
    }))
    .filter((item: any) => item.url);
}

function normalizeRelatedCelebrities(value: unknown, existing: any[] = []) {
  const raw = Array.isArray(value) ? value : existing;
  return raw
    .map((item: any) => ({
      name: stringValue(item.name),
      slug: stringValue(item.slug),
      image: stringValue(item.image),
      profileUrl: stringValue(item.profileUrl),
    }))
    .filter((item: any) => item.name || item.slug);
}

function normalizeReferences(value: unknown, existing: any[] = []) {
  const raw = Array.isArray(value) ? value : existing;
  return raw
    .map((item: any) => ({
      title: stringValue(item.title),
      url: stringValue(item.url),
      sourceName: stringValue(item.sourceName),
    }))
    .filter((item: any) => item.title || item.url || item.sourceName);
}

function normalizeProducts(value: unknown, existing: any[] = []) {
  const raw = Array.isArray(value) ? value : existing;
  return raw
    .map((item: any, index: number) => ({
      productName: stringValue(item.productName),
      productImage: stringValue(item.productImage),
      productBrand: stringValue(item.productBrand),
      productPrice: numberOrString(item.productPrice),
      productCurrency: stringValue(item.productCurrency),
      productBuyUrl: stringValue(item.productBuyUrl),
      affiliateUrl: stringValue(item.affiliateUrl),
      productCategory: stringValue(item.productCategory),
      color: stringValue(item.color),
      sizeOptions: stringArray(item.sizeOptions),
      storeName: stringValue(item.storeName),
      availability: stringValue(item.availability),
      productPriority: stringValue(item.productPriority),
      isSponsored: Boolean(item.isSponsored),
      displayOrder: Number(item.displayOrder ?? index) || 0,
    }))
    .filter((item: any) => item.productName || item.productBuyUrl || item.affiliateUrl)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder);
}

export function normalizeOutfitPayload(body: any, existing: any = {}) {
  const title = stringValue(body.title ?? existing.title);
  const slug = stringValue(body.slug) || (title ? slugifyOutfitTitle(title) : existing.slug);
  const legacyImages = stringArray(body.images ?? existing.images);
  const galleryImages = normalizeGalleryImages(body.galleryImages, existing.galleryImages || []);
  const featuredImage = stringValue(body.featuredImage ?? existing.featuredImage ?? legacyImages[0]);
  const allImages = legacyImages.length ? legacyImages : [featuredImage, ...galleryImages.map((item) => item.url)].filter(Boolean);
  const celebrityId = optionalObjectId(body.primaryCelebrity ?? body.celebrity ?? existing.primaryCelebrity ?? existing.celebrity);
  const celebritySlug = stringValue(body.primaryCelebritySlug ?? existing.primaryCelebritySlug);
  const description = stringValue(body.outfitDescription ?? body.description ?? existing.outfitDescription ?? existing.description);
  const excerpt = stringValue(body.excerpt ?? existing.excerpt) || stripHtml(description).slice(0, 220);
  const status = OUTFIT_STATUSES.includes(body.status) ? body.status : (existing.status || 'draft');
  const publishedAt = dateValue(body.publishedAt ?? existing.publishedAt ?? (status === 'published' ? existing.createdAt : undefined));
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
  seo.ogImage = stringValue(body.ogImage ?? seo.ogImage ?? seo.ogImages?.[0]);
  seo.ogImages = seo.ogImage ? [seo.ogImage] : stringArray(seo.ogImages);
  seo.twitterTitle = stringValue(body.twitterTitle ?? seo.twitterTitle);
  seo.twitterDescription = stringValue(body.twitterDescription ?? seo.twitterDescription);
  seo.twitterImage = stringValue(body.twitterImage ?? seo.twitterImage);
  seo.contentTags = stringArray(body.contentTags ?? seo.contentTags ?? body.tags ?? existing.tags);
  seo.tags = seo.contentTags;

  schema.schemaType = OUTFIT_SCHEMA_TYPES.includes(body.schemaType) ? body.schemaType : (schema.schemaType || 'Article');
  schema.schemaHeadline = stringValue(body.schemaHeadline ?? schema.schemaHeadline ?? seo.metaTitle ?? title);
  schema.schemaDescription = stringValue(body.schemaDescription ?? schema.schemaDescription ?? seo.metaDescription ?? excerpt);
  schema.schemaImage = stringValue(body.schemaImage ?? schema.schemaImage ?? seo.ogImage ?? featuredImage);
  schema.schemaArticleSection = stringValue(body.schemaArticleSection ?? schema.schemaArticleSection) || 'Celebrity Outfits';
  schema.schemaKeywords = stringArray(body.schemaKeywords ?? schema.schemaKeywords ?? seo.secondaryKeywords);
  schema.publisherName = stringValue(body.publisherName ?? schema.publisherName) || 'CelebrityPersona';
  schema.publisherLogo = stringValue(body.publisherLogo ?? schema.publisherLogo);
  schema.mainEntityOfPage = stringValue(body.mainEntityOfPage ?? schema.mainEntityOfPage) || (slug ? `${SITE_URL}/celebrity-outfits/${slug}` : '');
  schema.enableProductSchema = body.enableProductSchema ?? schema.enableProductSchema ?? true;

  const outfitType = stringValue(body.outfitType ?? existing.outfitType);
  const eventName = stringValue(body.eventName ?? body.event ?? existing.eventName ?? existing.event);
  const originalAffiliateUrl = stringValue(body.originalAffiliateUrl ?? existing.originalAffiliateUrl);
  const originalBuyUrl = stringValue(body.originalBuyUrl ?? body.purchaseLink ?? existing.originalBuyUrl ?? existing.purchaseLink);
  const originalPrice = numberOrString(body.originalPrice ?? body.price ?? existing.originalPrice ?? existing.price);
  const authorName = stringValue(body.authorName ?? existing.authorName);

  return {
    title,
    slug,
    excerpt,
    category: stringValue(body.category ?? existing.category),
    outfitType,
    status,
    isActive: body.isActive ?? existing.isActive ?? true,
    isFeatured: Boolean(body.isFeatured ?? existing.isFeatured),
    isTrending: Boolean(body.isTrending ?? existing.isTrending),
    isEditorPick: Boolean(body.isEditorPick ?? existing.isEditorPick),
    publishedAt,
    scheduledAt: dateValue(body.scheduledAt ?? existing.scheduledAt),
    authorName,
    reviewerName: stringValue(body.reviewerName ?? existing.reviewerName),
    readingTime: Number(body.readingTime || existing.readingTime) || estimateOutfitReadingTime(description, body.introduction, body.styleBreakdown),
    celebrity: celebrityId,
    primaryCelebrity: celebrityId,
    primaryCelebritySlug: celebritySlug,
    relatedCelebrities: normalizeRelatedCelebrities(body.relatedCelebrities, existing.relatedCelebrities || []),
    event: eventName,
    eventName,
    eventType: stringValue(body.eventType ?? existing.eventType),
    eventDate: dateValue(body.eventDate ?? existing.eventDate),
    location: stringValue(body.location ?? existing.location),
    brandCampaignName: stringValue(body.brandCampaignName ?? existing.brandCampaignName),
    relatedMovieOrShow: stringValue(body.relatedMovieOrShow ?? existing.relatedMovieOrShow),
    instagramPostUrl: stringValue(body.instagramPostUrl ?? existing.instagramPostUrl),
    celebrityProfileUrl: stringValue(body.celebrityProfileUrl ?? existing.celebrityProfileUrl),
    mainOutfitName: stringValue(body.mainOutfitName ?? existing.mainOutfitName),
    outfitSummary: stringValue(body.outfitSummary ?? existing.outfitSummary),
    designer: stringValue(body.designer ?? existing.designer),
    brand: stringValue(body.brand ?? existing.brand),
    color: stringValue(body.color ?? existing.color),
    fabric: stringValue(body.fabric ?? existing.fabric),
    pattern: stringValue(body.pattern ?? existing.pattern),
    neckline: stringValue(body.neckline ?? existing.neckline),
    sleeveStyle: stringValue(body.sleeveStyle ?? existing.sleeveStyle),
    fitSilhouette: stringValue(body.fitSilhouette ?? existing.fitSilhouette),
    length: stringValue(body.length ?? existing.length),
    workOrEmbellishment: stringValue(body.workOrEmbellishment ?? existing.workOrEmbellishment),
    accessories: stringValue(body.accessories ?? existing.accessories),
    jewelry: stringValue(body.jewelry ?? existing.jewelry),
    footwear: stringValue(body.footwear ?? existing.footwear),
    bag: stringValue(body.bag ?? existing.bag),
    hairstyle: stringValue(body.hairstyle ?? existing.hairstyle),
    makeup: stringValue(body.makeup ?? existing.makeup),
    stylingNotes: stringValue(body.stylingNotes ?? existing.stylingNotes),
    bestFor: stringArray(body.bestFor ?? existing.bestFor),
    season: stringValue(body.season ?? existing.season),
    priceRange: stringValue(body.priceRange ?? existing.priceRange),
    styleLevel: stringValue(body.styleLevel ?? existing.styleLevel),
    featuredImage,
    featuredImageAlt: stringValue(body.featuredImageAlt ?? existing.featuredImageAlt),
    featuredImageCaption: stringValue(body.featuredImageCaption ?? existing.featuredImageCaption),
    imageCredit: stringValue(body.imageCredit ?? existing.imageCredit),
    imageSourceUrl: stringValue(body.imageSourceUrl ?? existing.imageSourceUrl),
    images: allImages,
    galleryImages,
    instagramEmbedUrl: stringValue(body.instagramEmbedUrl ?? existing.instagramEmbedUrl),
    youtubeEmbedUrl: stringValue(body.youtubeEmbedUrl ?? existing.youtubeEmbedUrl),
    videoEmbedUrl: stringValue(body.videoEmbedUrl ?? existing.videoEmbedUrl),
    pinterestImageUrl: stringValue(body.pinterestImageUrl ?? existing.pinterestImageUrl),
    originalOutfitAvailable: Boolean(body.originalOutfitAvailable ?? existing.originalOutfitAvailable),
    originalProductName: stringValue(body.originalProductName ?? existing.originalProductName),
    originalBrand: stringValue(body.originalBrand ?? existing.originalBrand),
    originalDesigner: stringValue(body.originalDesigner ?? existing.originalDesigner),
    originalPrice,
    originalCurrency: stringValue(body.originalCurrency ?? existing.originalCurrency),
    originalBuyUrl,
    originalAffiliateUrl,
    affiliateNetwork: stringValue(body.affiliateNetwork ?? existing.affiliateNetwork),
    productAvailability: stringValue(body.productAvailability ?? existing.productAvailability),
    productCondition: stringValue(body.productCondition ?? existing.productCondition),
    couponCode: stringValue(body.couponCode ?? existing.couponCode),
    commissionType: stringValue(body.commissionType ?? existing.commissionType),
    similarProducts: normalizeProducts(body.similarProducts, existing.similarProducts || []),
    introduction: stringValue(body.introduction ?? existing.introduction),
    outfitDescription: description,
    description,
    styleBreakdown: stringValue(body.styleBreakdown ?? existing.styleBreakdown),
    whyThisLookWorks: stringValue(body.whyThisLookWorks ?? existing.whyThisLookWorks),
    howToRecreateLook: stringValue(body.howToRecreateLook ?? existing.howToRecreateLook),
    occasionStylingTips: stringValue(body.occasionStylingTips ?? existing.occasionStylingTips),
    affordableAlternatives: stringValue(body.affordableAlternatives ?? existing.affordableAlternatives),
    fashionExpertNotes: stringValue(body.fashionExpertNotes ?? existing.fashionExpertNotes),
    trendAnalysis: stringValue(body.trendAnalysis ?? existing.trendAnalysis),
    celebrityStyleHistory: stringValue(body.celebrityStyleHistory ?? existing.celebrityStyleHistory),
    finalVerdict: stringValue(body.finalVerdict ?? existing.finalVerdict),
    sourceType: stringValue(body.sourceType ?? existing.sourceType),
    sourceName: stringValue(body.sourceName ?? existing.sourceName),
    sourceUrl: stringValue(body.sourceUrl ?? existing.sourceUrl),
    sourcePublishedAt: dateValue(body.sourcePublishedAt ?? existing.sourcePublishedAt),
    imageCreditText: stringValue(body.imageCreditText ?? existing.imageCreditText),
    isSourceVerified: Boolean(body.isSourceVerified ?? existing.isSourceVerified),
    permissionStatus: stringValue(body.permissionStatus ?? existing.permissionStatus),
    creditDisplayText: stringValue(body.creditDisplayText ?? existing.creditDisplayText),
    additionalReferences: normalizeReferences(body.additionalReferences, existing.additionalReferences || []),
    factCheckNotes: stringValue(body.factCheckNotes ?? existing.factCheckNotes),
    purchaseLink: originalAffiliateUrl || originalBuyUrl,
    price: originalPrice || stringValue(body.price ?? existing.price),
    size: stringValue(body.size ?? existing.size),
    tags: stringArray(body.tags ?? existing.tags),
    seo,
    schema,
  };
}

export function validateOutfitPayload(payload: any, { requirePublishFields = false } = {}) {
  const errors: Record<string, string> = {};
  const isPublishing = requirePublishFields || payload.status === 'published';
  if (!payload.title) errors.title = 'Title is required';
  if (!payload.slug) errors.slug = 'Slug is required';
  if (isPublishing && !payload.excerpt) errors.excerpt = 'Excerpt is required before publishing';
  if (isPublishing && !payload.category) errors.category = 'Category is required before publishing';
  if (isPublishing && !payload.outfitType) errors.outfitType = 'Outfit type is required before publishing';
  if (isPublishing && !payload.primaryCelebrity) errors.primaryCelebrity = 'Primary celebrity is required before publishing';
  if (isPublishing && !payload.primaryCelebritySlug) errors.primaryCelebritySlug = 'Primary celebrity slug is required before publishing';
  if (isPublishing && !payload.outfitSummary) errors.outfitSummary = 'Outfit summary is required before publishing';
  if (isPublishing && !payload.featuredImage) errors.featuredImage = 'Featured image is required before publishing';
  if (isPublishing && !payload.featuredImageAlt) errors.featuredImageAlt = 'Featured image alt text is required before publishing';
  if (isPublishing && !payload.outfitDescription) errors.outfitDescription = 'Outfit description is required before publishing';
  if (isPublishing && !payload.sourceType) errors.sourceType = 'Source type is required before publishing';
  if (isPublishing && !payload.sourceName) errors.sourceName = 'Source name is required before publishing';
  if (isPublishing && !payload.sourceUrl) errors.sourceUrl = 'Source URL is required before publishing';
  if (isPublishing && !payload.seo?.focusKeyword) errors.focusKeyword = 'Focus keyword is required before publishing';
  if (isPublishing && !payload.seo?.metaTitle) errors.metaTitle = 'Meta title is required before publishing';
  if (isPublishing && !payload.seo?.metaDescription) errors.metaDescription = 'Meta description is required before publishing';
  if (isPublishing && !payload.publishedAt) errors.publishedAt = 'Published date is required for published outfits';
  if (payload.status === 'scheduled' && !payload.scheduledAt) errors.scheduledAt = 'Scheduled date is required';
  if (!validUrl(payload.sourceUrl)) errors.sourceUrl = 'Source URL must be a valid URL';
  if (!validUrl(payload.imageSourceUrl)) errors.imageSourceUrl = 'Image source URL must be valid';
  if (!validUrl(payload.seo?.canonicalUrl)) errors.canonicalUrl = 'Canonical URL must be valid';
  if (!validUrl(payload.instagramPostUrl)) errors.instagramPostUrl = 'Instagram post URL must be valid';
  if (!validUrl(payload.originalBuyUrl)) errors.originalBuyUrl = 'Original buy URL must be valid';
  if (!validUrl(payload.originalAffiliateUrl)) errors.originalAffiliateUrl = 'Original affiliate URL must be valid';
  payload.similarProducts?.forEach((product: any, index: number) => {
    if (!validUrl(product.productBuyUrl)) errors[`similarProducts.${index}.productBuyUrl`] = 'Product buy URL must be valid';
    if (!validUrl(product.affiliateUrl)) errors[`similarProducts.${index}.affiliateUrl`] = 'Affiliate URL must be valid';
  });
  return errors;
}

export function serializeOutfit(doc: any) {
  const id = String(doc._id || doc.id || '');
  const seo = doc.seo || {};
  const schema = doc.schema || {};
  const celebrity = doc.primaryCelebrity || doc.celebrity;
  const featuredImage = doc.featuredImage || doc.images?.[0] || '';
  const galleryImages = doc.galleryImages?.length
    ? doc.galleryImages
    : (doc.images || []).map((url: string, index: number) => ({
        url,
        alt: index === 0 ? (doc.featuredImageAlt || doc.title) : `${doc.title} gallery image ${index + 1}`,
      }));
  const publishedAt = doc.publishedAt || doc.createdAt;
  const excerpt = doc.excerpt || stripHtml(doc.outfitDescription || doc.description || '').slice(0, 220);

  return {
    ...doc,
    id,
    _id: id,
    celebrity,
    primaryCelebrity: celebrity,
    featuredImage,
    images: doc.images?.length ? doc.images : [featuredImage, ...galleryImages.map((item: any) => item.url)].filter(Boolean),
    galleryImages,
    excerpt,
    eventName: doc.eventName || doc.event,
    event: doc.eventName || doc.event,
    outfitDescription: doc.outfitDescription || doc.description || '',
    description: doc.outfitDescription || doc.description || '',
    outfitType: doc.outfitType || doc.category || '',
    primaryCelebritySlug: doc.primaryCelebritySlug || (typeof celebrity === 'object' ? celebrity?.slug : ''),
    publishedAt,
    authorName: doc.authorName || 'CelebrityPersona',
    isTrending: Boolean(doc.isTrending),
    isEditorPick: Boolean(doc.isEditorPick),
    originalBuyUrl: doc.originalBuyUrl || doc.purchaseLink || '',
    originalAffiliateUrl: doc.originalAffiliateUrl || '',
    purchaseLink: doc.originalAffiliateUrl || doc.originalBuyUrl || doc.purchaseLink || '',
    originalPrice: doc.originalPrice || doc.price || '',
    seo: {
      ...seo,
      focusKeyword: seo.focusKeyword || '',
      secondaryKeywords: seo.secondaryKeywords || seo.metaKeywords || [],
      metaTitle: seo.metaTitle || doc.title,
      metaDescription: seo.metaDescription || excerpt,
      robotsIndex: seo.robotsIndex ?? (seo.noindex === undefined ? true : !seo.noindex),
      robotsFollow: seo.robotsFollow ?? (seo.nofollow === undefined ? true : !seo.nofollow),
      ogTitle: seo.ogTitle || seo.metaTitle || doc.title,
      ogDescription: seo.ogDescription || seo.metaDescription || excerpt,
      ogImage: seo.ogImage || seo.ogImages?.[0] || featuredImage,
      twitterTitle: seo.twitterTitle || seo.ogTitle || seo.metaTitle || doc.title,
      twitterDescription: seo.twitterDescription || seo.ogDescription || seo.metaDescription || excerpt,
      twitterImage: seo.twitterImage || seo.ogImage || seo.ogImages?.[0] || featuredImage,
      contentTags: seo.contentTags || seo.tags || doc.tags || [],
    },
    schema: {
      schemaType: schema.schemaType || seo.schemaType || 'Article',
      schemaHeadline: schema.schemaHeadline || seo.metaTitle || doc.title,
      schemaDescription: schema.schemaDescription || seo.metaDescription || excerpt,
      schemaImage: schema.schemaImage || seo.ogImage || seo.ogImages?.[0] || featuredImage,
      schemaArticleSection: schema.schemaArticleSection || 'Celebrity Outfits',
      schemaKeywords: schema.schemaKeywords || seo.secondaryKeywords || seo.metaKeywords || doc.tags || [],
      publisherName: schema.publisherName || 'CelebrityPersona',
      publisherLogo: schema.publisherLogo || '',
      mainEntityOfPage: schema.mainEntityOfPage || (doc.slug ? `${SITE_URL}/celebrity-outfits/${doc.slug}` : ''),
      enableProductSchema: schema.enableProductSchema ?? true,
    },
  };
}
