// /api/superadmin/outfits/[id] — GET / PUT / DELETE (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { normalizeOutfitPayload, serializeOutfit, validateOutfitPayload } from '@/lib/celebrityOutfits';
import '@/models/Celebrity';

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    if (request.method === 'GET') {
      const doc = await CelebrityOutfit.findById(id)
        .populate('celebrity primaryCelebrity', 'name slug profileImage')
        .lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: serializeOutfit(doc) });
    }

    if (request.method === 'PUT') {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const existing = await CelebrityOutfit.findById(id).lean();
      if (!existing) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });

      const payload = normalizeOutfitPayload(body, existing);
      const errors = validateOutfitPayload(payload);
      if (Object.keys(errors).length) {
        return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
      }

      const duplicate = await CelebrityOutfit.findOne({ slug: payload.slug, _id: { $ne: id } }).select('_id').lean();
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'An outfit with this slug already exists', errors: { slug: 'Slug must be unique' } },
          { status: 409 }
        );
      }

      const updated = await CelebrityOutfit.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .populate('celebrity primaryCelebrity', 'name slug profileImage')
        .lean();

      return NextResponse.json({ success: true, data: serializeOutfit(updated) });
    }

    if (request.method === 'DELETE') {
      const archived = await CelebrityOutfit.findByIdAndUpdate(
        id,
        { status: 'archived', isActive: false },
        { new: true }
      ).lean();
      if (!archived) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Outfit archived successfully', data: serializeOutfit(archived) });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin outfit [id] error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
export const PUT = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
