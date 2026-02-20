// /api/superadmin/celebrities — GET list + POST create (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // ── GET: paginated list ───────────────────────────────────────────────
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page  = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
      const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q     = (searchParams.get('q') || '').trim();
      const status = searchParams.get('status') || '';

      const filter: Record<string, any> = {};
      if (q) filter.$or = [
        { name:       { $regex: q, $options: 'i' } },
        { slug:       { $regex: q, $options: 'i' } },
        { nationality:{ $regex: q, $options: 'i' } },
      ];
      if (status) filter.status = status;

      const [total, docs] = await Promise.all([
        Celebrity.countDocuments(filter),
        Celebrity.find(filter)
          .select('name slug nationality occupation profileImage status isActive isFeatured isVerified contentQuality popularity createdAt')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      const data = docs.map((d: any) => {
        const obj = { ...d, id: String(d._id) };
        delete obj._id; delete obj.__v;
        return obj;
      });

      return NextResponse.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
    }

    // ── POST: create ─────────────────────────────────────────────────────
    if (request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { name, slug, nationality, occupation, introduction, status: s, profileImage } = body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ success: false, message: 'Name is required (min 2 characters)' }, { status: 400 });
      }

      // Auto-generate slug from name if not provided
      const finalSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check slug uniqueness
      const existing = await Celebrity.findOne({ slug: finalSlug });
      if (existing) {
        return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
      }

      const celebrity = await Celebrity.create({
        name: name.trim(),
        slug: finalSlug,
        nationality: nationality?.trim() || '',
        occupation: Array.isArray(occupation) ? occupation : occupation ? [occupation] : [],
        introduction: introduction?.trim() || '',
        status: ['draft', 'published', 'archived'].includes(s) ? s : 'draft',
        profileImage: profileImage?.trim() || '',
        isActive: true,
        isFeatured: false,
        isVerified: false,
        // required arrays default to empty
        citizenship: [], children: [], parents: [], siblings: [], relatives: [],
        education: [], achievements: [], controversies: [], philanthropy: [],
        trivia: [], works: [], movies: [], quotes: [], relatedCelebrities: [],
        newsArticles: [], tags: [], categories: [], galleryImages: [],
        seo: { metaKeywords: [], ogImages: [], tags: [], alternateLangs: [], canonicalAlternates: [], relatedTopics: [] },
      });

      const obj: any = celebrity.toObject();
      obj.id = String(obj._id); delete obj._id; delete obj.__v;

      return NextResponse.json({ success: true, data: obj }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin celebrities error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET  = withAuth(handler, ['superadmin']);
export const POST = withAuth(handler, ['superadmin']);
