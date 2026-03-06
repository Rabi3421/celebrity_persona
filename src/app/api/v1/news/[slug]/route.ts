/**
 * GET /api/v1/news/[slug]
 * ────────────────────────
 * Public API — requires x-api-key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
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

      const article = await CelebrityNews.findOne({ slug: slug.toLowerCase().trim() })
        .select('-seo -__v -likes -saves -comments')
        .populate('celebrity', 'name slug profileImage nationality')
        .lean();

      if (!article) {
        return NextResponse.json(
          { success: false, message: 'Article not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: 'v1',
        resource: 'news',
        data: article,
      });
    } catch (error) {
      console.error('v1/news/[slug] error:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
}
