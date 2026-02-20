// /api/superadmin/celebrities/[id] — GET / PUT / DELETE (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

const ALLOWED_FIELDS = new Set([
  'name', 'slug', 'born', 'birthPlace', 'died', 'age', 'nationality', 'citizenship',
  'occupation', 'yearsActive', 'height', 'weight', 'bodyMeasurements', 'eyeColor',
  'hairColor', 'spouse', 'children', 'parents', 'siblings', 'relatives', 'education',
  'netWorth', 'introduction', 'earlyLife', 'career', 'personalLife', 'achievements',
  'controversies', 'philanthropy', 'trivia', 'works', 'movies', 'quotes',
  'relatedCelebrities', 'newsArticles', 'socialMedia', 'seo', 'popularity',
  'popularityScore', 'isActive', 'isFeatured', 'isVerified', 'contentQuality',
  'tags', 'categories', 'language', 'profileImage', 'coverImage', 'galleryImages',
  'status', 'isScheduled', 'publishAt',
]);

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    // ── GET ───────────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      const doc = await Celebrity.findById(id).lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
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

      // Validate status if provided
      if (update.status && !['draft', 'published', 'archived'].includes(update.status)) {
        return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
      }

      // If slug is being changed, check uniqueness
      if (update.slug) {
        const conflict = await Celebrity.findOne({ slug: update.slug, _id: { $ne: id } });
        if (conflict) {
          return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
        }
      }

      const updated = await Celebrity.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!updated) return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
      const obj: any = { ...updated, id: String((updated as any)._id) };
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const removed = await Celebrity.findByIdAndDelete(id).lean();
      if (!removed) return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Celebrity deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin celebrity [id] error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A celebrity with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET    = withAuth(handler, ['superadmin']);
export const PUT    = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
