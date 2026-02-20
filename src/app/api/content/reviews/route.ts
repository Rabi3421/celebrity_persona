import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';

// Public GET — list reviews
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') || '10', 10));
    const q        = searchParams.get('q')?.trim();
    const featured = searchParams.get('featured');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { title:      { $regex: q, $options: 'i' } },
        { movieTitle: { $regex: q, $options: 'i' } },
        { excerpt:    { $regex: q, $options: 'i' } },
      ];
    }
    if (featured !== null && featured !== undefined) {
      filter.featured = featured === 'true';
    }
    if (minRating) filter.rating = { ...filter.rating, $gte: parseFloat(minRating) };
    if (maxRating) filter.rating = { ...filter.rating, $lte: parseFloat(maxRating) };

    const skip  = (page - 1) * limit;
    const total = await MovieReview.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await MovieReview.find(filter)
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data, total, page, limit, pages });
  } catch (error) {
    console.error('[GET /api/content/reviews]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
