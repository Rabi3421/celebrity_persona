import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

// ── API Key guard ─────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key');
  return key === process.env.X_API_KEY;
}

// ── GET /api/user/movies/upcoming ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing x-api-key' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const q     = searchParams.get('q')?.trim();
    const genre = searchParams.get('genre')?.trim();
    const sort  = searchParams.get('sort') || 'anticipation'; // anticipation | release | rating

    // Only surface publicly-visible statuses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { title:    { $regex: q, $options: 'i' } },
        { director: { $regex: q, $options: 'i' } },
        { 'cast.name': { $regex: q, $options: 'i' } },
        { synopsis: { $regex: q, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'all') {
      filter.genre = { $regex: genre, $options: 'i' };
    }

    // Sort strategy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { anticipationScore: -1, createdAt: -1 };
    if (sort === 'release') sortOption = { releaseDate: 1, createdAt: -1 };
    if (sort === 'rating')  sortOption = { anticipationScore: -1, createdAt: -1 };

    const skip  = (page - 1) * limit;
    const total = await Movie.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await Movie.find(filter)
      .select('-__v')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    console.error('[GET /api/user/movies/upcoming]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch upcoming movies' },
      { status: 500 }
    );
  }
}
