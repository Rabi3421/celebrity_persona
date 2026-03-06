/**
 * GET /api/v1/outfits
 * ────────────────────
 * Public API — requires x-api-key header.
 * Query params:
 *   page, limit, search, celebrity (slug), category, brand, sort
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Celebrity from '@/models/Celebrity';

export async function GET(request: NextRequest) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();
      void Celebrity.modelName; // ensure Celebrity model registered for populate

      const { searchParams } = new URL(req.url);
      const page      = Math.max(1, parseInt(searchParams.get('page')  || '1'));
      const limit     = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search    = searchParams.get('search')    || '';
      const celebrity = searchParams.get('celebrity') || '';
      const category  = searchParams.get('category')  || '';
      const brand     = searchParams.get('brand')     || '';
      const sort      = searchParams.get('sort') || 'latest';
      const skip = (page - 1) * limit;

      const query: Record<string, any> = { isActive: true };
      if (search)   query.title = { $regex: search, $options: 'i' };
      if (category) query.category = { $regex: category, $options: 'i' };
      if (brand)    query.brand = { $regex: brand, $options: 'i' };

      // If celebrity slug provided, resolve to ObjectId first
      if (celebrity) {
        const cel = await Celebrity.findOne({ slug: celebrity.toLowerCase() }).select('_id').lean();
        if (cel) query.celebrity = (cel as any)._id;
      }

      const sortMap: Record<string, any> = {
        latest:     { createdAt: -1 },
        oldest:     { createdAt: 1 },
        popular:    { likesCount: -1 },
        title_asc:  { title: 1 },
      };
      const sortObj = sortMap[sort] || sortMap.latest;

      const [outfits, total] = await Promise.all([
        CelebrityOutfit.find(query)
          .select('title slug images event designer brand category color price purchaseLink tags likesCount isFeatured celebrity createdAt')
          .populate('celebrity', 'name slug profileImage')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        CelebrityOutfit.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'outfits',
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        data: outfits,
      });
    } catch (error) {
      console.error('v1/outfits error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
