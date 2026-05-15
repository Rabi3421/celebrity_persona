import { NextRequest, NextResponse } from 'next/server';
import { getReviews } from '@/lib/seo/publicData';

export const dynamic = 'force-dynamic';

function positiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, parsed));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = positiveInt(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInt(searchParams.get('limit'), 12, 50);
  const sortParam = searchParams.get('sort') || 'latest';
  const sort = ['latest', 'oldest', 'rating_high', 'rating_low', 'title'].includes(sortParam)
    ? (sortParam as 'latest' | 'oldest' | 'rating_high' | 'rating_low' | 'title')
    : 'latest';
  const minRatingParam = searchParams.get('minRating');
  const minRating = minRatingParam === null ? null : Number(minRatingParam);

  const reviewPage = await getReviews({
    page,
    limit,
    search: searchParams.get('search') || '',
    minRating: Number.isFinite(minRating) ? minRating : null,
    featured: searchParams.get('featured') === 'true',
    sort,
  });

  return NextResponse.json({
    success: true,
    resource: 'reviews',
    ...reviewPage,
  });
}
