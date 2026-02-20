import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';

// Public GET single review
export async function GET(
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
    console.error('[GET /api/content/reviews/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch review' }, { status: 500 });
  }
}
