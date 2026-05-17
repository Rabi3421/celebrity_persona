export const MOVIE_STATUSES = [
  'announced',
  'in_production',
  'post_production',
  'trailer_released',
  'coming_soon',
  'released',
  'postponed',
  'cancelled',
] as const;

export const AVAILABILITY_STATUSES = [
  'coming_soon',
  'in_cinemas',
  'streaming_soon',
  'now_streaming',
  'tickets_open',
  'watchlist_available',
  'release_date_not_confirmed',
  'postponed',
] as const;

export const PUBLISH_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export const RUNTIME_UNITS = ['minutes', 'hours'] as const;

export type MovieStatus = (typeof MOVIE_STATUSES)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];
export type RuntimeUnit = (typeof RUNTIME_UNITS)[number];

type AnyRecord = Record<string, any>;

const RELEASED_LEGACY_STATUSES = [
  'Released',
  'Now Showing',
  'Now Playing',
  'In Theatres',
  'In Theaters',
];

const RELEASED_STATUS_VALUES = ['released', ...RELEASED_LEGACY_STATUSES];
const NOT_PUBLIC_STATUS_VALUES = ['cancelled', 'Cancelled', 'draft', 'scheduled', 'archived'];

export function slugifyMovie(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function list(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return String(value)
    .split(/[,;\n]+/)
    .map(text)
    .filter(Boolean);
}

export function peopleNames(value: unknown): string[] {
  if (!Array.isArray(value)) return list(value);
  return value
    .map((item) => {
      if (typeof item === 'string') return text(item);
      if (item && typeof item === 'object') return text((item as AnyRecord).name);
      return '';
    })
    .filter(Boolean);
}

export function dateOrUndefined(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function releaseCutoffDate(referenceDate = new Date()): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + 1
  );
}

export function releasedMovieCondition(referenceDate = new Date()): AnyRecord {
  return {
    $or: [
      { releaseDate: { $lt: releaseCutoffDate(referenceDate) } },
      { status: { $in: RELEASED_STATUS_VALUES } },
    ],
  };
}

export function upcomingMovieCondition(referenceDate = new Date()): AnyRecord {
  return {
    $and: [
      { status: { $nin: RELEASED_STATUS_VALUES } },
      {
        $or: [
          { releaseDate: { $gte: releaseCutoffDate(referenceDate) } },
          { releaseDate: null },
          { releaseDate: { $exists: false } },
          { availabilityStatus: 'release_date_not_confirmed' },
        ],
      },
    ],
  };
}

export function isMovieReleased(movie: AnyRecord, referenceDate = new Date()): boolean {
  const status = text(movie.status);
  if (RELEASED_STATUS_VALUES.includes(status)) return true;
  const releaseDate = dateOrUndefined(movie.releaseDate);
  return Boolean(releaseDate && releaseDate < releaseCutoffDate(referenceDate));
}

export function isValidUrl(value?: string) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function runtimeMinutes(movie: AnyRecord): number | undefined {
  const raw = Number(movie.runtimeValue ?? movie.duration);
  if (!Number.isFinite(raw) || raw <= 0) return undefined;
  return (movie.runtimeUnit || 'minutes') === 'hours' ? Math.round(raw * 60) : Math.round(raw);
}

export function publicMovieQuery(extra: AnyRecord = {}): AnyRecord {
  const extraAnd = Array.isArray(extra.$and) ? extra.$and : [];
  const { $and: _extraAnd, ...rest } = extra;
  return {
    ...rest,
    $and: [
      ...extraAnd,
      {
        $or: [
          { publishStatus: 'published' },
          { publishStatus: { $exists: false }, status: 'published' },
        ],
      },
      {
        status: {
          $nin: NOT_PUBLIC_STATUS_VALUES,
        },
      },
      {
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: null },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
    ],
  };
}

export function releasedMovieQuery(extra: AnyRecord = {}): AnyRecord {
  const extraAnd = Array.isArray(extra.$and) ? extra.$and : [];
  const { $and: _extraAnd, ...rest } = extra;
  return {
    ...rest,
    $and: [
      ...extraAnd,
      {
        $or: [
          { publishStatus: 'published' },
          { publishStatus: { $exists: false }, status: { $ne: 'draft' } },
        ],
      },
      { status: { $nin: NOT_PUBLIC_STATUS_VALUES } },
      {
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: null },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
      releasedMovieCondition(),
    ],
  };
}

export function upcomingMovieQuery(extra: AnyRecord = {}): AnyRecord {
  const extraAnd = Array.isArray(extra.$and) ? extra.$and : [];
  const { $and: _extraAnd, ...rest } = extra;
  return publicMovieQuery({
    ...rest,
    $and: [...extraAnd, upcomingMovieCondition()],
  });
}

function normalizePerson(item: AnyRecord = {}) {
  const name = text(item.name);
  const slug = text(item.slug) || (name ? slugifyMovie(name) : '');
  return {
    name,
    slug,
    profileUrl: text(item.profileUrl) || (slug ? `/celebrity-profiles/${slug}` : ''),
    image: text(item.image || item.profileImage),
    roleName: text(item.roleName || item.role || item.character),
    characterDescription: text(item.characterDescription || item.character),
    displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : 0,
  };
}

function normalizeCrewPerson(item: AnyRecord = {}) {
  const person = normalizePerson(item);
  return {
    name: person.name,
    slug: person.slug,
    profileUrl: person.profileUrl,
    image: person.image,
  };
}

export function serializeMovie(movie: AnyRecord) {
  const leadCast =
    Array.isArray(movie.leadCast) && movie.leadCast.length
      ? movie.leadCast.map(normalizePerson)
      : Array.isArray(movie.cast)
        ? movie.cast.map(normalizePerson)
        : [];
  const director = Array.isArray(movie.director)
    ? movie.director.map(normalizeCrewPerson)
    : list(movie.director).map((name) => normalizeCrewPerson({ name }));
  const genres = list(movie.genres ?? movie.genre);
  const languages = list(movie.languages ?? movie.language);
  const runtime = runtimeMinutes(movie);
  const posterImage = text(movie.posterImage || movie.poster);
  const backdropImage = text(movie.backdropImage || movie.backdrop);
  const trailerUrl = text(movie.trailerUrl || movie.trailer);
  const secondaryKeywords = list(movie.secondaryKeywords ?? movie.seoData?.keywords);
  const contentTags = list(movie.contentTags ?? movie.seoData?.relatedTopics);

  return {
    ...movie,
    id: String(movie._id || movie.id || ''),
    _id: String(movie._id || movie.id || ''),
    title: text(movie.title),
    originalTitle: text(movie.originalTitle),
    slug: text(movie.slug),
    tagline: text(movie.tagline),
    excerpt: text(movie.excerpt || movie.plotSummary || movie.synopsis),
    status: text(movie.status) || 'announced',
    movieType: text(movie.movieType) || 'Feature Film',
    languages,
    language: languages,
    genres,
    genre: genres,
    posterImage,
    poster: posterImage,
    posterImageAlt: text(movie.posterImageAlt || movie.seoData?.altText) || `${movie.title} poster`,
    backdropImage,
    backdrop: backdropImage,
    featuredImage: text(movie.featuredImage || backdropImage || posterImage),
    trailerUrl,
    trailer: trailerUrl,
    youtubeVideoId: text(movie.youtubeVideoId),
    runtimeValue: Number(movie.runtimeValue ?? movie.duration) || undefined,
    runtimeUnit: text(movie.runtimeUnit) || 'minutes',
    duration: runtime,
    isFeatured: Boolean(movie.isFeatured ?? movie.featured),
    featured: Boolean(movie.isFeatured ?? movie.featured),
    isTrending: Boolean(movie.isTrending),
    isEditorPick: Boolean(movie.isEditorPick),
    worldwideRelease: Boolean(movie.worldwideRelease ?? movie.worldwide),
    worldwide: Boolean(movie.worldwideRelease ?? movie.worldwide),
    certification: text(movie.certification || movie.mpaaRating),
    mpaaRating: text(movie.certification || movie.mpaaRating),
    leadCast,
    cast: leadCast,
    supportingCast: Array.isArray(movie.supportingCast)
      ? movie.supportingCast.map(normalizePerson)
      : [],
    cameoCast: Array.isArray(movie.cameoCast) ? movie.cameoCast.map(normalizePerson) : [],
    director,
    directorText: director.map((item: AnyRecord) => item.name).join(', '),
    producers: Array.isArray(movie.producers)
      ? movie.producers.map((item: AnyRecord | string) =>
          typeof item === 'string' ? normalizeCrewPerson({ name: item }) : normalizeCrewPerson(item)
        )
      : [],
    writers: Array.isArray(movie.writers)
      ? movie.writers.map((item: AnyRecord | string) =>
          typeof item === 'string' ? normalizeCrewPerson({ name: item }) : normalizeCrewPerson(item)
        )
      : [],
    productionCompany: text(movie.productionCompany || movie.studio),
    studio: text(movie.productionCompany || movie.studio),
    ticketBookingUrl: text(movie.ticketBookingUrl || movie.ticketLinks?.[0]?.url),
    preorderOrWatchlistUrl: text(movie.preorderOrWatchlistUrl),
    galleryImages: Array.isArray(movie.galleryImages)
      ? movie.galleryImages
      : list(movie.images).map((url) => ({
          url,
          alt: `${movie.title} gallery image`,
          caption: '',
          credit: '',
          sourceUrl: '',
        })),
    images: Array.isArray(movie.galleryImages)
      ? movie.galleryImages.map((item: AnyRecord) => item.url).filter(Boolean)
      : list(movie.images),
    focusKeyword: text(movie.focusKeyword || movie.seoData?.focusKeyword),
    secondaryKeywords,
    contentTags,
    metaTitle: text(movie.metaTitle || movie.seoData?.metaTitle),
    metaDescription: text(movie.metaDescription || movie.seoData?.metaDescription),
    canonicalUrl: text(movie.canonicalUrl || movie.seoData?.canonicalUrl),
    robotsIndex: movie.robotsIndex ?? movie.seoData?.robotsIndex ?? true,
    robotsFollow: movie.robotsFollow ?? movie.seoData?.robotsFollow ?? true,
    ogTitle: text(movie.ogTitle || movie.seoData?.ogTitle),
    ogDescription: text(movie.ogDescription || movie.seoData?.ogDescription),
    ogImage: text(movie.ogImage || movie.seoData?.ogImage),
    twitterTitle: text(movie.twitterTitle || movie.seoData?.twitterTitle),
    twitterDescription: text(movie.twitterDescription || movie.seoData?.twitterDescription),
    twitterImage: text(movie.twitterImage || movie.seoData?.twitterImage),
    publishStatus:
      text(movie.publishStatus) || (movie.status === 'published' ? 'published' : 'draft'),
  };
}

export function validateMoviePayload(input: AnyRecord, mode: 'draft' | 'publish' = 'publish') {
  const errors: Record<string, string> = {};
  const requiredForPublish = [
    'title',
    'slug',
    'excerpt',
    'movieType',
    'synopsis',
    'posterImage',
    'posterImageAlt',
    'sourceType',
    'sourceName',
    'sourceUrl',
    'focusKeyword',
    'metaTitle',
    'metaDescription',
    'publishStatus',
  ];

  if (!text(input.title)) errors.title = 'Title is required';
  if (mode === 'publish') {
    for (const field of requiredForPublish) {
      if (!text(input[field])) errors[field] = `${field} is required`;
    }
    if (!list(input.languages).length) errors.languages = 'At least one language is required';
    if (!list(input.genres).length) errors.genres = 'At least one genre is required';
  }

  const urlFields = [
    'sourceUrl',
    'officialWebsite',
    'imdbUrl',
    'wikipediaUrl',
    'platformUrl',
    'trailerUrl',
    'youtubeTrailerUrl',
    'canonicalUrl',
    'preorderOrWatchlistUrl',
    'ticketBookingUrl',
  ];
  for (const field of urlFields) {
    if (!isValidUrl(text(input[field]))) errors[field] = 'Enter a valid http(s) URL';
  }

  if (text(input.publishStatus) === 'published' && !input.publishedAt) {
    errors.publishedAt = 'Published movies need a published date';
  }
  if (text(input.publishStatus) === 'scheduled' && !input.scheduledAt) {
    errors.scheduledAt = 'Scheduled movies need a scheduled date';
  }
  if (
    text(input.publishStatus) === 'published' &&
    !input.isSourceVerified &&
    !text(input.sourceCreditText)
  ) {
    errors.sourceCreditText = 'Published movies need a verified source or source credit';
  }

  return errors;
}

export function toMovieWritePayload(input: AnyRecord): AnyRecord {
  const title = text(input.title);
  const slug = slugifyMovie(text(input.slug) || title);
  const genres = list(input.genres ?? input.genre);
  const languages = list(input.languages ?? input.language);
  const leadCast = Array.isArray(input.leadCast)
    ? input.leadCast.map(normalizePerson).filter((p) => p.name)
    : [];
  const director = Array.isArray(input.director)
    ? input.director.map(normalizeCrewPerson).filter((p) => p.name)
    : [];
  const runtime = runtimeMinutes(input);
  const publishStatus = PUBLISH_STATUSES.includes(input.publishStatus)
    ? input.publishStatus
    : 'draft';
  const status = MOVIE_STATUSES.includes(input.status) ? input.status : 'announced';
  const posterImage = text(input.posterImage || input.poster);
  const backdropImage = text(input.backdropImage || input.backdrop);
  const trailerUrl = text(input.trailerUrl || input.trailer);

  return {
    ...input,
    title,
    slug,
    status,
    publishStatus,
    languages,
    language: languages,
    genres,
    genre: genres,
    posterImage,
    poster: posterImage,
    backdropImage,
    backdrop: backdropImage,
    trailerUrl,
    trailer: trailerUrl,
    runtimeValue: input.runtimeValue === '' ? undefined : Number(input.runtimeValue) || undefined,
    runtimeUnit: RUNTIME_UNITS.includes(input.runtimeUnit) ? input.runtimeUnit : 'minutes',
    duration: runtime,
    certification: text(input.certification || input.mpaaRating),
    mpaaRating: text(input.certification || input.mpaaRating),
    isFeatured: Boolean(input.isFeatured ?? input.featured),
    featured: Boolean(input.isFeatured ?? input.featured),
    worldwideRelease: Boolean(input.worldwideRelease ?? input.worldwide),
    worldwide: Boolean(input.worldwideRelease ?? input.worldwide),
    leadCast,
    cast: leadCast,
    supportingCast: Array.isArray(input.supportingCast)
      ? input.supportingCast.map(normalizePerson).filter((p) => p.name)
      : [],
    cameoCast: Array.isArray(input.cameoCast)
      ? input.cameoCast.map(normalizePerson).filter((p) => p.name)
      : [],
    director,
    producers: Array.isArray(input.producers)
      ? input.producers.map(normalizeCrewPerson).filter((p) => p.name)
      : [],
    writers: Array.isArray(input.writers)
      ? input.writers.map(normalizeCrewPerson).filter((p) => p.name)
      : [],
    seoData: {
      metaTitle: text(input.metaTitle),
      metaDescription: text(input.metaDescription),
      keywords: list(input.secondaryKeywords),
      canonicalUrl: text(input.canonicalUrl),
      ogTitle: text(input.ogTitle),
      ogDescription: text(input.ogDescription),
      ogImage: text(input.ogImage),
      twitterTitle: text(input.twitterTitle),
      twitterDescription: text(input.twitterDescription),
      twitterImage: text(input.twitterImage),
      focusKeyword: text(input.focusKeyword),
      relatedTopics: list(input.contentTags),
      robotsIndex: input.robotsIndex !== false,
      robotsFollow: input.robotsFollow !== false,
      robots: `${input.robotsIndex !== false ? 'index' : 'noindex'}, ${input.robotsFollow !== false ? 'follow' : 'nofollow'}`,
      altText: text(input.posterImageAlt),
      articleSection: text(input.schemaArticleSection) || 'Upcoming Movies',
    },
  };
}
