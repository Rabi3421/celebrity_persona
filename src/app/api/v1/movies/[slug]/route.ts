/**
 * GET /api/v1/movies/[slug]
 * ──────────────────────────
 * Public API — requires x-api-key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { slug } = await params;

      const movie = await Movie.findOne({ slug: slug.toLowerCase().trim() })
        .select('-seoData -__v')
        .lean();

      if (!movie) {
        return NextResponse.json(
          { success: false, message: 'Movie not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'movies',
        data: movie,
      });
    } catch (error) {
      console.error('v1/movies/[slug] error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
