/**
 * GET /api/v1/movies
 * ───────────────────
 * Public API — requires x-api-key header.
 * Query params:
 *   page, limit, search, genre, status, featured, sort
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function GET(request: NextRequest) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
      const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search   = searchParams.get('search')   || '';
      const genre    = searchParams.get('genre')    || '';
      const status   = searchParams.get('status')   || '';
      const featured = searchParams.get('featured') || '';
      const sort     = searchParams.get('sort') || 'release_asc';
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {};
      if (search)           query.title = { $regex: search, $options: 'i' };
      if (genre)            query.genre = { $in: [genre] };
      if (status)           query.status = status;
      if (featured === 'true') query.featured = true;

      const sortMap: Record<string, any> = {
        release_asc:  { releaseDate: 1 },
        release_desc: { releaseDate: -1 },
        latest:       { createdAt: -1 },
        title_asc:    { title: 1 },
      };
      const sortObj = sortMap[sort] || sortMap.release_asc;

      const [movies, total] = await Promise.all([
        Movie.find(query)
          .select('title slug releaseDate poster backdrop genre director cast status anticipationScore duration mpaaRating language featured studio trailer createdAt')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Movie.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'movies',
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        data: movies,
      });
    } catch (error) {
      console.error('v1/movies error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
