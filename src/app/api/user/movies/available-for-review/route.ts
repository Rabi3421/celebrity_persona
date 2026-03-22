/**
 * GET /api/user/movies/available-for-review
 * Returns movies whose release date has passed (released movies) but
 * do NOT yet have a published review in the MovieReview collection.
 * Query params: page, limit, search, genre, sort (release | title | latest)
 * Requires: x-api-key
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key');
  return key === process.env.X_API_KEY || key === process.env.NEXT_PUBLIC_X_API_KEY;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')?.trim() || '';
    const genre  = searchParams.get('genre')?.trim()  || '';
    const sort   = searchParams.get('sort') || 'release';

    // Fetch all movies that have been released (past release date OR released status)
    const releasedQuery: Record<string, any> = {
      $or: [
        { releaseDate: { $lte: new Date() } },
        { status: { $in: ['Released', 'Now Showing', 'Now Playing', 'In Theatres', 'In Theaters'] } },
      ],
    };

    if (search) {
      releasedQuery.$and = [
        { $or: releasedQuery.$or },
        {
          $or: [
            { title:    { $regex: search, $options: 'i' } },
            { director: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete releasedQuery.$or;
    }

    if (genre && genre !== 'all') {
      releasedQuery.genre = { $regex: genre, $options: 'i' };
    }

    // Get all released movie titles (to cross-reference with reviews)
    const releasedMovies = await Movie.find(releasedQuery)
      .select('title slug releaseDate poster backdrop genre director status anticipationScore duration mpaaRating language featured studio createdAt')
      .lean();

    if (releasedMovies.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        limit,
        pages: 0,
      });
    }

    // Get all movie titles that already have at least one published review
    const reviewedTitles = await MovieReview.distinct('movieTitle', {
      status: 'published',
    });

    // Normalize for comparison (lowercase, trimmed)
    const reviewedSet = new Set(reviewedTitles.map((t: string) => t.trim().toLowerCase()));

    // Filter out movies that already have a review
    let unreviewedMovies = releasedMovies.filter(
      (m) => !reviewedSet.has((m.title as string).trim().toLowerCase())
    );

    // Sort
    if (sort === 'release') {
      unreviewedMovies.sort((a, b) => {
        const da = a.releaseDate ? new Date(a.releaseDate as Date).getTime() : 0;
        const db = b.releaseDate ? new Date(b.releaseDate as Date).getTime() : 0;
        return db - da; // most recently released first
      });
    } else if (sort === 'title') {
      unreviewedMovies.sort((a, b) => (a.title as string).localeCompare(b.title as string));
    } else {
      // latest (by createdAt)
      unreviewedMovies.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt as Date).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt as Date).getTime() : 0;
        return db - da;
      });
    }

    const total = unreviewedMovies.length;
    const pages = Math.ceil(total / limit);
    const skip  = (page - 1) * limit;
    const paginated = unreviewedMovies.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    console.error('available-for-review error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
