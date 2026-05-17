import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IPersonCredit {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
  roleName?: string;
  characterDescription?: string;
  displayOrder?: number;
}

export interface ICrewCredit {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
}

export interface IGalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

export interface IReferenceLink {
  title?: string;
  url?: string;
  sourceName?: string;
}

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
  twitterCreator?: string;
  structuredData?: string;
  focusKeyword?: string;
  schemaType?: string;
  authorName?: string;
  authorUrl?: string;
  articleSection?: string;
  relatedTopics?: string[];
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  altText?: string;
  imageDescription?: string;
  robots?: string;
  priority?: number;
  changeFreq?: string;
}

export interface IMovieComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface IMovie extends Document {
  title: string;
  originalTitle?: string;
  slug: string;
  tagline?: string;
  excerpt?: string;
  status?: string;
  movieType?: string;
  languages?: string[];
  originalLanguage?: string;
  country?: string;
  genres?: string[];
  subgenres?: string[];
  certification?: string;
  runtimeValue?: number;
  runtimeUnit?: 'minutes' | 'hours';
  isFeatured?: boolean;
  isTrending?: boolean;
  isEditorPick?: boolean;
  releaseDate?: Date;
  releaseDateText?: string;
  releaseYear?: number;
  theatricalReleaseDate?: Date;
  ottReleaseDate?: Date;
  ottPlatform?: string;
  streamingPlatform?: string;
  worldwideRelease?: boolean;
  indiaRelease?: boolean;
  releaseCountries?: string[];
  releaseLanguages?: string[];
  dubbedLanguages?: string[];
  preorderOrWatchlistUrl?: string;
  ticketBookingUrl?: string;
  whereToWatchText?: string;
  availabilityStatus?: string;
  leadCast?: IPersonCredit[];
  supportingCast?: IPersonCredit[];
  cameoCast?: IPersonCredit[];
  director?: ICrewCredit[] | string;
  producers?: ICrewCredit[] | string[];
  writers?: ICrewCredit[] | string[];
  screenplay?: string[];
  storyBy?: string[];
  musicDirector?: string[];
  cinematographer?: string[];
  editor?: string[];
  productionDesigner?: string[];
  costumeDesigner?: string[];
  actionDirector?: string[];
  choreographer?: string[];
  castingDirector?: string[];
  productionCompanies?: string[];
  distributor?: string;
  ottPartner?: string;
  synopsis?: string;
  plotSummary?: string;
  storyline?: string;
  premise?: string;
  officialDescription?: string;
  whatToExpect?: string;
  trailerBreakdown?: string;
  castPerformanceExpectations?: string;
  whyThisMovieIsImportant?: string;
  audienceBuzz?: string;
  similarMovies?: string[];
  finalPreviewNote?: string;
  spoilerWarning?: boolean;
  spoilerContent?: string;
  posterImage?: string;
  posterImageAlt?: string;
  posterImageCaption?: string;
  backdropImage?: string;
  featuredImage?: string;
  galleryImages?: IGalleryImage[];
  trailerUrl?: string;
  teaserUrl?: string;
  videoEmbedUrl?: string;
  youtubeVideoId?: string;
  trailerThumbnail?: string;
  trailerDuration?: string;
  trailerPublishedAt?: Date;
  officialClipUrls?: string[];
  instagramEmbedUrl?: string;
  xEmbedUrl?: string;
  productionStatus?: string;
  filmingStartDate?: Date;
  filmingEndDate?: Date;
  filmingLocations?: string[];
  budget?: string | number;
  boxOfficeCollection?: string;
  productionCompany?: string;
  distributorName?: string;
  musicLabel?: string;
  aspectRatio?: string;
  soundMix?: string;
  color?: string;
  primaryFilmingLanguage?: string;
  officialWebsite?: string;
  imdbUrl?: string;
  wikipediaUrl?: string;
  platformUrl?: string;
  youtubeTrailerUrl?: string;
  pressReleaseUrl?: string;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: Date;
  isSourceVerified?: boolean;
  sourceCreditText?: string;
  additionalReferences?: IReferenceLink[];
  factCheckNotes?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  contentTags?: string[];
  breadcrumbTitle?: string;
  enableMovieSchema?: boolean;
  enableArticleSchema?: boolean;
  enableVideoObjectSchema?: boolean;
  schemaMovieName?: string;
  schemaMovieDescription?: string;
  schemaMovieImage?: string;
  schemaReleaseDate?: Date;
  schemaDirector?: string[];
  schemaActor?: string[];
  schemaGenre?: string[];
  schemaCountryOfOrigin?: string;
  schemaDuration?: string;
  schemaArticleHeadline?: string;
  schemaArticleDescription?: string;
  schemaArticleSection?: string;
  schemaVideoName?: string;
  schemaVideoDescription?: string;
  schemaVideoThumbnail?: string;
  schemaVideoUploadDate?: Date;
  schemaVideoDuration?: string;
  publisherName?: string;
  publisherLogo?: string;
  mainEntityOfPage?: string;
  schemaKeywords?: string[];
  publishStatus?: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledAt?: Date;
  authorName?: string;
  reviewerName?: string;
  readingTime?: number;

  // Legacy compatibility fields used by existing pages/routes.
  poster?: string;
  backdrop?: string;
  language?: string[];
  worldwide?: boolean;
  genre?: string[];
  cast?: ICastMember[];
  productionNotes?: string;
  anticipationScore?: number;
  duration?: number;
  mpaaRating?: string;
  regions?: string[];
  subtitles?: string[];
  boxOfficeProjection?: number;
  featured?: boolean;
  images?: string[];
  studio?: string;
  trailer?: string;
  ticketLinks?: ITicketLink[];
  preOrderAvailable?: boolean;
  seoData?: IMovieSEO;
  likes: Types.ObjectId[];
  saves: Types.ObjectId[];
  comments: IMovieComment[];
  createdAt: Date;
  updatedAt: Date;
}

const personCreditSchema = new Schema<IPersonCredit>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    image: { type: String, trim: true },
    roleName: { type: String, trim: true },
    characterDescription: { type: String, trim: true },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const crewCreditSchema = new Schema<ICrewCredit>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    image: { type: String, trim: true },
  },
  { _id: true }
);

const galleryImageSchema = new Schema<IGalleryImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    caption: { type: String, trim: true },
    credit: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
  },
  { _id: true }
);

const referenceSchema = new Schema<IReferenceLink>(
  {
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    sourceName: { type: String, trim: true },
  },
  { _id: true }
);

const castSchema = new Schema<ICastMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    character: { type: String, trim: true },
    image: { type: String, trim: true },
    celebrityId: { type: String, trim: true },
  },
  { _id: true }
);

const commentSchema = new Schema<IMovieComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const ticketLinkSchema = new Schema<ITicketLink>(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
  },
  { _id: true }
);

const seoDataSchema = new Schema<IMovieSEO>(
  {
    metaTitle: String,
    metaDescription: String,
    keywords: [{ type: String }],
    canonicalUrl: { type: String, trim: true },
    ogTitle: String,
    ogDescription: String,
    ogImage: { type: String, trim: true },
    ogType: { type: String, trim: true, default: 'video.movie' },
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: { type: String, trim: true },
    twitterCard: { type: String, trim: true, default: 'summary_large_image' },
    twitterCreator: { type: String, trim: true },
    structuredData: String,
    focusKeyword: { type: String, trim: true },
    schemaType: { type: String, trim: true, default: 'Movie' },
    authorName: { type: String, trim: true },
    authorUrl: { type: String, trim: true },
    articleSection: { type: String, trim: true },
    relatedTopics: [{ type: String }],
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    altText: String,
    imageDescription: String,
    robots: { type: String, trim: true, default: 'index,follow' },
    priority: { type: Number, min: 0, max: 1, default: 0.8 },
    changeFreq: { type: String, trim: true, default: 'weekly' },
  },
  { _id: false }
);

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: 200,
    },
    originalTitle: { type: String, trim: true },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    tagline: { type: String, trim: true },
    excerpt: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'announced',
        'in_production',
        'post_production',
        'trailer_released',
        'coming_soon',
        'released',
        'postponed',
        'cancelled',
        'published',
        'draft',
      ],
      default: 'announced',
    },
    movieType: { type: String, trim: true },
    languages: { type: [String], default: [] },
    originalLanguage: { type: String, trim: true },
    country: { type: String, trim: true },
    genres: { type: [String], default: [] },
    subgenres: { type: [String], default: [] },
    certification: { type: String, trim: true },
    runtimeValue: { type: Number },
    runtimeUnit: { type: String, enum: ['minutes', 'hours'], default: 'minutes' },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isEditorPick: { type: Boolean, default: false },

    releaseDate: { type: Date },
    releaseDateText: { type: String, trim: true },
    releaseYear: { type: Number },
    theatricalReleaseDate: { type: Date },
    ottReleaseDate: { type: Date },
    ottPlatform: { type: String, trim: true },
    streamingPlatform: { type: String, trim: true },
    worldwideRelease: { type: Boolean, default: false },
    indiaRelease: { type: Boolean, default: false },
    releaseCountries: { type: [String], default: [] },
    releaseLanguages: { type: [String], default: [] },
    dubbedLanguages: { type: [String], default: [] },
    preorderOrWatchlistUrl: { type: String, trim: true },
    ticketBookingUrl: { type: String, trim: true },
    whereToWatchText: { type: String, trim: true },
    availabilityStatus: {
      type: String,
      enum: [
        'coming_soon',
        'in_cinemas',
        'streaming_soon',
        'now_streaming',
        'tickets_open',
        'watchlist_available',
        'release_date_not_confirmed',
        'postponed',
      ],
      default: 'coming_soon',
    },

    leadCast: { type: [personCreditSchema], default: [] },
    supportingCast: { type: [personCreditSchema], default: [] },
    cameoCast: { type: [personCreditSchema], default: [] },
    director: { type: [crewCreditSchema], default: [] },
    producers: { type: [crewCreditSchema], default: [] },
    writers: { type: [crewCreditSchema], default: [] },
    screenplay: { type: [String], default: [] },
    storyBy: { type: [String], default: [] },
    musicDirector: { type: [String], default: [] },
    cinematographer: { type: [String], default: [] },
    editor: { type: [String], default: [] },
    productionDesigner: { type: [String], default: [] },
    costumeDesigner: { type: [String], default: [] },
    actionDirector: { type: [String], default: [] },
    choreographer: { type: [String], default: [] },
    castingDirector: { type: [String], default: [] },
    productionCompanies: { type: [String], default: [] },
    distributor: { type: String, trim: true },
    ottPartner: { type: String, trim: true },

    synopsis: { type: String },
    plotSummary: { type: String },
    storyline: { type: String },
    premise: { type: String },
    officialDescription: { type: String },
    whatToExpect: { type: String },
    trailerBreakdown: { type: String },
    castPerformanceExpectations: { type: String },
    whyThisMovieIsImportant: { type: String },
    audienceBuzz: { type: String },
    similarMovies: { type: [String], default: [] },
    finalPreviewNote: { type: String },
    spoilerWarning: { type: Boolean, default: false },
    spoilerContent: { type: String },

    posterImage: { type: String, trim: true },
    posterImageAlt: { type: String, trim: true },
    posterImageCaption: { type: String, trim: true },
    backdropImage: { type: String, trim: true },
    featuredImage: { type: String, trim: true },
    galleryImages: { type: [galleryImageSchema], default: [] },
    trailerUrl: { type: String, trim: true },
    teaserUrl: { type: String, trim: true },
    videoEmbedUrl: { type: String, trim: true },
    youtubeVideoId: { type: String, trim: true },
    trailerThumbnail: { type: String, trim: true },
    trailerDuration: { type: String, trim: true },
    trailerPublishedAt: { type: Date },
    officialClipUrls: { type: [String], default: [] },
    instagramEmbedUrl: { type: String, trim: true },
    xEmbedUrl: { type: String, trim: true },

    productionStatus: { type: String, trim: true },
    filmingStartDate: { type: Date },
    filmingEndDate: { type: Date },
    filmingLocations: { type: [String], default: [] },
    budget: { type: Schema.Types.Mixed },
    boxOfficeCollection: { type: String, trim: true },
    productionCompany: { type: String, trim: true },
    distributorName: { type: String, trim: true },
    musicLabel: { type: String, trim: true },
    aspectRatio: { type: String, trim: true },
    soundMix: { type: String, trim: true },
    color: { type: String, trim: true },
    primaryFilmingLanguage: { type: String, trim: true },

    officialWebsite: { type: String, trim: true },
    imdbUrl: { type: String, trim: true },
    wikipediaUrl: { type: String, trim: true },
    platformUrl: { type: String, trim: true },
    youtubeTrailerUrl: { type: String, trim: true },
    pressReleaseUrl: { type: String, trim: true },
    sourceType: { type: String, trim: true },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    sourcePublishedAt: { type: Date },
    isSourceVerified: { type: Boolean, default: false },
    sourceCreditText: { type: String, trim: true },
    additionalReferences: { type: [referenceSchema], default: [] },
    factCheckNotes: { type: String },

    focusKeyword: { type: String, trim: true },
    secondaryKeywords: { type: [String], default: [] },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImage: { type: String, trim: true },
    twitterTitle: { type: String, trim: true },
    twitterDescription: { type: String, trim: true },
    twitterImage: { type: String, trim: true },
    contentTags: { type: [String], default: [] },
    breadcrumbTitle: { type: String, trim: true },

    enableMovieSchema: { type: Boolean, default: true },
    enableArticleSchema: { type: Boolean, default: true },
    enableVideoObjectSchema: { type: Boolean, default: false },
    schemaMovieName: { type: String, trim: true },
    schemaMovieDescription: { type: String, trim: true },
    schemaMovieImage: { type: String, trim: true },
    schemaReleaseDate: { type: Date },
    schemaDirector: { type: [String], default: [] },
    schemaActor: { type: [String], default: [] },
    schemaGenre: { type: [String], default: [] },
    schemaCountryOfOrigin: { type: String, trim: true },
    schemaDuration: { type: String, trim: true },
    schemaArticleHeadline: { type: String, trim: true },
    schemaArticleDescription: { type: String, trim: true },
    schemaArticleSection: { type: String, trim: true, default: 'Upcoming Movies' },
    schemaVideoName: { type: String, trim: true },
    schemaVideoDescription: { type: String, trim: true },
    schemaVideoThumbnail: { type: String, trim: true },
    schemaVideoUploadDate: { type: Date },
    schemaVideoDuration: { type: String, trim: true },
    publisherName: { type: String, trim: true, default: 'CelebrityPersona' },
    publisherLogo: { type: String, trim: true },
    mainEntityOfPage: { type: String, trim: true },
    schemaKeywords: { type: [String], default: [] },

    publishStatus: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    authorName: { type: String, trim: true },
    reviewerName: { type: String, trim: true },
    readingTime: { type: Number },

    poster: { type: String, trim: true },
    backdrop: { type: String, trim: true },
    language: { type: [String], default: [] },
    worldwide: { type: Boolean, default: false },
    genre: { type: [String], default: [] },
    cast: { type: [castSchema], default: [] },
    productionNotes: { type: String },
    anticipationScore: { type: Number, min: 0, max: 10 },
    duration: { type: Number },
    mpaaRating: { type: String, trim: true },
    regions: { type: [String], default: [] },
    subtitles: { type: [String], default: [] },
    boxOfficeProjection: { type: Number },
    featured: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    studio: { type: String, trim: true },
    trailer: { type: String, trim: true },
    ticketLinks: { type: [ticketLinkSchema], default: [] },
    preOrderAvailable: { type: Boolean, default: false },
    seoData: { type: seoDataSchema },

    likes: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    saves: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

movieSchema.index({ releaseDate: -1 });
movieSchema.index({ releaseYear: -1 });
movieSchema.index({ status: 1 });
movieSchema.index({ publishStatus: 1 });
movieSchema.index({ availabilityStatus: 1 });
movieSchema.index({ isFeatured: 1, featured: 1 });
movieSchema.index({ isTrending: 1 });
movieSchema.index({ isEditorPick: 1 });
movieSchema.index({ genres: 1, genre: 1 });
movieSchema.index({ languages: 1, language: 1 });
movieSchema.index({ ottPlatform: 1 });
movieSchema.index({ 'leadCast.slug': 1, 'cast.name': 1 });
movieSchema.index({ 'director.slug': 1, 'director.name': 1 });
movieSchema.index(
  {
    title: 'text',
    originalTitle: 'text',
    excerpt: 'text',
    synopsis: 'text',
    'leadCast.name': 'text',
    'director.name': 'text',
    genres: 'text',
    languages: 'text',
  },
  { name: 'movie_text_search', language_override: 'search_language' }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.Movie) {
  delete (mongoose.models as any).Movie;
}

const Movie: Model<IMovie> = mongoose.models.Movie || mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;
