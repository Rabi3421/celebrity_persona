// /api/superadmin/outfits/[id] — GET / PUT / DELETE (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity'; // ensure Celebrity schema is registered for populate

const ALLOWED_FIELDS = new Set([
  'title', 'slug', 'celebrity', 'images', 'event', 'designer',
  'description', 'tags', 'purchaseLink', 'price', 'brand',
  'category', 'color', 'size', 'isActive', 'isFeatured', 'seo',
]);

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const doc = await CelebrityOutfit.findById(id)
        .populate('celebrity', 'name slug')
        .lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
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
        if (ALLOWED_FIELDS.has(key)) update[key] = body[key];
      }

      // Validate images if provided
      if (update.images !== undefined) {
        if (!Array.isArray(update.images) || update.images.length === 0)
          return NextResponse.json({ success: false, message: 'images must be a non-empty array' }, { status: 400 });
      }

      const updated = await CelebrityOutfit.findByIdAndUpdate(
        id, update, { new: true, runValidators: true }
      ).populate('celebrity', 'name slug').lean();

      if (!updated) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
      const obj: any = { ...updated, id: String((updated as any)._id) };
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const removed = await CelebrityOutfit.findByIdAndDelete(id).lean();
      if (!removed) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Outfit deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin outfit [id] error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET    = withAuth(handler, ['superadmin']);
export const PUT    = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
