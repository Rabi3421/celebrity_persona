/**
 * GET /api/v1/outfits/[slug]
 * ───────────────────────────
 * Public API — requires x-api-key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Celebrity from '@/models/Celebrity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();
      void Celebrity.modelName;

      const { slug } = await params;

      const outfit = await CelebrityOutfit.findOne({ slug: slug.toLowerCase().trim(), isActive: true })
        .select('-seo -__v -comments')
        .populate('celebrity', 'name slug profileImage nationality')
        .lean();

      if (!outfit) {
        return NextResponse.json(
          { success: false, message: 'Outfit not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'outfits',
        data: outfit,
      });
    } catch (error) {
      console.error('v1/outfits/[slug] error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
