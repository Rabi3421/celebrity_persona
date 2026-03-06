/**
 * GET /api/user/movies/released
 * Returns movies that have been released (releaseDate <= today OR status is "Released"/"Now Showing"/"Now Playing")
 * Query params: page, limit, search, genre, sort (latest | release | score)
 * Requires: x-api-key
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

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
    const sort   = searchParams.get('sort') || 'latest';

    const query: Record<string, any> = {
      $or: [
        { releaseDate: { $lte: new Date() } },
        { status: { $in: ['Released', 'Now Showing', 'Now Playing', 'In Theatres'] } },
      ],
    };

    if (search) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { title:       { $regex: search, $options: 'i' } },
            { director:    { $regex: search, $options: 'i' } },
            { 'cast.name': { $regex: search, $options: 'i' } },
            { synopsis:    { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    if (genre && genre !== 'all') {
      query.genre = { $regex: genre, $options: 'i' };
    }

    const sortMap: Record<string, any> = {
      latest:  { createdAt: -1 },
      release: { releaseDate: -1 },
      score:   { anticipationScore: -1, createdAt: -1 },
      title:   { title: 1 },
    };
    const sortObj = sortMap[sort] || sortMap.latest;

    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
      Movie.find(query)
        .select('title slug releaseDate poster backdrop genre director status anticipationScore duration mpaaRating language featured studio trailer synopsis likes saves comments cast')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments(query),
    ]);

    const data = movies.map((m: any) => ({
      ...m,
      _id:         m._id.toString(),
      likeCount:   Array.isArray(m.likes)    ? m.likes.length    : 0,
      saveCount:   Array.isArray(m.saves)    ? m.saves.length    : 0,
      commentCount: Array.isArray(m.comments) ? m.comments.length : 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[GET /api/user/movies/released]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
