import mongoose, { Document, Model, Schema } from 'mongoose';

// ── SEO sub-document ──────────────────────────────────────────────────────────
export interface IOutfitSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogUrl?: string;
  ogImages?: string[];
  ogLocale?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  schemaType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  authorUrl?: string;
  tags?: string[];
  section?: string;
  alternateLangs?: string[];
  prevUrl?: string;
  nextUrl?: string;
  canonicalAlternates?: string[];
  focusKeyword?: string;
  structuredDataDepth?: string;
  contentScore?: number;
  readabilityScore?: number;
  relatedTopics?: string[];
  searchVolume?: number;
}

// ── Comment sub-document ─────────────────────────────────────────────────────
export interface IOutfitComment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

// ── Main interface ────────────────────────────────────────────────────────────
export interface ICelebrityOutfit extends Document<string>, Record<string, any> {
  _id: string;
  title: string;
  slug: string;
  celebrity: mongoose.Types.ObjectId;
  images: string[];
  event?: string;
  designer?: string;
  description?: string;
  tags?: string[];
  purchaseLink?: string;
  price?: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  isActive: boolean;
  isFeatured: boolean;
  likesCount: number;
  commentsCount: number;
  likes: mongoose.Types.ObjectId[];
  favourites: mongoose.Types.ObjectId[];
  comments: IOutfitComment[];
  seo?: IOutfitSEO;
  createdAt: Date;
  updatedAt: Date;
}

// ── SEO sub-schema ────────────────────────────────────────────────────────────
const seoSchema = new Schema<IOutfitSEO>(
  {
    metaTitle:             { type: String },
    metaDescription:       { type: String },
    metaKeywords:          [{ type: String }],
    canonicalUrl:          { type: String },
    noindex:               { type: Boolean, default: false },
    nofollow:              { type: Boolean, default: false },
    robots:                { type: String, default: 'index,follow' },
    ogTitle:               { type: String },
    ogDescription:         { type: String },
    ogType:                { type: String },
    ogSiteName:            { type: String },
    ogUrl:                 { type: String },
    ogImages:              [{ type: String }],
    ogLocale:              { type: String },
    twitterCard:           { type: String },
    twitterTitle:          { type: String },
    twitterDescription:    { type: String },
    twitterImage:          { type: String },
    twitterSite:           { type: String },
    twitterCreator:        { type: String },
    schemaType:            { type: String },
    publishedTime:         { type: String },
    modifiedTime:          { type: String },
    authorName:            { type: String },
    authorUrl:             { type: String },
    tags:                  [{ type: String }],
    section:               { type: String },
    alternateLangs:        [{ type: String }],
    prevUrl:               { type: String },
    nextUrl:               { type: String },
    canonicalAlternates:   [{ type: String }],
    focusKeyword:          { type: String },
    structuredDataDepth:   { type: String },
    contentScore:          { type: Number },
    readabilityScore:      { type: Number },
    relatedTopics:         [{ type: String }],
    searchVolume:          { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Comment sub-schema ───────────────────────────────────────────────────────
const outfitCommentSchema = new Schema<IOutfitComment>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:   { type: String, required: true },
    userAvatar: { type: String, default: '' },
    text:       { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const relatedCelebritySchema = new Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
  },
  { _id: false }
);

const mediaItemSchema = new Schema(
  {
    url: { type: String, trim: true },
    alt: { type: String, trim: true },
    caption: { type: String, trim: true },
    credit: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
  },
  { _id: false }
);

const similarProductSchema = new Schema(
  {
    productName: { type: String, trim: true },
    productImage: { type: String, trim: true },
    productBrand: { type: String, trim: true },
    productPrice: { type: String, trim: true },
    productCurrency: { type: String, trim: true },
    productBuyUrl: { type: String, trim: true },
    affiliateUrl: { type: String, trim: true },
    productCategory: { type: String, trim: true },
    color: { type: String, trim: true },
    sizeOptions: [{ type: String, trim: true }],
    storeName: { type: String, trim: true },
    availability: { type: String, trim: true },
    productPriority: {
      type: String,
      enum: ['Best Match', 'Budget Pick', 'Premium Pick', 'Similar Color', 'Similar Design', 'Inspired Look', ''],
      default: '',
    },
    isSponsored: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const referenceSchema = new Schema(
  {
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    sourceName: { type: String, trim: true },
  },
  { _id: false }
);

const outfitSchemaDataSchema = new Schema(
  {
    schemaType: { type: String, enum: ['Article', 'BlogPosting'], default: 'Article' },
    schemaHeadline: { type: String, trim: true },
    schemaDescription: { type: String, trim: true },
    schemaImage: { type: String, trim: true },
    schemaArticleSection: { type: String, default: 'Celebrity Outfits', trim: true },
    schemaKeywords: [{ type: String, trim: true }],
    publisherName: { type: String, default: 'CelebrityPersona', trim: true },
    publisherLogo: { type: String, trim: true },
    mainEntityOfPage: { type: String, trim: true },
    enableProductSchema: { type: Boolean, default: true },
  },
  { _id: false }
);

const celebrityOutfitSchema = new Schema<any>(
  {
    title: {
      type: String,
      required: [true, 'Outfit title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    celebrity: {
      type: Schema.Types.ObjectId,
      ref: 'Celebrity',
      required: [true, 'Celebrity reference is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    event: {
      type: String,
      trim: true,
    },
    eventName: { type: String, trim: true },
    eventType: { type: String, trim: true },
    eventDate: { type: Date },
    location: { type: String, trim: true },
    brandCampaignName: { type: String, trim: true },
    relatedMovieOrShow: { type: String, trim: true },
    instagramPostUrl: { type: String, trim: true },
    celebrityProfileUrl: { type: String, trim: true },
    designer: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    purchaseLink: {
      type: String,
      trim: true,
    },
    price: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    outfitType: { type: String, trim: true },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: { type: Boolean, default: false },
    isEditorPick: { type: Boolean, default: false },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    authorName: { type: String, trim: true },
    reviewerName: { type: String, trim: true },
    readingTime: { type: Number },
    primaryCelebrity: { type: Schema.Types.ObjectId, ref: 'Celebrity' },
    primaryCelebritySlug: { type: String, trim: true },
    relatedCelebrities: { type: [relatedCelebritySchema], default: [] },
    mainOutfitName: { type: String, trim: true },
    outfitSummary: { type: String, trim: true },
    fabric: { type: String, trim: true },
    pattern: { type: String, trim: true },
    neckline: { type: String, trim: true },
    sleeveStyle: { type: String, trim: true },
    fitSilhouette: { type: String, trim: true },
    length: { type: String, trim: true },
    workOrEmbellishment: { type: String, trim: true },
    accessories: { type: String, trim: true },
    jewelry: { type: String, trim: true },
    footwear: { type: String, trim: true },
    bag: { type: String, trim: true },
    hairstyle: { type: String, trim: true },
    makeup: { type: String, trim: true },
    stylingNotes: { type: String },
    bestFor: [{ type: String, trim: true }],
    season: { type: String, trim: true },
    priceRange: { type: String, trim: true },
    styleLevel: { type: String, enum: ['Luxury', 'Premium', 'Affordable', 'Budget', 'Mixed', ''], default: '' },
    featuredImage: { type: String, trim: true },
    featuredImageAlt: { type: String, trim: true },
    featuredImageCaption: { type: String, trim: true },
    imageCredit: { type: String, trim: true },
    imageSourceUrl: { type: String, trim: true },
    galleryImages: { type: [mediaItemSchema], default: [] },
    instagramEmbedUrl: { type: String, trim: true },
    youtubeEmbedUrl: { type: String, trim: true },
    videoEmbedUrl: { type: String, trim: true },
    pinterestImageUrl: { type: String, trim: true },
    originalOutfitAvailable: { type: Boolean, default: false },
    originalProductName: { type: String, trim: true },
    originalBrand: { type: String, trim: true },
    originalDesigner: { type: String, trim: true },
    originalPrice: { type: String, trim: true },
    originalCurrency: { type: String, trim: true },
    originalBuyUrl: { type: String, trim: true },
    originalAffiliateUrl: { type: String, trim: true },
    affiliateNetwork: { type: String, trim: true },
    productAvailability: { type: String, trim: true },
    productCondition: { type: String, trim: true },
    couponCode: { type: String, trim: true },
    commissionType: { type: String, trim: true },
    similarProducts: { type: [similarProductSchema], default: [] },
    introduction: { type: String },
    outfitDescription: { type: String },
    styleBreakdown: { type: String },
    whyThisLookWorks: { type: String },
    howToRecreateLook: { type: String },
    occasionStylingTips: { type: String },
    affordableAlternatives: { type: String },
    fashionExpertNotes: { type: String },
    trendAnalysis: { type: String },
    celebrityStyleHistory: { type: String },
    finalVerdict: { type: String },
    sourceType: { type: String, trim: true },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    sourcePublishedAt: { type: Date },
    imageCreditText: { type: String, trim: true },
    isSourceVerified: { type: Boolean, default: false },
    permissionStatus: {
      type: String,
      enum: ['Embedded Post', 'Licensed Image', 'Official Press Image', 'Public Instagram Embed', 'Brand Provided Image', 'Permission Received', 'Avoid Direct Reuse', ''],
      default: '',
    },
    creditDisplayText: { type: String, trim: true },
    additionalReferences: { type: [referenceSchema], default: [] },
    factCheckNotes: { type: String },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    favourites: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    comments: {
      type: [outfitCommentSchema],
      default: [],
    },
    seo: {
      type: seoSchema,
    },
    schema: {
      type: outfitSchemaDataSchema,
      default: () => ({ schemaType: 'Article', schemaArticleSection: 'Celebrity Outfits', publisherName: 'CelebrityPersona', enableProductSchema: true }),
    },
  },
  {
    timestamps: true,
  }
);

(celebrityOutfitSchema as any).set('strictPopulate', false);

// ── Indexes ───────────────────────────────────────────────────────────────────
celebrityOutfitSchema.index({ celebrity: 1 });
celebrityOutfitSchema.index({ primaryCelebrity: 1 });
celebrityOutfitSchema.index({ primaryCelebritySlug: 1 });
celebrityOutfitSchema.index({ status: 1 });
celebrityOutfitSchema.index({ brand: 1 });
celebrityOutfitSchema.index({ designer: 1 });
celebrityOutfitSchema.index({ category: 1 });
celebrityOutfitSchema.index({ outfitType: 1 });
celebrityOutfitSchema.index({ isActive: 1, isFeatured: 1 });
celebrityOutfitSchema.index({ isTrending: 1, status: 1, publishedAt: -1 });
celebrityOutfitSchema.index({ isEditorPick: 1, status: 1, publishedAt: -1 });
celebrityOutfitSchema.index({ status: 1, isActive: 1, celebrity: 1, updatedAt: -1 });
celebrityOutfitSchema.index({ status: 1, isActive: 1, category: 1, tags: 1, updatedAt: -1 });
celebrityOutfitSchema.index({ title: 'text', description: 'text', outfitDescription: 'text', outfitSummary: 'text', brand: 'text', designer: 'text' });

// Delete cached model in dev so hot-reload always uses the latest schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.CelebrityOutfit) {
  delete (mongoose.models as any).CelebrityOutfit;
}

const CelebrityOutfit: Model<any> =
  mongoose.models.CelebrityOutfit ||
  mongoose.model<any>('CelebrityOutfit', celebrityOutfitSchema);

export default CelebrityOutfit;
