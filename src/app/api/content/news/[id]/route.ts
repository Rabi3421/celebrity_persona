// /api/content/news/[id] — GET / PUT / DELETE (superadmin + admin)
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { normalizeNewsPayload, serializeNews, validateNewsPayload } from '@/lib/celebrityNews';

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const doc = await CelebrityNews.findById(id)
        .populate('primaryCelebrity celebrity', 'name slug profileImage')
        .lean();
      if (!doc) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: serializeNews(doc) });
    }

    // ── PUT ───────────────────────────────────────────────────────────────
    if (request.method === 'PUT') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const existing = await CelebrityNews.findById(id).lean();
      if (!existing) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      const update = normalizeNewsPayload(body, existing);
      const errors = validateNewsPayload(update);
      if (Object.keys(errors).length) {
        return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
      }

      const updated = await CelebrityNews.findByIdAndUpdate(
        id, update, { new: true, runValidators: true }
      ).lean();
      if (!updated) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: serializeNews(updated) });
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const removed = await CelebrityNews.findByIdAndUpdate(id, { status: 'archived' }, { new: true }).lean();
      if (!removed) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'News article archived successfully' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Content news [id] error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'A news article with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET    = withAuth(handler, ['superadmin', 'admin']);
export const PUT    = withAuth(handler, ['superadmin', 'admin']);
export const DELETE = withAuth(handler, ['superadmin', 'admin']);
