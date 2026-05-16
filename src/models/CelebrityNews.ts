import mongoose, { Document, Model, Schema } from 'mongoose';

// ── SEO sub-document ──────────────────────────────────────────────────────────
export interface INewsSEO {
  metaTitle?: string;
  metaDescription?: string;
  secondaryKeywords?: string[];
  metaKeywords?: string[];
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
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
  contentTags?: string[];
  structuredDataDepth?: string;
  contentScore?: number;
  readabilityScore?: number;
  relatedTopics?: string[];
  searchVolume?: number;
}

export interface IRelatedCelebrity {
  name: string;
  slug?: string;
  image?: string;
  profileUrl?: string;
}

export interface IGalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

export interface INewsReference {
  title?: string;
  url?: string;
  sourceName?: string;
}

export interface INewsSchema {
  schemaType?: 'NewsArticle' | 'Article' | 'BlogPosting';
  schemaHeadline?: string;
  schemaDescription?: string;
  schemaImage?: string;
  schemaArticleSection?: string;
  schemaKeywords?: string[];
  publisherName?: string;
  publisherLogo?: string;
  mainEntityOfPage?: string;
}

// ── Main interface ────────────────────────────────────────────────────────────
export interface INewsComment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface ICelebrityNews extends Document {
  title: string;
  slug: string;
  newsType?: string;
  content: string;
  introduction?: string;
  body?: string;
  backgroundContext?: string;
  whatHappened?: string;
  whyItMatters?: string;
  publicReaction?: string;
  officialStatement?: string;
  celebrityQuote?: string;
  conclusion?: string;
  excerpt?: string;
  thumbnail?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  images?: string[];
  galleryImages?: IGalleryImage[];
  videoEmbedUrl?: string;
  instagramEmbedUrl?: string;
  youtubeEmbedUrl?: string;
  xEmbedUrl?: string;
  author?: string;
  authorName?: string;
  reviewerName?: string;
  readingTime?: number;
  category?: string;
  celebrity?: mongoose.Types.ObjectId | null;
  primaryCelebrity?: mongoose.Types.ObjectId | null;
  primaryCelebritySlug?: string;
  relatedCelebrities?: IRelatedCelebrity[];
  tags?: string[];
  publishDate?: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  featured: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isBreaking: boolean;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: Date;
  isSourceVerified?: boolean;
  sourceCreditText?: string;
  additionalReferences?: INewsReference[];
  factCheckNotes?: string;
  likes: mongoose.Types.ObjectId[];
  saves: mongoose.Types.ObjectId[];
  comments: INewsComment[];
  seo?: INewsSEO;
  schema: any;
  createdAt: Date;
  updatedAt: Date;
}

// ── SEO sub-schema ────────────────────────────────────────────────────────────
const seoSchema = new Schema<INewsSEO>(
  {
    metaTitle:           { type: String },
    metaDescription:     { type: String },
    secondaryKeywords:    [{ type: String }],
    metaKeywords:        [{ type: String }],
    canonicalUrl:        { type: String },
    robotsIndex:          { type: Boolean, default: true },
    robotsFollow:         { type: Boolean, default: true },
    noindex:             { type: Boolean, default: false },
    nofollow:            { type: Boolean, default: false },
    robots:              { type: String, default: 'index,follow' },
    ogTitle:             { type: String },
    ogDescription:       { type: String },
    ogType:              { type: String },
    ogSiteName:          { type: String },
    ogUrl:               { type: String },
    ogImages:            [{ type: String }],
    ogLocale:            { type: String },
    twitterCard:         { type: String },
    twitterTitle:        { type: String },
    twitterDescription:  { type: String },
    twitterImage:        { type: String },
    twitterSite:         { type: String },
    twitterCreator:      { type: String },
    schemaType:          { type: String },
    publishedTime:       { type: String },
    modifiedTime:        { type: String },
    authorName:          { type: String },
    authorUrl:           { type: String },
    tags:                [{ type: String }],
    contentTags:          [{ type: String }],
    section:             { type: String },
    alternateLangs:      [{ type: String }],
    prevUrl:             { type: String },
    nextUrl:             { type: String },
    canonicalAlternates: [{ type: String }],
    focusKeyword:        { type: String },
    structuredDataDepth: { type: String },
    contentScore:        { type: Number },
    readabilityScore:    { type: Number },
    relatedTopics:       [{ type: String }],
    searchVolume:        { type: Number, default: 0 },
  },
  { _id: false }
);

const relatedCelebritySchema = new Schema<IRelatedCelebrity>(
  {
    name:       { type: String, required: true, trim: true },
    slug:       { type: String, trim: true },
    image:      { type: String, trim: true },
    profileUrl: { type: String, trim: true },
  },
  { _id: false }
);

const galleryImageSchema = new Schema<IGalleryImage>(
  {
    url:       { type: String, required: true, trim: true },
    alt:       { type: String, trim: true },
    caption:   { type: String, trim: true },
    credit:    { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
  },
  { _id: false }
);

const referenceSchema = new Schema<INewsReference>(
  {
    title:      { type: String, trim: true },
    url:        { type: String, trim: true },
    sourceName: { type: String, trim: true },
  },
  { _id: false }
);

const schemaSchema = new Schema<INewsSchema>(
  {
    schemaType:           { type: String, enum: ['NewsArticle', 'Article', 'BlogPosting'], default: 'NewsArticle' },
    schemaHeadline:       { type: String, trim: true },
    schemaDescription:    { type: String, trim: true },
    schemaImage:          { type: String, trim: true },
    schemaArticleSection: { type: String, trim: true },
    schemaKeywords:       [{ type: String }],
    publisherName:        { type: String, trim: true, default: 'CelebrityPersona' },
    publisherLogo:        { type: String, trim: true },
    mainEntityOfPage:     { type: String, trim: true },
  },
  { _id: false }
);

// ── Comment sub-schema ──────────────────────────────────────────────────────
const newsCommentSchema = new Schema<INewsComment>(
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
const celebrityNewsSchema = new Schema<any>(
  {
    title: {
      type: String,
      required: [true, 'News title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      default: '',
    },
    introduction: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },
    backgroundContext: {
      type: String,
      default: '',
    },
    whatHappened: {
      type: String,
      default: '',
    },
    whyItMatters: {
      type: String,
      default: '',
    },
    publicReaction: {
      type: String,
      default: '',
    },
    officialStatement: {
      type: String,
      default: '',
    },
    celebrityQuote: {
      type: String,
      trim: true,
    },
    conclusion: {
      type: String,
      default: '',
    },
    excerpt: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    featuredImageAlt: {
      type: String,
      trim: true,
    },
    featuredImageCaption: {
      type: String,
      trim: true,
    },
    imageCredit: {
      type: String,
      trim: true,
    },
    imageSourceUrl: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    galleryImages: {
      type: [galleryImageSchema],
      default: [],
    },
    videoEmbedUrl: { type: String, trim: true },
    instagramEmbedUrl: { type: String, trim: true },
    youtubeEmbedUrl: { type: String, trim: true },
    xEmbedUrl: { type: String, trim: true },
    author: {
      type: String,
      trim: true,
    },
    authorName: {
      type: String,
      trim: true,
    },
    reviewerName: {
      type: String,
      trim: true,
    },
    readingTime: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
    },
    newsType: {
      type: String,
      trim: true,
      default: 'Entertainment',
    },
    celebrity: {
      type: Schema.Types.ObjectId,
      ref: 'Celebrity',
      default: null,
    },
    primaryCelebrity: {
      type: Schema.Types.ObjectId,
      ref: 'Celebrity',
      default: null,
    },
    primaryCelebritySlug: {
      type: String,
      trim: true,
    },
    relatedCelebrities: {
      type: [relatedCelebritySchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    publishDate: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isBreaking: {
      type: Boolean,
      default: false,
    },
    sourceType: {
      type: String,
      trim: true,
    },
    sourceName: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourcePublishedAt: {
      type: Date,
    },
    isSourceVerified: {
      type: Boolean,
      default: false,
    },
    sourceCreditText: {
      type: String,
      trim: true,
    },
    additionalReferences: {
      type: [referenceSchema],
      default: [],
    },
    factCheckNotes: {
      type: String,
      trim: true,
    },
    likes:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    saves:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [newsCommentSchema], default: [] },
    seo: {
      type: seoSchema,
    },
    schema: {
      type: schemaSchema,
      default: () => ({ schemaType: 'NewsArticle', publisherName: 'CelebrityPersona' }),
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
celebrityNewsSchema.index({ celebrity: 1 });
celebrityNewsSchema.index({ primaryCelebrity: 1 });
celebrityNewsSchema.index({ primaryCelebritySlug: 1 });
celebrityNewsSchema.index({ category: 1 });
celebrityNewsSchema.index({ newsType: 1 });
celebrityNewsSchema.index({ status: 1 });
celebrityNewsSchema.index({ publishDate: -1 });
celebrityNewsSchema.index({ publishedAt: -1 });
celebrityNewsSchema.index({ featured: 1 });
celebrityNewsSchema.index({ isFeatured: 1 });
celebrityNewsSchema.index({ isTrending: 1 });
celebrityNewsSchema.index({ isBreaking: 1 });
celebrityNewsSchema.index({ status: 1, celebrity: 1, publishDate: -1 });
celebrityNewsSchema.index({ status: 1, category: 1, tags: 1, publishDate: -1 });
celebrityNewsSchema.index(
  { title: 'text', excerpt: 'text', author: 'text', authorName: 'text', tags: 'text', 'seo.contentTags': 'text' },
  { name: 'news_text_search' }
);

// Delete cached model in dev so hot-reload always uses the latest schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.CelebrityNews) {
  delete (mongoose.models as any).CelebrityNews;
}

const CelebrityNews: Model<ICelebrityNews> =
  mongoose.models.CelebrityNews ||
  mongoose.model<ICelebrityNews>('CelebrityNews', celebrityNewsSchema);

export default CelebrityNews;
