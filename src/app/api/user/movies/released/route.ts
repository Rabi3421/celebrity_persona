/**
 * GET /api/user/movies/released
 * Returns movies that have been released (releaseDate <= today OR status is "Released"/"Now Showing"/"Now Playing")
 * Query params: page, limit, search, genre, sort (latest | release | score)
 * Requires: x-api-key
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { releasedMovieQuery, serializeMovie } from '@/lib/upcomingMovies';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')?.trim() || '';
    const genre = searchParams.get('genre')?.trim() || '';
    const celebrity = searchParams.get('celebrity')?.trim() || '';
    const sort = searchParams.get('sort') || 'latest';

    const query: Record<string, any> = releasedMovieQuery();

    if (search) {
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { originalTitle: { $regex: search, $options: 'i' } },
          { 'director.name': { $regex: search, $options: 'i' } },
          { director: { $regex: search, $options: 'i' } },
          { 'leadCast.name': { $regex: search, $options: 'i' } },
          { 'supportingCast.name': { $regex: search, $options: 'i' } },
          { 'cast.name': { $regex: search, $options: 'i' } },
          { synopsis: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (genre && genre !== 'all') {
      query.$and.push({
        $or: [
          { genres: { $regex: genre, $options: 'i' } },
          { genre: { $regex: genre, $options: 'i' } },
        ],
      });
    }

    if (celebrity) {
      query.$and.push({
        $or: [
          { 'leadCast.slug': celebrity },
          { 'leadCast.name': { $regex: celebrity, $options: 'i' } },
          { 'supportingCast.slug': celebrity },
          { 'supportingCast.name': { $regex: celebrity, $options: 'i' } },
          { 'cast.name': { $regex: celebrity, $options: 'i' } },
        ],
      });
    }

    const sortMap: Record<string, any> = {
      latest: { createdAt: -1 },
      release: { releaseDate: -1 },
      score: { anticipationScore: -1, createdAt: -1 },
      title: { title: 1 },
    };
    const sortObj = sortMap[sort] || sortMap.latest;

    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
      Movie.find(query).select('-__v').sort(sortObj).skip(skip).limit(limit).lean(),
      Movie.countDocuments(query),
    ]);

    const data = movies.map((m: any) => {
      const movie = serializeMovie(m);
      return {
        ...movie,
        likeCount: Array.isArray(m.likes) ? m.likes.length : 0,
        saveCount: Array.isArray(m.saves) ? m.saves.length : 0,
        commentCount: Array.isArray(m.comments) ? m.comments.length : 0,
      };
    });

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
