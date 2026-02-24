/**
 * GET /api/v1/celebrities/[slug]
 * ───────────────────────────────
 * Public API — requires x-api-key header.
 * Returns full celebrity profile by slug.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();

      const { slug } = await params;

      const celebrity = await Celebrity.findOne({ slug: slug.toLowerCase().trim() })
        .select('-seo -__v')
        .lean();

      if (!celebrity) {
        return NextResponse.json(
          { success: false, message: 'Celebrity not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'celebrities',
        data: celebrity,
      });
    } catch (error) {
      console.error('v1/celebrities/[slug] error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
