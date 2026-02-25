import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Sub-document interfaces ───────────────────────────────────────────────────

export interface IReviewAuthor {
  name: string;
  avatar?: string;
  bio?: string;
  credentials?: string;
  reviewCount?: number;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface IReviewCastMember {
  name: string;
  character?: string;
  image?: string;
}

export interface IMovieDetails {
  releaseYear?: number;
  director?: string;
  writers?: string[];
  cast?: IReviewCastMember[];
  genre?: string[];
  runtime?: number;
  budget?: string;
  boxOffice?: string;
  studio?: string;
  mpaaRating?: string;
}

export interface IScores {
  criticsScore?: number;
  audienceScore?: number;
  imdbRating?: number;
  rottenTomatoesScore?: number;
}

export interface IReviewStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  helpful?: number;
  notHelpful?: number;
}

export interface IReviewComment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface IReviewSEO {
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
  focusKeyword?: string;
  structuredDataDepth?: string;
}

// ── Main interface ────────────────────────────────────────────────────────────
export interface IMovieReview extends Document {
  title: string;
  slug: string;
  movieTitle: string;
  poster?: string;
  backdropImage?: string;
  trailer?: string;
  rating: number;
  content: string;
  excerpt?: string;
  author: IReviewAuthor;
  movieDetails?: IMovieDetails;
  scores?: IScores;
  publishDate?: Date;
  featured: boolean;
  stats?: IReviewStats;
  pros?: string[];
  cons?: string[];
  verdict?: string;
  seoData?: IReviewSEO;
  seo?: IReviewSEO;  // alias used in some DB documents
  likes: mongoose.Types.ObjectId[];
  saves: mongoose.Types.ObjectId[];
  comments: IReviewComment[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const socialMediaSchema = new Schema(
  { twitter: String, instagram: String, website: String },
  { _id: false }
);

const authorSchema = new Schema<IReviewAuthor>(
  {
    name:        { type: String, required: true, trim: true },
    avatar:      { type: String },
    bio:         { type: String },
    credentials: { type: String },
    reviewCount: { type: Number, default: 0 },
    socialMedia: { type: socialMediaSchema, default: {} },
  },
  { _id: true }
);

const castMemberSchema = new Schema<IReviewCastMember>(
  { name: { type: String, required: true }, character: String, image: String },
  { _id: true }
);

const movieDetailsSchema = new Schema<IMovieDetails>(
  {
    releaseYear: Number,
    director:   { type: String },
    writers:    [{ type: String }],
    cast:       [castMemberSchema],
    genre:      [{ type: String }],
    runtime:    Number,
    budget:     { type: String },
    boxOffice:  { type: String },
    studio:     { type: String },
    mpaaRating: { type: String },
  },
  { _id: true }
);

const scoresSchema = new Schema<IScores>(
  {
    criticsScore:         Number,
    audienceScore:        Number,
    imdbRating:           Number,
    rottenTomatoesScore:  Number,
  },
  { _id: true }
);

const statsSchema = new Schema<IReviewStats>(
  {
    views:      { type: Number, default: 0 },
    likes:      { type: Number, default: 0 },
    comments:   { type: Number, default: 0 },
    shares:     { type: Number, default: 0 },
    helpful:    { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
  },
  { _id: true }
);

const commentSchema = new Schema<IReviewComment>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:   { type: String, required: true },
    userAvatar: { type: String },
    text:       { type: String, required: true, maxlength: 1000 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: true }
);

const seoSchema = new Schema<IReviewSEO>(
  {
    metaTitle:            String,
    metaDescription:      String,
    metaKeywords:         [{ type: String }],
    canonicalUrl:         String,
    noindex:              { type: Boolean, default: false },
    nofollow:             { type: Boolean, default: false },
    robots:               { type: String, default: 'index,follow' },
    ogTitle:              String,
    ogDescription:        String,
    ogType:               { type: String, default: 'article' },
    ogSiteName:           { type: String, default: 'Celebrity Persona' },
    ogUrl:                String,
    ogImages:             [{ type: String }],
    ogLocale:             { type: String, default: 'en_US' },
    twitterCard:          { type: String, default: 'summary_large_image' },
    twitterTitle:         String,
    twitterDescription:   String,
    twitterImage:         String,
    twitterSite:          String,
    twitterCreator:       String,
    schemaType:           { type: String, default: 'Review' },
    focusKeyword:         String,
    structuredDataDepth:  { type: String, default: 'minimal' },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const movieReviewSchema = new Schema<IMovieReview>(
  {
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
    },
    movieTitle: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    poster:       { type: String },
    backdropImage:{ type: String },
    trailer:      { type: String },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating must be at least 0'],
      max: [10, 'Rating cannot exceed 10'],
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
    },
    excerpt:      { type: String },
    author:       { type: authorSchema, required: true },
    movieDetails: { type: movieDetailsSchema },
    scores:       { type: scoresSchema },
    publishDate:  { type: Date },
    featured:     { type: Boolean, default: false },
    stats:        { type: statsSchema, default: {} },
    pros:         [{ type: String }],
    cons:         [{ type: String }],
    verdict:      { type: String },
    seoData:      { type: seoSchema },
    seo:          { type: seoSchema },  // alias for documents saved with 'seo' key
    likes:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
    saves:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments:     [commentSchema],
  },
  { timestamps: true }
);

movieReviewSchema.index({ slug: 1 }, { unique: true, sparse: true });
movieReviewSchema.index({ publishDate: -1 });
movieReviewSchema.index({ rating: -1 });
movieReviewSchema.index({ featured: 1 });
movieReviewSchema.index({ title: 'text', movieTitle: 'text', excerpt: 'text' });

const MovieReview: Model<IMovieReview> =
  mongoose.models.MovieReview ||
  mongoose.model<IMovieReview>('MovieReview', movieReviewSchema);

export default MovieReview;
