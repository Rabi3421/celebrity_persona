import mongoose, { Document, Model, Schema } from 'mongoose';

// ── SEO sub-document ──────────────────────────────────────────────────────────
export interface INewsSEO {
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
  content: string;
  excerpt?: string;
  thumbnail?: string;
  author?: string;
  category?: string;
  celebrity?: mongoose.Types.ObjectId | null;
  tags?: string[];
  publishDate?: Date;
  featured: boolean;
  likes: mongoose.Types.ObjectId[];
  saves: mongoose.Types.ObjectId[];
  comments: INewsComment[];
  seo?: INewsSEO;
  createdAt: Date;
  updatedAt: Date;
}

// ── SEO sub-schema ────────────────────────────────────────────────────────────
const seoSchema = new Schema<INewsSEO>(
  {
    metaTitle:           { type: String },
    metaDescription:     { type: String },
    metaKeywords:        [{ type: String }],
    canonicalUrl:        { type: String },
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
const celebrityNewsSchema = new Schema<ICelebrityNews>(
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
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    celebrity: {
      type: Schema.Types.ObjectId,
      ref: 'Celebrity',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    publishDate: {
      type: Date,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    likes:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    saves:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [newsCommentSchema], default: [] },
    seo: {
      type: seoSchema,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
celebrityNewsSchema.index({ celebrity: 1 });
celebrityNewsSchema.index({ category: 1 });
celebrityNewsSchema.index({ publishDate: -1 });
celebrityNewsSchema.index({ featured: 1 });
celebrityNewsSchema.index(
  { title: 'text', excerpt: 'text', author: 'text' },
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
