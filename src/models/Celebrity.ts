import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMovie extends Document {
  name: string;
  role: string;
  year: string;
  director: string;
  genre: string;
  description: string;
  _id?: string;
}

export interface ISEO extends Document {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogUrl?: string;
  ogImages: string[];
  ogLocale?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  schemaType?: string;
  schemaJson?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags: string[];
  section?: string;
  alternateLangs: string[];
  prevUrl?: string;
  nextUrl?: string;
  canonicalAlternates: string[];
  focusKeyword?: string;
  structuredDataDepth?: string;
  contentScore?: number;
  readabilityScore?: number;
  relatedTopics: string[];
  searchVolume?: number;
  authorUrl?: string;
}

export interface ICelebrity extends Document {
  _id: string;
  name: string;
  slug: string;
  born?: string;
  birthPlace?: string;
  died?: string;
  age?: number;
  nationality?: string;
  citizenship: string[];
  occupation: string[];
  yearsActive?: string;
  height?: string;
  weight?: string;
  bodyMeasurements?: string;
  eyeColor?: string;
  hairColor?: string;
  spouse?: string;
  children: string[];
  parents: string[];
  siblings: string[];
  relatives: string[];
  education: string[];
  netWorth?: string;
  introduction?: string;
  earlyLife?: string;
  career?: string;
  personalLife?: string;
  achievements: string[];
  controversies: string[];
  philanthropy: string[];
  trivia: string[];
  works: string[];
  movies: IMovie[];
  quotes: string[];
  relatedCelebrities: string[];
  newsArticles: string[];
  socialMedia: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  seo: ISEO;
  popularity?: number;
  popularityScore?: number;
  viewCount?: number;
  shareCount?: number;
  searchRank?: number;
  trendingScore?: number;
  isActive: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  contentQuality?: 'draft' | 'review' | 'published' | 'archived';
  tags: string[];
  categories: string[];
  language?: string;
  profileImage?: string;
  coverImage?: string;
  galleryImages: string[];
  status?: 'draft' | 'published' | 'archived';
  isScheduled?: boolean;
  publishAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  director: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true });

const seoSchema = new Schema<ISEO>({
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  canonicalUrl: String,
  noindex: { type: Boolean, default: false },
  nofollow: { type: Boolean, default: false },
  robots: String,
  ogTitle: String,
  ogDescription: String,
  ogType: String,
  ogSiteName: String,
  ogUrl: String,
  ogImages: [String],
  ogLocale: String,
  twitterCard: String,
  twitterTitle: String,
  twitterDescription: String,
  twitterImage: String,
  twitterSite: String,
  twitterCreator: String,
  schemaType: String,
  schemaJson: String,
  publishedTime: String,
  modifiedTime: String,
  authorName: String,
  tags: [String],
  section: String,
  alternateLangs: [String],
  prevUrl: String,
  nextUrl: String,
  canonicalAlternates: [String],
  focusKeyword: String,
  structuredDataDepth: String,
  contentScore: { type: Number, default: 0 },
  readabilityScore: { type: Number, default: 0 },
  relatedTopics: [String],
  searchVolume: { type: Number, default: 0 },
  authorUrl: String
}, { _id: false });

const celebritySchema = new Schema<ICelebrity>(
  {
    name: {
      type: String,
      required: [true, 'Celebrity name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    born: {
      type: String,
      trim: true
    },
    birthPlace: {
      type: String,
      trim: true
    },
    died: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    nationality: {
      type: String,
      trim: true
    },
    citizenship: [String],
    occupation: [String],
    yearsActive: {
      type: String,
      trim: true
    },
    height: {
      type: String,
      trim: true
    },
    weight: {
      type: String,
      trim: true
    },
    bodyMeasurements: {
      type: String,
      trim: true
    },
    eyeColor: {
      type: String,
      trim: true
    },
    hairColor: {
      type: String,
      trim: true
    },
    spouse: {
      type: String,
      trim: true
    },
    children: [String],
    parents: [String],
    siblings: [String],
    relatives: [String],
    education: [String],
    netWorth: {
      type: String,
      trim: true
    },
    introduction: {
      type: String,
      trim: true
    },
    earlyLife: {
      type: String,
      trim: true
    },
    career: {
      type: String,
      trim: true
    },
    personalLife: {
      type: String,
      trim: true
    },
    achievements: [String],
    controversies: [String],
    philanthropy: [String],
    trivia: [String],
    works: [String],
    movies: [movieSchema],
    quotes: [String],
    relatedCelebrities: [String],
    newsArticles: [String],
    socialMedia: {
      instagram: String,
      twitter: String,
      facebook: String,
      youtube: String,
      tiktok: String,
      website: String
    },
    seo: {
      type: seoSchema,
      required: true
    },
    popularity: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    searchRank: {
      type: Number,
      default: 0
    },
    trendingScore: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    contentQuality: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived'],
      default: 'draft'
    },
    tags: [String],
    categories: [String],
    language: {
      type: String,
      default: 'en'
    },
    profileImage: String,
    coverImage: String,
    galleryImages: [String],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    isScheduled: {
      type: Boolean,
      default: false
    },
    publishAt: Date
  },
  {
    timestamps: true,
  }
);

// Index for search functionality.
// language_override points to a field that doesn't exist in the schema so
// MongoDB never tries to use the `language` content field as a stemmer name.
celebritySchema.index(
  { name: 'text', introduction: 'text', career: 'text', tags: 'text', categories: 'text' },
  { default_language: 'english', language_override: '_textLanguage' }
);

// Compound indexes for performance
celebritySchema.index({ status: 1, isActive: 1 });
celebritySchema.index({ slug: 1 });
celebritySchema.index({ viewCount: -1 });
celebritySchema.index({ popularityScore: -1 });

const Celebrity: Model<ICelebrity> = mongoose.models.Celebrity || mongoose.model<ICelebrity>('Celebrity', celebritySchema);

export default Celebrity;