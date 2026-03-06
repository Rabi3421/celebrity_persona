import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { withAuth } from '@/lib/authMiddleware';

const ALLOWED_FIELDS = [
  'title', 'slug', 'movieTitle', 'poster', 'backdropImage', 'trailer',
  'rating', 'content', 'excerpt', 'author', 'movieDetails', 'scores',
  'publishDate', 'featured', 'pros', 'cons', 'verdict', 'seoData', 'seo',
];

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const review = await MovieReview.findById(id).lean();
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('[GET /api/superadmin/reviews/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch review' }, { status: 500 });
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    if (update.slug) {
      const clash = await MovieReview.findOne({ slug: update.slug, _id: { $ne: id } }).lean();
      if (clash) update.slug = `${update.slug}-${Date.now()}`;
    }

    const review = await MovieReview.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('[PUT /api/superadmin/reviews/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 });
  }
}

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const review = await MovieReview.findByIdAndDelete(id).lean();
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/superadmin/reviews/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 });
  }
}

export const GET    = withAuth(getHandler,    ['superadmin', 'admin']);
export const PUT    = withAuth(putHandler,    ['superadmin']);
export const DELETE = withAuth(deleteHandler, ['superadmin']);
