// /api/superadmin/news/[id] — GET / PUT / DELETE (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import '@/models/Celebrity';

const ALLOWED_FIELDS = new Set([
  'title', 'slug', 'content', 'excerpt', 'thumbnail', 'author',
  'category', 'celebrity', 'tags', 'publishDate', 'featured', 'seo',
]);

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const doc = await CelebrityNews.findById(id).lean();
      if (!doc) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      const obj: any = { ...doc, id: String((doc as any)._id) };
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    // ── PUT ───────────────────────────────────────────────────────────────
    if (request.method === 'PUT') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const update: any = {};
      for (const key of Object.keys(body)) {
        if (ALLOWED_FIELDS.has(key)) {
          update[key] = key === 'publishDate' && body[key] ? new Date(body[key]) : body[key];
        }
      }

      const updated = await CelebrityNews.findByIdAndUpdate(
        id, update, { new: true, runValidators: true }
      ).lean();
      if (!updated) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      const obj: any = { ...updated, id: String((updated as any)._id) };
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const removed = await CelebrityNews.findByIdAndDelete(id).lean();
      if (!removed) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'News article deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin news [id] error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'A news article with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET    = withAuth(handler, ['superadmin']);
export const PUT    = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
