import 'server-only';

import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import UserOutfit from '@/models/UserOutfit';

export type SeoInternalLinkItem = {
  title: string;
  href: string;
  description?: string;
  image?: string;
  eyebrow?: string;
};

export type SeoInternalLinkGroup = {
  title: string;
  description?: string;
  items: SeoInternalLinkItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
};

export type SeoContextualLink = {
  label: string;
  href: string;
};

export type SeoInternalLinks = {
  contextualLinks: SeoContextualLink[];
  groups: SeoInternalLinkGroup[];
};

type PlainDoc = Record<string, any>;

const RELEASED_STATUSES = ['released', 'now showing', 'now playing', 'in theatres', 'in theaters'];
const STOP_TERMS = new Set([
  'actor',
  'actress',
  'artist',
  'celebrity',
  'fashion',
  'film',
  'films',
  'movie',
  'movies',
  'news',
  'review',
  'reviews',
  'style',
  'upcoming',
]);

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function publicCelebrityFilter() {
  return { $or: [{ status: { $exists: false } }, { status: 'published' }] };
}

function publicOutfitFilter() {
  return {
    $and: [
      { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
    ],
  };
}

function indexableSeoFilter(field: 'seo' | 'seoData') {
  return {
    $and: [
      { $or: [{ [`${field}.noindex`]: { $exists: false } }, { [`${field}.noindex`]: { $ne: true } }] },
      { $or: [{ [`${field}.robotsIndex`]: { $exists: false } }, { [`${field}.robotsIndex`]: { $ne: false } }] },
      { [`${field}.robots`]: { $not: /noindex/i } },
    ],
  };
}

function asArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(asArray);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textRegex(value: string): RegExp {
  return new RegExp(escapeRegex(value), 'i');
}

function isObjectId(value?: string): boolean {
  return !!value && /^[a-f\d]{24}$/i.test(value);
}

function cleanTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectTerms(...values: unknown[]): string[] {
  const terms = values
    .flatMap(asArray)
    .map(cleanTerm)
    .filter((term) => term.length > 2 && !STOP_TERMS.has(term));

  return Array.from(new Set(terms)).slice(0, 12);
}

function regexTerms(terms: string[], limit = 8): RegExp[] {
  return terms.slice(0, limit).map(textRegex);
}

function relationOr(conditions: PlainDoc[], fallback: PlainDoc = { slug: { $type: 'string', $ne: '' } }): PlainDoc {
  return { $or: conditions.length > 0 ? conditions : [fallback] };
}

function celebrityIdentityOr(celebId?: unknown, celebName?: string): PlainDoc {
  const conditions: PlainDoc[] = [
    ...(isObjectId(String(celebId || '')) ? [{ _id: celebId }] : []),
    ...(celebName ? [{ name: textRegex(celebName) }] : []),
  ];

  return relationOr(conditions, { _id: { $exists: false } });
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function docId(doc: PlainDoc): string {
  return String(doc.id || doc._id || '');
}

function movieIsReleased(movie: PlainDoc): boolean {
  const releaseDate = movie.releaseDate ? new Date(movie.releaseDate) : null;
  const status = String(movie.status || '').toLowerCase();
  return (releaseDate instanceof Date && !Number.isNaN(releaseDate.getTime()) && releaseDate <= new Date()) ||
    RELEASED_STATUSES.some((item) => status.includes(item));
}

function movieHref(movie: PlainDoc): string {
  const base = movieIsReleased(movie) ? '/movie-details' : '/upcoming-movies';
  return `${base}/${movie.slug}`;
}

function yearLabel(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : String(date.getFullYear());
}

function compactGroups(groups: SeoInternalLinkGroup[]): SeoInternalLinkGroup[] {
  return groups.filter((group) => group.items.length > 0);
}

function item(title: string, href: string, options: Partial<SeoInternalLinkItem> = {}): SeoInternalLinkItem {
  return { title, href, ...options };
}

function celebrityItem(doc: PlainDoc): SeoInternalLinkItem {
  return item(doc.name, `/celebrity-profiles/${doc.slug}`, {
    image: doc.profileImage || doc.coverImage,
    eyebrow: asArray(doc.occupation).slice(0, 2).join(' & ') || 'Celebrity profile',
    description: firstText(doc.introduction, asArray(doc.categories).join(', ')),
  });
}

function outfitItem(doc: PlainDoc): SeoInternalLinkItem {
  const celebName = typeof doc.celebrity === 'object' ? doc.celebrity?.name : undefined;
  return item(doc.title, `/celebrity-outfits/${doc.slug}`, {
    image: doc.images?.[0],
    eyebrow: firstText(celebName, doc.category, doc.brand, 'Celebrity outfit'),
    description: firstText(doc.description, doc.event, doc.designer),
  });
}

function userOutfitItem(doc: PlainDoc): SeoInternalLinkItem {
  return item(doc.title, `/user-outfits/${doc.slug}`, {
    image: doc.images?.[0],
    eyebrow: firstText(doc.category, doc.brand, 'Community outfit'),
    description: firstText(doc.description, doc.store),
  });
}

function newsItem(doc: PlainDoc): SeoInternalLinkItem {
  return item(doc.title, `/celebrity-news/${doc.slug}`, {
    image: doc.thumbnail || doc.images?.[0],
    eyebrow: firstText(doc.category, 'Celebrity news'),
    description: firstText(doc.excerpt),
  });
}

function movieItem(doc: PlainDoc): SeoInternalLinkItem {
  return item(doc.title, movieHref(doc), {
    image: doc.poster || doc.backdrop,
    eyebrow: firstText(yearLabel(doc.releaseDate), asArray(doc.genre).slice(0, 2).join(' / '), 'Movie'),
    description: firstText(doc.synopsis, doc.plotSummary, doc.director ? `Directed by ${doc.director}` : ''),
  });
}

function reviewItem(doc: PlainDoc): SeoInternalLinkItem {
  return item(doc.title, `/reviews/${doc.slug}`, {
    image: doc.poster || doc.backdropImage,
    eyebrow: firstText(doc.movieTitle, doc.rating ? `${doc.rating}/10 review` : 'Movie review'),
    description: firstText(doc.excerpt, doc.verdict),
  });
}

async function findCastCelebrityLinks(cast: PlainDoc[] = [], limit = 8): Promise<SeoInternalLinkItem[]> {
  const castNames = cast.map((member) => String(member.name || '').trim()).filter(Boolean);
  const castIds = cast.map((member) => String(member.celebrityId || '')).filter(isObjectId);

  if (castNames.length === 0 && castIds.length === 0) return [];

  const or: PlainDoc[] = [];
  if (castIds.length > 0) or.push({ _id: { $in: castIds } });
  if (castNames.length > 0) or.push({ name: { $in: castNames.map(textRegex) } });

  const docs = await Celebrity.find({
    $and: [publicCelebrityFilter(), { slug: { $type: 'string', $ne: '' } }, { $or: or }],
  })
    .select('name slug profileImage coverImage occupation introduction popularityScore viewCount')
    .sort({ popularityScore: -1, viewCount: -1 })
    .limit(limit)
    .lean();

  return plain(docs).map(celebrityItem);
}

export async function getCelebrityInternalLinks(celebrity: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const id = docId(celebrity);
    const name = String(celebrity.name || '');
    const terms = collectTerms(
      celebrity.tags,
      celebrity.categories,
      celebrity.occupation,
      celebrity.seo?.tags,
      celebrity.seo?.relatedTopics
    );
    const tokenRegexes = regexTerms(terms);
    const relatedNames = asArray(celebrity.relatedCelebrities).map(textRegex);
    const movieNames = asArray((celebrity.movies || []).map((movie: PlainDoc) => movie.name)).map(textRegex);

    const [celebrities, outfits, news, movies] = await Promise.all([
      Celebrity.find({
        $and: [
          publicCelebrityFilter(),
          { slug: { $type: 'string', $ne: '' } },
          { slug: { $ne: celebrity.slug } },
          relationOr([
            ...(relatedNames.length ? [{ name: { $in: relatedNames } }] : []),
            ...(tokenRegexes.length ? [
              { tags: { $in: tokenRegexes } },
              { categories: { $in: tokenRegexes } },
              { occupation: { $in: tokenRegexes } },
            ] : []),
          ], { popularityScore: { $gte: 0 } }),
        ],
      })
        .select('name slug profileImage coverImage occupation introduction categories popularityScore viewCount')
        .sort({ isFeatured: -1, popularityScore: -1, viewCount: -1 })
        .limit(6)
        .lean(),
      CelebrityOutfit.find({
        $and: [
          publicOutfitFilter(),
          indexableSeoFilter('seo'),
          {
            $or: [
              ...(id ? [{ celebrity: id }] : []),
              { title: textRegex(name) },
              ...(tokenRegexes.length ? [
                { tags: { $in: tokenRegexes } },
                { category: { $in: tokenRegexes } },
                { brand: { $in: tokenRegexes } },
              ] : []),
            ],
          },
        ],
      })
        .select('title slug images event designer brand category description celebrity updatedAt')
        .populate('celebrity', 'name slug')
        .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityNews.find({
        $and: [
          { status: 'published' },
          indexableSeoFilter('seo'),
          {
            $or: [
              ...(id ? [{ celebrity: id }] : []),
              { title: textRegex(name) },
              { excerpt: textRegex(name) },
              ...(tokenRegexes.length ? [
                { tags: { $in: tokenRegexes } },
                { category: { $in: tokenRegexes } },
              ] : []),
            ],
          },
        ],
      })
        .select('title slug thumbnail category publishDate excerpt celebrity')
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Movie.find({
        $and: [
          { slug: { $type: 'string', $ne: '' } },
          indexableSeoFilter('seoData'),
          {
            $or: [
              { 'cast.name': textRegex(name) },
              { director: textRegex(name) },
              { writers: textRegex(name) },
              { producers: textRegex(name) },
              ...(movieNames.length ? [{ title: { $in: movieNames } }] : []),
              ...(tokenRegexes.length ? [{ genre: { $in: tokenRegexes } }] : []),
            ],
          },
        ],
      })
        .select('title slug releaseDate poster backdrop genre director status synopsis plotSummary')
        .sort({ releaseDate: -1, updatedAt: -1 })
        .limit(8)
        .lean(),
    ]);

    return {
      contextualLinks: [
        { label: `${name} biography and career timeline`, href: `/celebrity-profiles/${celebrity.slug}` },
        { label: `${name} outfits and style inspiration`, href: `/fashion-gallery?celebrity=${encodeURIComponent(name)}` },
        { label: `${name} latest celebrity news`, href: `/celebrity-news?celebrity=${encodeURIComponent(name)}` },
        { label: `${name} movies and screen appearances`, href: `/movie-details?celebrity=${encodeURIComponent(name)}` },
      ],
      groups: compactGroups([
        {
          title: `Related Celebrities To ${name}`,
          description: 'Profiles connected by profession, category, tags, or editorial relationship.',
          items: plain(celebrities).filter((doc: PlainDoc) => doc.slug !== celebrity.slug).map(celebrityItem),
          viewAllHref: '/celebrity-profiles',
          viewAllLabel: 'Browse all celebrity profiles',
        },
        {
          title: `${name} Movies`,
          description: 'Movie pages connected through cast, crew, titles, and topical movie signals.',
          items: plain(movies).map(movieItem),
          viewAllHref: `/movie-details?celebrity=${encodeURIComponent(name)}`,
          viewAllLabel: `View ${name} movie links`,
        },
        {
          title: `${name} Outfit Articles`,
          description: 'Fashion pages related by celebrity, category, tags, brand, and event context.',
          items: plain(outfits).map(outfitItem),
          viewAllHref: `/fashion-gallery?celebrity=${encodeURIComponent(name)}`,
          viewAllLabel: `View ${name} outfit articles`,
        },
        {
          title: `${name} News Articles`,
          description: 'Fresh entertainment coverage connected to this celebrity profile.',
          items: plain(news).map(newsItem),
          viewAllHref: `/celebrity-news?celebrity=${encodeURIComponent(name)}`,
          viewAllLabel: `Read more ${name} news`,
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}

export async function getMovieInternalLinks(movie: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const title = String(movie.title || '');
    const terms = collectTerms(movie.genre, movie.language, movie.director, movie.studio, movie.seoData?.keywords, movie.seoData?.relatedTopics);
    const tokenRegexes = regexTerms(terms);
    const cast = Array.isArray(movie.cast) ? movie.cast : [];
    const castNames = cast.map((member: PlainDoc) => String(member.name || '').trim()).filter(Boolean);
    const castRegexes = castNames.slice(0, 8).map(textRegex);

    const [castCelebrities, reviews, news, relatedMovies] = await Promise.all([
      findCastCelebrityLinks(cast, 8),
      MovieReview.find({
        $and: [
          { status: 'published' },
          indexableSeoFilter('seoData'),
          {
            $or: [
              { movieTitle: textRegex(title) },
              { title: textRegex(title) },
              ...(tokenRegexes.length ? [{ 'movieDetails.genre': { $in: tokenRegexes } }] : []),
            ],
          },
        ],
      })
        .select('title slug movieTitle poster backdropImage rating excerpt verdict publishDate movieDetails.genre')
        .sort({ publishDate: -1, rating: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityNews.find({
        $and: [
          { status: 'published' },
          indexableSeoFilter('seo'),
          {
            $or: [
              { title: textRegex(title) },
              { excerpt: textRegex(title) },
              ...(castRegexes.length ? [{ title: { $in: castRegexes } }] : []),
              ...(tokenRegexes.length ? [
                { tags: { $in: tokenRegexes } },
                { category: { $in: tokenRegexes } },
              ] : []),
            ],
          },
        ],
      })
        .select('title slug thumbnail category publishDate excerpt')
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Movie.find({
        $and: [
          { slug: { $type: 'string', $ne: '' } },
          { slug: { $ne: movie.slug } },
          indexableSeoFilter('seoData'),
          relationOr([
            ...(tokenRegexes.length ? [{ genre: { $in: tokenRegexes } }] : []),
            ...(movie.director ? [{ director: textRegex(movie.director) }] : []),
          ]),
        ],
      })
        .select('title slug releaseDate poster backdrop genre director status synopsis plotSummary')
        .sort({ releaseDate: -1, anticipationScore: -1, updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    return {
      contextualLinks: [
        { label: `${title} cast profiles`, href: `${movieHref(movie)}#cast` },
        { label: `${title} reviews and ratings`, href: `/reviews?movie=${encodeURIComponent(title)}` },
        { label: `${title} news updates`, href: `/celebrity-news?movie=${encodeURIComponent(title)}` },
        ...(terms[0] ? [{ label: `${terms[0]} movies`, href: `/movie-details?genre=${encodeURIComponent(terms[0])}` }] : []),
      ],
      groups: compactGroups([
        {
          title: `${title} Cast Celebrity Links`,
          description: 'Actor and celebrity profile links connected to this movie cast.',
          items: castCelebrities,
          viewAllHref: '/celebrity-profiles',
          viewAllLabel: 'Browse celebrity profiles',
        },
        {
          title: `${title} Related Reviews`,
          description: 'Movie reviews connected by title, genre, and editorial topic.',
          items: plain(reviews).map(reviewItem),
          viewAllHref: `/reviews?movie=${encodeURIComponent(title)}`,
          viewAllLabel: `View ${title} reviews`,
        },
        {
          title: `${title} Related News`,
          description: 'Entertainment news connected to this movie, cast, and genre.',
          items: plain(news).map(newsItem),
          viewAllHref: `/celebrity-news?movie=${encodeURIComponent(title)}`,
          viewAllLabel: `Read ${title} news`,
        },
        {
          title: `More Movies Like ${title}`,
          description: 'Related movie pages connected by genre and creative team.',
          items: plain(relatedMovies).map(movieItem),
          viewAllHref: movieIsReleased(movie) ? '/movie-details' : '/upcoming-movies',
          viewAllLabel: 'Explore more movies',
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}

export async function getReviewInternalLinks(review: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const title = String(review.movieTitle || review.title || '');
    const terms = collectTerms(review.movieDetails?.genre, review.seo?.metaKeywords, review.seoData?.metaKeywords);
    const tokenRegexes = regexTerms(terms);
    const cast = review.movieDetails?.cast || [];

    const [movie, castCelebrities, relatedReviews, news] = await Promise.all([
      Movie.findOne({
        $and: [
          { slug: { $type: 'string', $ne: '' } },
          indexableSeoFilter('seoData'),
          { title: textRegex(title) },
        ],
      })
        .select('title slug releaseDate poster backdrop genre director status synopsis plotSummary')
        .lean(),
      findCastCelebrityLinks(cast, 6),
      MovieReview.find({
        $and: [
          { status: 'published', slug: { $ne: review.slug } },
          {
            $or: [
              { movieTitle: textRegex(title) },
              ...(tokenRegexes.length ? [{ 'movieDetails.genre': { $in: tokenRegexes } }] : []),
            ],
          },
        ],
      })
        .select('title slug movieTitle poster backdropImage rating excerpt verdict publishDate movieDetails.genre')
        .sort({ publishDate: -1, rating: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityNews.find({
        $and: [
          { status: 'published' },
          indexableSeoFilter('seo'),
          {
            $or: [
              { title: textRegex(title) },
              { excerpt: textRegex(title) },
              ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }] : []),
            ],
          },
        ],
      })
        .select('title slug thumbnail category publishDate excerpt')
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    return {
      contextualLinks: [
        ...(movie ? [{ label: `${title} movie details`, href: movieHref(movie) }] : []),
        { label: `${title} cast profiles`, href: `/celebrity-profiles?movie=${encodeURIComponent(title)}` },
        { label: `${title} news coverage`, href: `/celebrity-news?movie=${encodeURIComponent(title)}` },
      ],
      groups: compactGroups([
        {
          title: `${title} Movie Page`,
          description: 'Primary movie detail page connected to this review.',
          items: movie ? [movieItem(plain(movie))] : [],
        },
        {
          title: `${title} Cast Profiles`,
          description: 'Celebrity profiles connected to this reviewed movie.',
          items: castCelebrities,
        },
        {
          title: `More Reviews Related To ${title}`,
          description: 'Review pages connected by movie title and genre.',
          items: plain(relatedReviews).map(reviewItem),
          viewAllHref: `/reviews?movie=${encodeURIComponent(title)}`,
          viewAllLabel: `Browse ${title} reviews`,
        },
        {
          title: `${title} News`,
          description: 'News pages connected to this movie review topic.',
          items: plain(news).map(newsItem),
          viewAllHref: `/celebrity-news?movie=${encodeURIComponent(title)}`,
          viewAllLabel: `Read ${title} news`,
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}

export async function getOutfitInternalLinks(outfit: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const celebrity = typeof outfit.celebrity === 'object' ? outfit.celebrity : null;
    const celebId = celebrity?._id || celebrity?.id || outfit.celebrity;
    const celebName = firstText(celebrity?.name);
    const terms = collectTerms(outfit.tags, outfit.category, outfit.brand, outfit.designer, outfit.seo?.tags, outfit.seo?.relatedTopics);
    const tokenRegexes = regexTerms(terms);

    const [celebrityDoc, relatedOutfits, news] = await Promise.all([
      celebName || celebId
        ? Celebrity.findOne({
            $and: [
              publicCelebrityFilter(),
              { slug: { $type: 'string', $ne: '' } },
              celebrityIdentityOr(celebId, celebName),
            ],
          })
            .select('name slug profileImage coverImage occupation introduction')
            .lean()
        : null,
      CelebrityOutfit.find({
        $and: [
          publicOutfitFilter(),
          indexableSeoFilter('seo'),
          { slug: { $ne: outfit.slug } },
          relationOr([
            ...(celebId ? [{ celebrity: celebId }] : []),
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }, { brand: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug images event designer brand category description celebrity')
        .populate('celebrity', 'name slug')
        .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityNews.find({
        $and: [
          { status: 'published' },
          indexableSeoFilter('seo'),
          relationOr([
            ...(celebId ? [{ celebrity: celebId }] : []),
            ...(celebName ? [{ title: textRegex(celebName) }] : []),
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug thumbnail category publishDate excerpt')
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const resolvedCelebrity = celebrityDoc ? plain(celebrityDoc) : null;
    const resolvedName = resolvedCelebrity?.name || celebName || 'Celebrity';

    return {
      contextualLinks: [
        ...(resolvedCelebrity ? [{ label: `${resolvedName} celebrity profile`, href: `/celebrity-profiles/${resolvedCelebrity.slug}` }] : []),
        { label: `${resolvedName} outfit ideas`, href: `/fashion-gallery?celebrity=${encodeURIComponent(resolvedName)}` },
        ...(outfit.category ? [{ label: `${outfit.category} celebrity outfits`, href: `/fashion-gallery?category=${encodeURIComponent(outfit.category)}` }] : []),
      ],
      groups: compactGroups([
        {
          title: resolvedCelebrity ? `${resolvedName} Profile` : 'Celebrity Profile',
          description: 'Primary celebrity page connected to this outfit article.',
          items: resolvedCelebrity ? [celebrityItem(resolvedCelebrity)] : [],
        },
        {
          title: `More ${resolvedName} Outfit Articles`,
          description: 'Fashion pages connected by celebrity, tags, brand, and category.',
          items: plain(relatedOutfits).map(outfitItem),
          viewAllHref: `/fashion-gallery?celebrity=${encodeURIComponent(resolvedName)}`,
          viewAllLabel: `View ${resolvedName} outfits`,
        },
        {
          title: `${resolvedName} Fashion And News`,
          description: 'News pages connected to this celebrity style topic.',
          items: plain(news).map(newsItem),
          viewAllHref: `/celebrity-news?celebrity=${encodeURIComponent(resolvedName)}`,
          viewAllLabel: `Read ${resolvedName} news`,
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}

export async function getNewsInternalLinks(article: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const celebrity = typeof article.celebrity === 'object' ? article.celebrity : null;
    const celebId = celebrity?._id || celebrity?.id || article.celebrity;
    const celebName = firstText(celebrity?.name);
    const terms = collectTerms(article.tags, article.category, article.seo?.tags, article.seo?.relatedTopics);
    const tokenRegexes = regexTerms(terms);

    const [celebrityDoc, relatedNews, outfits] = await Promise.all([
      celebName || celebId
        ? Celebrity.findOne({
            $and: [
              publicCelebrityFilter(),
              { slug: { $type: 'string', $ne: '' } },
              celebrityIdentityOr(celebId, celebName),
            ],
          })
            .select('name slug profileImage coverImage occupation introduction')
            .lean()
        : null,
      CelebrityNews.find({
        $and: [
          { status: 'published', slug: { $ne: article.slug } },
          indexableSeoFilter('seo'),
          relationOr([
            ...(celebId ? [{ celebrity: celebId }] : []),
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug thumbnail category publishDate excerpt')
        .sort({ publishDate: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityOutfit.find({
        $and: [
          publicOutfitFilter(),
          indexableSeoFilter('seo'),
          relationOr([
            ...(celebId ? [{ celebrity: celebId }] : []),
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug images event designer brand category description celebrity')
        .populate('celebrity', 'name slug')
        .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const resolvedCelebrity = celebrityDoc ? plain(celebrityDoc) : null;
    const resolvedName = resolvedCelebrity?.name || celebName;

    return {
      contextualLinks: [
        ...(resolvedCelebrity ? [{ label: `${resolvedName} profile`, href: `/celebrity-profiles/${resolvedCelebrity.slug}` }] : []),
        ...(resolvedName ? [{ label: `${resolvedName} latest news`, href: `/celebrity-news?celebrity=${encodeURIComponent(resolvedName)}` }] : []),
        ...(article.category ? [{ label: `${article.category} celebrity news`, href: `/celebrity-news?category=${encodeURIComponent(article.category)}` }] : []),
      ],
      groups: compactGroups([
        {
          title: resolvedName ? `${resolvedName} Celebrity Profile` : 'Related Celebrity Profile',
          description: 'Primary profile connected to this news topic.',
          items: resolvedCelebrity ? [celebrityItem(resolvedCelebrity)] : [],
        },
        {
          title: 'Related Celebrity News',
          description: 'News pages connected by celebrity, category, and tags.',
          items: plain(relatedNews).map(newsItem),
          viewAllHref: resolvedName ? `/celebrity-news?celebrity=${encodeURIComponent(resolvedName)}` : '/celebrity-news',
          viewAllLabel: 'Read more celebrity news',
        },
        {
          title: 'Related Outfit Articles',
          description: 'Fashion pages connected to the same celebrity or topical tags.',
          items: plain(outfits).map(outfitItem),
          viewAllHref: resolvedName ? `/fashion-gallery?celebrity=${encodeURIComponent(resolvedName)}` : '/fashion-gallery',
          viewAllLabel: 'Explore related outfits',
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}

export async function getUserOutfitInternalLinks(outfit: PlainDoc): Promise<SeoInternalLinks> {
  try {
    await dbConnect();

    const terms = collectTerms(outfit.tags, outfit.category, outfit.brand, outfit.store);
    const tokenRegexes = regexTerms(terms);

    const [communityOutfits, celebrityOutfits] = await Promise.all([
      UserOutfit.find({
        $and: [
          { isPublished: true, isApproved: true, slug: { $ne: outfit.slug } },
          relationOr([
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }, { brand: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug images description category brand store updatedAt')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      CelebrityOutfit.find({
        $and: [
          publicOutfitFilter(),
          indexableSeoFilter('seo'),
          relationOr([
            ...(tokenRegexes.length ? [{ tags: { $in: tokenRegexes } }, { category: { $in: tokenRegexes } }, { brand: { $in: tokenRegexes } }] : []),
          ]),
        ],
      })
        .select('title slug images event designer brand category description celebrity')
        .populate('celebrity', 'name slug')
        .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    return {
      contextualLinks: [
        { label: `${outfit.category || 'celebrity'} outfit ideas`, href: `/fashion-gallery?category=${encodeURIComponent(outfit.category || 'style')}` },
        ...(outfit.brand ? [{ label: `${outfit.brand} celebrity style`, href: `/fashion-gallery?brand=${encodeURIComponent(outfit.brand)}` }] : []),
      ],
      groups: compactGroups([
        {
          title: 'Related Community Outfits',
          description: 'Community outfit pages connected by category, tags, and brand.',
          items: plain(communityOutfits).map(userOutfitItem),
          viewAllHref: '/fashion-gallery',
          viewAllLabel: 'Explore community outfits',
        },
        {
          title: 'Related Celebrity Outfit Articles',
          description: 'Celebrity fashion pages connected by shared outfit topics.',
          items: plain(celebrityOutfits).map(outfitItem),
          viewAllHref: '/fashion-gallery',
          viewAllLabel: 'Browse celebrity outfits',
        },
      ]),
    };
  } catch {
    return { contextualLinks: [], groups: [] };
  }
}
