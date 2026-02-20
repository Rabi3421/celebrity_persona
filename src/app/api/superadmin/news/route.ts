// /api/superadmin/news — GET paginated list + POST create (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import '@/models/Celebrity';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
      const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q        = (searchParams.get('q') || '').trim();
      const category = searchParams.get('category') || '';
      const author   = searchParams.get('author')   || '';
      const featured = searchParams.get('featured');

      const filter: Record<string, any> = {};
      if (q) filter.$or = [
        { title:   { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { author:  { $regex: q, $options: 'i' } },
        { tags:    { $regex: q, $options: 'i' } },
      ];
      if (category) filter.category = { $regex: category, $options: 'i' };
      if (author)   filter.author   = { $regex: author,   $options: 'i' };
      if (featured === 'true')  filter.featured = true;
      if (featured === 'false') filter.featured = false;

      const [total, docs] = await Promise.all([
        CelebrityNews.countDocuments(filter),
        CelebrityNews.find(filter)
          .select('title slug excerpt thumbnail author category celebrity tags publishDate featured createdAt')
          .sort({ publishDate: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      const data = docs.map((d: any) => {
        const obj = { ...d, id: String(d._id) };
        delete obj._id; delete obj.__v;
        return obj;
      });

      return NextResponse.json({
        success: true, data, total, page, limit,
        pages: Math.ceil(total / limit),
      });
    }

    // ── POST ──────────────────────────────────────────────────────────────
    if (request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { title, content } = body;
      if (!title?.trim())   return NextResponse.json({ success: false, message: 'title is required'   }, { status: 400 });
      if (!content?.trim()) return NextResponse.json({ success: false, message: 'content is required' }, { status: 400 });

      let slug = body.slug ? String(body.slug).trim().toLowerCase() : generateSlug(title);
      if (await CelebrityNews.findOne({ slug }).lean()) slug = `${slug}-${Date.now()}`;

      const doc = await CelebrityNews.create({
        title:       title.trim(),
        slug,
        content:     content.trim(),
        excerpt:     body.excerpt     || undefined,
        thumbnail:   body.thumbnail   || undefined,
        author:      body.author      || undefined,
        category:    body.category    || undefined,
        celebrity:   body.celebrity   || null,
        tags:        body.tags        || [],
        publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
        featured:    body.featured    ?? false,
        seo:         body.seo         || undefined,
      });

      const obj: any = doc.toObject();
      obj.id = String(obj._id); delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin news error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'A news article with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET  = withAuth(handler, ['superadmin']);
export const POST = withAuth(handler, ['superadmin']);
