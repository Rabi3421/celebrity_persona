// /api/content/news — GET paginated list + POST create (superadmin + admin)
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import '@/models/Celebrity'; // ensure Celebrity schema registered for populate
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { normalizeNewsPayload, serializeNews, validateNewsPayload } from '@/lib/celebrityNews';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
      const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q        = (searchParams.get('q') || searchParams.get('search') || '').trim();
      const category = searchParams.get('category') || '';
      const featured = searchParams.get('featured');
      const author   = searchParams.get('author') || '';
      const status   = searchParams.get('status') || '';

      const filter: Record<string, any> = {};
      if (q) filter.$or = [
        { title:   { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { author:  { $regex: q, $options: 'i' } },
        { authorName: { $regex: q, $options: 'i' } },
        { tags:    { $regex: q, $options: 'i' } },
      ];
      if (category) filter.category = { $regex: category, $options: 'i' };
      if (author)   filter.author   = { $regex: author,   $options: 'i' };
      if (featured === 'true')  filter.isFeatured = true;
      if (featured === 'false') filter.isFeatured = false;
      if (['draft', 'scheduled', 'published', 'archived'].includes(status)) filter.status = status;

      const [total, docs] = await Promise.all([
        CelebrityNews.countDocuments(filter),
        CelebrityNews.find(filter)
          .select('-comments -likes -saves')
          .sort({ publishedAt: -1, publishDate: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('primaryCelebrity celebrity', 'name slug profileImage')
          .lean(),
      ]);

      const data = docs.map((d: any) => serializeNews(d));

      return NextResponse.json({
        success: true,
        data: {
          news: data,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      });
    }

    // ── POST ──────────────────────────────────────────────────────────────
    if (request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { title } = body;
      if (!title?.trim()) return NextResponse.json({ success: false, message: 'title is required' }, { status: 400 });

      const payload = normalizeNewsPayload(body);
      const errors = validateNewsPayload(payload);
      if (Object.keys(errors).length) {
        return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
      }
      let slug = payload.slug;
      if (await CelebrityNews.findOne({ slug }).lean()) slug = `${slug}-${Date.now()}`;
      payload.slug = slug;

      const doc: any = await CelebrityNews.create(payload as any);

      return NextResponse.json({ success: true, data: serializeNews(doc.toObject()) }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Content news error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'A news article with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET  = withAuth(handler, ['superadmin', 'admin']);
export const POST = withAuth(handler, ['superadmin', 'admin']);
