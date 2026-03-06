/**
 * GET /api/v1/reviews/[slug]
 * ───────────────────────────
 * Public API — requires x-api-key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { slug } = await params;

      const review = await MovieReview.findOne({ slug: slug.toLowerCase().trim() })
        .select('-seoData -__v')
        .lean();

      if (!review) {
        return NextResponse.json(
          { success: false, message: 'Review not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'reviews',
        data: review,
      });
    } catch (error) {
      console.error('v1/reviews/[slug] error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
