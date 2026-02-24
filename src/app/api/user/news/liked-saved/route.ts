// GET /api/user/news/liked-saved
// Auth-required — returns news articles the current user has liked or saved
// Query params:
//   type  - "liked" | "saved" | "all" (default "all")
//   page  - 1-based (default 1)
//   limit - (default 20, max 50)
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const userId = new mongoose.Types.ObjectId(request.user!.userId as string);

    const { searchParams } = new URL(request.url);
    const type  = searchParams.get('type') || 'all'; // "liked" | "saved" | "all"
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const skip  = (page - 1) * limit;

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filter: Record<string, any>;
    if (type === 'liked') {
      filter = { likes: userId };
    } else if (type === 'saved') {
      filter = { saves: userId };
    } else {
      // "all" — either liked OR saved
      filter = { $or: [{ likes: userId }, { saves: userId }] };
    }

    const total = await CelebrityNews.countDocuments(filter);

    const articles = await CelebrityNews.find(filter)
      .select('title slug thumbnail category excerpt publishDate createdAt likes saves celebrity tags')
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('celebrity', 'name slug')
      .lean();

    const items = articles.map((a: any) => {
      const likes: any[] = a.likes ?? [];
      const saves: any[] = a.saves ?? [];
      return {
        id:          String(a._id),
        title:       a.title,
        slug:        a.slug,
        thumbnail:   a.thumbnail   || '',
        category:    a.category    || '',
        excerpt:     a.excerpt     || '',
        publishDate: a.publishDate || a.createdAt,
        tags:        a.tags        || [],
        celebrity:   a.celebrity ? { name: (a.celebrity as any).name, slug: (a.celebrity as any).slug } : null,
        likeCount:   likes.length,
        saveCount:   saves.length,
        liked:       likes.some((id: any) => String(id) === String(userId)),
        saved:       saves.some((id: any) => String(id) === String(userId)),
      };
    });

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[GET /api/user/news/liked-saved]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch news' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['user', 'admin', 'superadmin']);
