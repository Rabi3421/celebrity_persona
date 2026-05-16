import 'server-only';

import dbConnect from '@/lib/mongodb';
import { normalizeStoredNetWorth } from '@/lib/netWorth';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import UserOutfit from '@/models/UserOutfit';
import User from '@/models/User';
import { stripHtml } from './site';
import { publicNewsFilter, serializeNews } from '@/lib/celebrityNews';
import { publicOutfitFilter, serializeOutfit } from '@/lib/celebrityOutfits';

const RELEASED_STATUSES = ['Released', 'Now Showing', 'Now Playing', 'In Theatres', 'In Theaters'];

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function deriveCategory(cats: string[] = []): string {
  const c = cats.map((x) => String(x).toLowerCase()).join(' ');
  if (/sport|athletic|tennis|football|basketball|cricket/.test(c)) return 'sports';
  if (/music|singer|rapper|dj|artist/.test(c)) return 'music';
  if (/fashion|model|designer|style/.test(c)) return 'fashion';
  return 'movie';
}

function publicCelebrityFilter() {
  return { $or: [{ status: { $exists: false } }, { status: 'published' }] };
}

export async function getCelebrityList({
  page = 1,
  limit = 12,
  q,
  category,
  sort = 'popular',
}: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  sort?: 'popular' | 'latest' | 'oldest' | 'name';
} = {}) {
  try {
    await dbConnect();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const filter: Record<string, any> = { $and: [publicCelebrityFilter()] };

    if (q?.trim()) {
      const term = q.trim();
      filter.$and.push({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { occupation: { $regex: term, $options: 'i' } },
          { tags: { $regex: term, $options: 'i' } },
          { nationality: { $regex: term, $options: 'i' } },
        ],
      });
    }

    if (category && category !== 'all') {
      filter.categories = { $regex: category, $options: 'i' };
    }

    let sortObj: Record<string, any> = { popularityScore: -1, viewCount: -1 };
    if (sort === 'latest') sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'name') sortObj = { name: 1 };

    const skip = (safePage - 1) * safeLimit;
    const [docs, total] = await Promise.all([
      Celebrity.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(safeLimit)
        .select(
          'name slug occupation categories tags profileImage coverImage popularityScore viewCount isFeatured isVerified movies socialMedia netWorth nationality yearsActive introduction createdAt updatedAt'
        )
        .lean(),
      Celebrity.countDocuments(filter),
    ]);

    const celebrities = docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      profession: Array.isArray(d.occupation) ? d.occupation.join(' & ') : d.occupation || '',
      category: deriveCategory(d.categories || []),
      profileImage: d.profileImage || '',
      coverImage: d.coverImage || '',
      isFeatured: d.isFeatured || false,
      isVerified: d.isVerified || false,
      popularityScore: d.popularityScore || 0,
      viewCount: d.viewCount || 0,
      netWorth: normalizeStoredNetWorth(d.netWorth) || '',
      nationality: d.nationality || '',
      yearsActive: d.yearsActive || '',
      movieCount: Array.isArray(d.movies) ? d.movies.length : 0,
      socialMedia: d.socialMedia || {},
      introduction: stripHtml(d.introduction || '').slice(0, 280),
      updatedAt: d.updatedAt || d.createdAt,
    }));

    return {
      celebrities: plain(celebrities),
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 },
    };
  } catch {
    return { celebrities: [], pagination: { page, limit, total: 0, pages: 1 } };
  }
}

export async function getOutfitList({ page = 1, limit = 12 } = {}) {
  try {
    await dbConnect();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const filter = publicOutfitFilter();

    const [docs, total] = await Promise.all([
      CelebrityOutfit.find(filter)
        .select('-__v -seo')
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('celebrity', 'name slug profileImage')
        .lean(),
      CelebrityOutfit.countDocuments(filter),
    ]);

    const data = docs.map((d: any) => serializeOutfit(d));

    return {
      data: plain(data),
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    };
  } catch {
    return { data: [], total: 0, page, limit, pages: 1 };
  }
}

export async function getCommunityOutfits({ limit = 8 } = {}) {
  try {
    await dbConnect();
    void User.modelName;
    const data = await UserOutfit.find({ isPublished: true, isApproved: true })
      .select('-clicks -__v')
      .sort({ createdAt: -1 })
      .limit(Math.min(50, Math.max(1, limit)))
      .populate('userId', 'name avatar')
      .lean();
    return plain(data.map((outfit: any) => ({
      ...outfit,
      _id: String(outfit._id),
      likes: (outfit.likes || []).map(String),
    })));
  } catch {
    return [];
  }
}

export function releasedMovieQuery(extra: Record<string, any> = {}) {
  return {
    ...extra,
    $or: [
      { releaseDate: { $lte: new Date() } },
      { status: { $in: RELEASED_STATUSES } },
    ],
  };
}

export function upcomingMovieQuery(extra: Record<string, any> = {}) {
  return {
    ...extra,
    $and: [
      {
        $or: [
          { releaseDate: { $gt: new Date() } },
          { releaseDate: null },
          { releaseDate: { $exists: false } },
        ],
      },
      { status: { $nin: RELEASED_STATUSES } },
    ],
  };
}

function normalizeMovie(m: any) {
  return {
    ...m,
    _id: String(m._id),
    likeCount: Array.isArray(m.likes) ? m.likes.length : 0,
    saveCount: Array.isArray(m.saves) ? m.saves.length : 0,
    commentCount: Array.isArray(m.comments) ? m.comments.length : 0,
  };
}

export async function getReleasedMovies({ page = 1, limit = 12 } = {}) {
  try {
    await dbConnect();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const query = releasedMovieQuery();
    const skip = (safePage - 1) * safeLimit;
    const [movies, total] = await Promise.all([
      Movie.find(query)
        .select('title slug releaseDate poster backdrop genre director status anticipationScore duration mpaaRating language featured studio trailer synopsis likes saves comments cast createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Movie.countDocuments(query),
    ]);

    return {
      data: plain(movies.map(normalizeMovie)),
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 },
    };
  } catch {
    return { data: [], pagination: { page, limit, total: 0, pages: 1 } };
  }
}

export async function getUpcomingMovies({ page = 1, limit = 12 } = {}) {
  try {
    await dbConnect();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const filter = upcomingMovieQuery();
    const skip = (safePage - 1) * safeLimit;
    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .select('-__v')
        .sort({ anticipationScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return {
      data: plain(movies.map((m: any) => ({ ...m, _id: String(m._id) }))),
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    };
  } catch {
    return { data: [], total: 0, page, limit, pages: 1 };
  }
}

export async function getReviews({
  page = 1,
  limit = 12,
  search = '',
  minRating,
  featured = false,
  sort = 'latest',
}: {
  page?: number;
  limit?: number;
  search?: string;
  minRating?: number | null;
  featured?: boolean;
  sort?: 'latest' | 'oldest' | 'rating_high' | 'rating_low' | 'title';
} = {}) {
  try {
    await dbConnect();
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(50, Math.max(1, Math.floor(limit))) : 12;
    const safeMinRating = typeof minRating === 'number' && Number.isFinite(minRating)
      ? Math.min(10, Math.max(0, minRating))
      : 0;
    const query: Record<string, any> = {
      status: 'published',
      rating: { $gte: safeMinRating, $lte: 10 },
    };
    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      query.$or = [
        { title: { $regex: trimmedSearch, $options: 'i' } },
        { movieTitle: { $regex: trimmedSearch, $options: 'i' } },
        { excerpt: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }
    if (featured) query.featured = true;

    const sortMap: Record<string, any> = {
      latest: { publishDate: -1, createdAt: -1 },
      oldest: { publishDate: 1, createdAt: 1 },
      rating_high: { rating: -1, publishDate: -1 },
      rating_low: { rating: 1, publishDate: -1 },
      title: { movieTitle: 1, title: 1 },
    };
    const skip = (safePage - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      MovieReview.find(query)
        .select('title slug movieTitle poster backdropImage rating excerpt author publishDate featured scores pros cons verdict stats createdAt')
        .sort(sortMap[sort] || sortMap.latest)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      MovieReview.countDocuments(query),
    ]);

    return {
      data: plain(reviews.map((r: any) => ({ ...r, _id: String(r._id) }))),
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 },
    };
  } catch {
    return { data: [], pagination: { page, limit, total: 0, pages: 1 } };
  }
}

export async function getAvailableForReviewMovies({ limit = 20 } = {}) {
  try {
    await dbConnect();
    const movies = await Movie.find(releasedMovieQuery())
      .select('title slug releaseDate poster backdrop genre director status anticipationScore duration mpaaRating language featured studio createdAt')
      .lean();

    const reviewedTitles = await MovieReview.distinct('movieTitle', { status: 'published' });
    const reviewedSet = new Set(reviewedTitles.map((title: string) => title.trim().toLowerCase()));
    return plain(
      movies
        .filter((m: any) => !reviewedSet.has(String(m.title).trim().toLowerCase()))
        .sort((a: any, b: any) => {
          const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return db - da;
        })
        .slice(0, Math.min(50, Math.max(1, limit)))
        .map((m: any) => ({ ...m, _id: String(m._id) }))
    );
  } catch {
    return [];
  }
}

export async function getNewsList({ page = 1, limit = 12 } = {}) {
  try {
    await dbConnect();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const filter = publicNewsFilter();
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      CelebrityNews.find(filter)
        .select('-__v -content -seo')
        .sort({ isFeatured: -1, featured: -1, publishedAt: -1, publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('celebrity primaryCelebrity', 'name slug profileImage')
        .lean(),
      CelebrityNews.countDocuments(filter),
    ]);

    return {
      data: plain(data.map(serializeNews)),
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1,
    };
  } catch {
    return { data: [], total: 0, page, limit, pages: 1 };
  }
}

export async function getNewsArticle(slugOrId: string) {
  try {
    await dbConnect();
    const slug = slugOrId.toLowerCase().trim();
    const idFilter = /^[a-f\d]{24}$/i.test(slugOrId) ? { _id: slugOrId } : null;
    const article = await CelebrityNews.findOne(publicNewsFilter({
      $or: [{ slug }, ...(idFilter ? [idFilter] : [])],
    }))
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();

    if (!article) return null;

    const related = await CelebrityNews.find({
      _id: { $ne: article._id },
      status: 'published',
      $or: [
        { category: (article as any).category || { $exists: true } },
        { primaryCelebritySlug: (article as any).primaryCelebritySlug || '__none__' },
        { 'relatedCelebrities.slug': (article as any).primaryCelebritySlug || '__none__' },
      ],
    })
      .select('-content -body -seo -comments -likes -saves')
      .sort({ publishedAt: -1, publishDate: -1, createdAt: -1 })
      .limit(3)
      .lean();

    const sidebar = await CelebrityNews.find({
      _id: { $ne: article._id },
      status: 'published',
    })
      .select('-content -body -seo -comments -likes -saves')
      .sort({ publishedAt: -1, publishDate: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const normalize = serializeNews;

    const likes: any[] = (article as any).likes || [];
    const saves: any[] = (article as any).saves || [];
    const comments: any[] = (article as any).comments || [];

    return plain({
      article: {
        ...normalize(article),
        likeCount: likes.length,
        saveCount: saves.length,
        commentCount: comments.length,
        liked: false,
        saved: false,
        comments: comments.slice().reverse().slice(0, 50).map((c: any) => ({
          id: String(c._id),
          userId: String(c.userId),
          userName: c.userName,
          userAvatar: c.userAvatar || '',
          text: c.text,
          createdAt: c.createdAt,
          isOwn: false,
        })),
      },
      related: related.map(normalize),
      sidebar: sidebar.map(normalize),
    });
  } catch {
    return null;
  }
}

export async function getPublicUserOutfit(slugOrId: string) {
  try {
    await dbConnect();
    void User.modelName;
    const outfit = await UserOutfit.findOne({
      isApproved: true,
      isPublished: true,
      $or: [
        { slug: slugOrId },
        { _id: /^[0-9a-fA-F]{24}$/.test(slugOrId) ? slugOrId : null },
      ],
    })
      .populate('userId', 'name avatar')
      .lean();

    return outfit ? plain(outfit) : null;
  } catch {
    return null;
  }
}
