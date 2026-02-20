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

// ── Main interface ────────────────────────────────────────────────────────────
export interface ICelebrityOutfit extends Document {
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
  isActive: boolean;
  isFeatured: boolean;
  likesCount: number;
  commentsCount: number;
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

// ── Main schema ───────────────────────────────────────────────────────────────
const celebrityOutfitSchema = new Schema<ICelebrityOutfit>(
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
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    seo: {
      type: seoSchema,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
celebrityOutfitSchema.index({ slug: 1 });
celebrityOutfitSchema.index({ celebrity: 1 });
celebrityOutfitSchema.index({ brand: 1 });
celebrityOutfitSchema.index({ category: 1 });
celebrityOutfitSchema.index({ isActive: 1, isFeatured: 1 });
celebrityOutfitSchema.index({ title: 'text', description: 'text', brand: 'text', designer: 'text' });

// Delete cached model in dev so hot-reload always uses the latest schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.CelebrityOutfit) {
  delete (mongoose.models as any).CelebrityOutfit;
}

const CelebrityOutfit: Model<ICelebrityOutfit> =
  mongoose.models.CelebrityOutfit ||
  mongoose.model<ICelebrityOutfit>('CelebrityOutfit', celebrityOutfitSchema);

export default CelebrityOutfit;
