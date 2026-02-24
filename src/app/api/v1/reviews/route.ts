/**
 * GET /api/v1/reviews
 * ────────────────────
 * Public API — requires x-api-key header.
 * Query params:
 *   page, limit, search (movie title), minRating, maxRating, featured, sort
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';

export async function GET(request: NextRequest) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page      = Math.max(1, parseInt(searchParams.get('page')    || '1'));
      const limit     = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search    = searchParams.get('search')    || '';
      const minRating = parseFloat(searchParams.get('minRating') || '0');
      const maxRating = parseFloat(searchParams.get('maxRating') || '10');
      const featured  = searchParams.get('featured')  || '';
      const sort      = searchParams.get('sort') || 'latest';
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {
        rating: { $gte: minRating, $lte: maxRating },
      };
      if (search)          query.movieTitle = { $regex: search, $options: 'i' };
      if (featured === 'true') query.featured = true;

      const sortMap: Record<string, any> = {
        latest:      { publishDate: -1, createdAt: -1 },
        oldest:      { publishDate: 1 },
        rating_high: { rating: -1 },
        rating_low:  { rating: 1 },
      };
      const sortObj = sortMap[sort] || sortMap.latest;

      const [reviews, total] = await Promise.all([
        MovieReview.find(query)
          .select('title slug movieTitle poster rating excerpt author publishDate featured scores pros cons verdict stats createdAt')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        MovieReview.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'reviews',
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        data: reviews,
      });
    } catch (error) {
      console.error('v1/reviews error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
