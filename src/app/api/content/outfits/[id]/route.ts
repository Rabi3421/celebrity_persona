import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { normalizeOutfitPayload, serializeOutfit, validateOutfitPayload } from '@/lib/celebrityOutfits';

async function getOutfit(_request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const outfit = await CelebrityOutfit.findById(params.id)
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();
    if (!outfit) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeOutfit(outfit) }, { status: 200 });
  } catch (error: any) {
    console.error('Get outfit error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to get outfit' }, { status: 500 });
  }
}

async function updateOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    await dbConnect();

    const existing = await CelebrityOutfit.findById(params.id).lean();
    if (!existing) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });

    const payload = normalizeOutfitPayload(body, existing);
    const errors = validateOutfitPayload(payload);
    if (Object.keys(errors).length) {
      return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
    }

    const duplicate = await CelebrityOutfit.findOne({ slug: payload.slug, _id: { $ne: params.id } }).select('_id').lean();
    if (duplicate) return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });

    const outfit = await CelebrityOutfit.findByIdAndUpdate(params.id, payload, { new: true, runValidators: true })
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();

    return NextResponse.json({ success: true, message: 'Outfit updated successfully', data: serializeOutfit(outfit) }, { status: 200 });
  } catch (error: any) {
    console.error('Update outfit error:', error);
    if (error.code === 11000) return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error.message || 'Failed to update outfit' }, { status: 500 });
  }
}

async function deleteOutfit(_request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const outfit = await CelebrityOutfit.findByIdAndUpdate(params.id, { status: 'archived', isActive: false }, { new: true }).lean();
    if (!outfit) return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Outfit archived successfully', data: serializeOutfit(outfit) }, { status: 200 });
  } catch (error: any) {
    console.error('Delete outfit error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to archive outfit' }, { status: 500 });
  }
}

export const GET = withAuth(getOutfit, ['superadmin', 'admin']);
export const PUT = withAuth(updateOutfit, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteOutfit, ['superadmin', 'admin']);
