import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ── Sub-document interfaces ───────────────────────────────────────────────────

export interface ICastMember {
  name: string;
  role?: string;
  character?: string;
  image?: string;
  celebrityId?: string;
}

export interface ITicketLink {
  platform: string;
  url: string;
  available: boolean;
}

export interface IMovieSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  structuredData?: string;
  focusKeyword?: string;
  altText?: string;
  imageDescription?: string;
  robots?: string;
  priority?: number;
  changeFreq?: string;
}

// ── Comment sub-document ────────────────────────────────────────────────────
export interface IMovieComment {
  _id: Types.ObjectId;
  userId:     Types.ObjectId;
  userName:   string;
  userAvatar?: string;
  text:       string;
  createdAt:  Date;
}

// ── Main interface ────────────────────────────────────────────────────────────
export interface IMovie extends Document {
  title: string;
  slug: string;
  releaseDate?: Date;
  poster?: string;
  backdrop?: string;
  language?: string[];
  originalLanguage?: string;
  worldwide?: boolean;
  genre?: string[];
  director?: string;
  writers?: string[];
  producers?: string[];
  cast?: ICastMember[];
  synopsis?: string;
  plotSummary?: string;
  productionNotes?: string;
  status?: string;
  anticipationScore?: number;
  duration?: number;
  mpaaRating?: string;
  regions?: string[];
  subtitles?: string[];
  budget?: number;
  boxOfficeProjection?: number;
  featured: boolean;
  images?: string[];
  studio?: string;
  trailer?: string;
  ticketLinks?: ITicketLink[];
  preOrderAvailable?: boolean;
  seoData?: IMovieSEO;
  // interaction fields
  likes:    Types.ObjectId[];
  saves:    Types.ObjectId[];
  comments: IMovieComment[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────
const castSchema = new Schema<ICastMember>(
  {
    name:        { type: String, required: true, trim: true },
    role:        { type: String, trim: true },
    character:   { type: String, trim: true },
    image:       { type: String, trim: true },
    celebrityId: { type: String, trim: true },
  },
  { _id: true }
);

const commentSchema = new Schema<IMovieComment>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:   { type: String, required: true },
    userAvatar: { type: String },
    text:       { type: String, required: true, maxlength: 1000 },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const ticketLinkSchema = new Schema<ITicketLink>(
  {
    platform:  { type: String, required: true, trim: true },
    url:       { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
  },
  { _id: true }
);

const seoDataSchema = new Schema<IMovieSEO>(
  {
    metaTitle:        { type: String },
    metaDescription:  { type: String },
    keywords:         [{ type: String }],
    canonicalUrl:     { type: String, trim: true },
    ogTitle:          { type: String },
    ogDescription:    { type: String },
    ogImage:          { type: String, trim: true },
    ogType:           { type: String, trim: true, default: 'movie' },
    twitterTitle:     { type: String },
    twitterDescription: { type: String },
    twitterImage:     { type: String, trim: true },
    twitterCard:      { type: String, trim: true, default: 'summary_large_image' },
    structuredData:   { type: String },
    focusKeyword:     { type: String, trim: true },
    altText:          { type: String },
    imageDescription: { type: String },
    robots:           { type: String, trim: true, default: 'index,follow' },
    priority:         { type: Number, min: 0, max: 1, default: 0.8 },
    changeFreq:       { type: String, trim: true, default: 'weekly' },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
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
    releaseDate:        { type: Date },
    poster:             { type: String, trim: true },
    backdrop:           { type: String, trim: true },
    language:           { type: [String], default: [] },
    originalLanguage:   { type: String, trim: true },
    worldwide:          { type: Boolean, default: false },
    genre:              { type: [String], default: [] },
    director:           { type: String, trim: true },
    writers:            { type: [String], default: [] },
    producers:          { type: [String], default: [] },
    cast:               { type: [castSchema], default: [] },
    synopsis:           { type: String },
    plotSummary:        { type: String },
    productionNotes:    { type: String },
    status:             { type: String, trim: true },
    anticipationScore:  { type: Number, min: 0, max: 10 },
    duration:           { type: Number },         // minutes
    mpaaRating:         { type: String, trim: true },
    regions:            { type: [String], default: [] },
    subtitles:          { type: [String], default: [] },
    budget:             { type: Number },
    boxOfficeProjection:{ type: Number },
    featured:           { type: Boolean, default: false },
    images:             { type: [String], default: [] },
    studio:             { type: String, trim: true },
    trailer:            { type: String, trim: true },
    ticketLinks:        { type: [ticketLinkSchema], default: [] },
    preOrderAvailable:  { type: Boolean, default: false },
    seoData:            { type: seoDataSchema },
    // interaction fields
    likes:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    saves:    { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ status: 1 });
movieSchema.index({ featured: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index(
  { title: 'text', synopsis: 'text', director: 'text' },
  // language_override prevents MongoDB from treating the 'language' array
  // field as a text-search language selector (error code 17261).
  { name: 'movie_text_search', language_override: 'search_language' }
);

// Delete cached model in dev so hot-reload always uses the latest schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.Movie) {
  delete (mongoose.models as any).Movie;
}

const Movie: Model<IMovie> =
  mongoose.models.Movie ||
  mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;
