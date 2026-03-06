/**
 * GET /api/v1/news
 * ─────────────────
 * Public API — requires x-api-key header.
 * Query params:
 *   page, limit, search, category, celebrity (slug), featured, sort
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import Celebrity from '@/models/Celebrity';

export async function GET(request: NextRequest) {
  return withApiKey(request, async (req) => {
    try {
      await dbConnect();
      void Celebrity.modelName;

      const { searchParams } = new URL(req.url);
      const page      = Math.max(1, parseInt(searchParams.get('page')  || '1'));
      const limit     = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search    = searchParams.get('search')    || '';
      const category  = searchParams.get('category')  || '';
      const celebrity = searchParams.get('celebrity') || '';
      const featured  = searchParams.get('featured')  || '';
      const sort      = searchParams.get('sort') || 'latest';
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {};
      if (search)   query.title = { $regex: search, $options: 'i' };
      if (category) query.category = { $regex: category, $options: 'i' };
      if (featured === 'true') query.featured = true;

      if (celebrity) {
        const cel = await Celebrity.findOne({ slug: celebrity.toLowerCase() }).select('_id').lean();
        if (cel) query.celebrity = (cel as any)._id;
      }

      const sortMap: Record<string, any> = {
        latest:   { publishDate: -1, createdAt: -1 },
        oldest:   { publishDate: 1 },
        popular:  { 'likes': -1 },
      };
      const sortObj = sortMap[sort] || sortMap.latest;

      const [articles, total] = await Promise.all([
        CelebrityNews.find(query)
          .select('title slug excerpt thumbnail author category tags publishDate featured celebrity createdAt')
          .populate('celebrity', 'name slug profileImage')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        CelebrityNews.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'news',
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        data: articles,
      });
    } catch (error) {
      console.error('v1/news error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
