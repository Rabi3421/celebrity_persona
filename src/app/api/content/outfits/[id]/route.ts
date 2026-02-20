import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity'; // ensure Celebrity schema is registered for populate
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

const ALLOWED_FIELDS = new Set([
  'title', 'slug', 'celebrity', 'images', 'event', 'designer',
  'description', 'tags', 'purchaseLink', 'price', 'brand',
  'category', 'color', 'size', 'isActive', 'isFeatured', 'seo',
]);

// GET single outfit
async function getOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await dbConnect();

    const outfit = await CelebrityOutfit.findById(id)
      .populate('celebrity', 'name slug')
      .lean();

    if (!outfit)
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });

    const obj: any = { ...outfit, id: String((outfit as any)._id) };
    delete obj._id; delete obj.__v;
    return NextResponse.json({ success: true, data: obj }, { status: 200 });
  } catch (error: any) {
    console.error('Get outfit error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to get outfit' }, { status: 500 });
  }
}

// UPDATE outfit
async function updateOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    await dbConnect();

    const update: any = {};
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.has(key)) update[key] = body[key];
    }

    if (update.images !== undefined) {
      if (!Array.isArray(update.images) || update.images.length === 0)
        return NextResponse.json({ success: false, message: 'images must be a non-empty array' }, { status: 400 });
    }

    const outfit = await CelebrityOutfit.findByIdAndUpdate(
      id, update, { new: true, runValidators: true }
    ).populate('celebrity', 'name slug').lean();

    if (!outfit)
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });

    const obj: any = { ...outfit, id: String((outfit as any)._id) };
    delete obj._id; delete obj.__v;
    return NextResponse.json({ success: true, message: 'Outfit updated successfully', data: obj }, { status: 200 });
  } catch (error: any) {
    console.error('Update outfit error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error.message || 'Failed to update outfit' }, { status: 500 });
  }
}

// DELETE outfit
async function deleteOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await dbConnect();

    const outfit = await CelebrityOutfit.findByIdAndDelete(id).lean();
    if (!outfit)
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Outfit deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete outfit error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete outfit' }, { status: 500 });
  }
}

export const GET    = withAuth(getOutfit,    ['superadmin', 'admin']);
export const PUT    = withAuth(updateOutfit, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteOutfit, ['superadmin', 'admin']);
