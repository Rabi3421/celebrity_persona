/**
 * GET  /api/user/reviews/[slug]/user-reviews  — list user reviews for a movie review
 * POST /api/user/reviews/[slug]/user-reviews  — submit or update user's own review
 * DELETE /api/user/reviews/[slug]/user-reviews?id=<id> — delete own review
 *
 * GET is public (uses x-api-key). POST/DELETE require Bearer auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import UserReview from '@/models/UserReview';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

/* ── GET: public list ─────────────────────────────────────────────────────── */
export function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return withApiKey(request, async () => {
    const { slug } = await ctx.params;
    const url      = new URL(request.url);
    const page     = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const limit    = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? 10)));
    const skip     = (page - 1) * limit;

    await dbConnect();

    const review = await MovieReview.findOne({ slug: slug.toLowerCase().trim() }).select('_id').lean();
    if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });

    const [userReviews, total] = await Promise.all([
      UserReview.find({ reviewId: review._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserReview.countDocuments({ reviewId: review._id }),
    ]);

    // Avg user rating
    const agg = await UserReview.aggregate([
      { $match: { reviewId: new mongoose.Types.ObjectId(String((review as any)._id)) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avgRating = agg[0]?.avg ? parseFloat(agg[0].avg.toFixed(1)) : null;

    return NextResponse.json({
      success: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      avgRating,
      data: userReviews.map((r: any) => ({
        id:         String(r._id),
        userId:     String(r.userId),
        userName:   r.userName,
        userAvatar: r.userAvatar,
        rating:     r.rating,
        title:      r.title,
        body:       r.body,
        helpfulCount: (r.helpful ?? []).length,
        createdAt:  r.createdAt,
      })),
    });
  });
}

/* ── POST: submit / update own review ────────────────────────────────────── */
async function postHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId   = request.user!.userId as string;

  try {
    await dbConnect();
    const body = await request.json();
    const { rating, title, body: reviewBody } = body;

    if (!rating || rating < 1 || rating > 10)
      return NextResponse.json({ success: false, message: 'Rating must be between 1 and 10' }, { status: 400 });
    if (!reviewBody?.trim())
      return NextResponse.json({ success: false, message: 'Review body is required' }, { status: 400 });
    if (reviewBody.trim().length < 20)
      return NextResponse.json({ success: false, message: 'Review must be at least 20 characters' }, { status: 400 });

    const review = await MovieReview.findOne({ slug: slug.toLowerCase().trim() }).select('_id').lean();
    if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });

    const uid = new mongoose.Types.ObjectId(userId);
    const updated = await UserReview.findOneAndUpdate(
      { reviewId: (review as any)._id, userId: uid },
      {
        $set: {
          reviewId:   (review as any)._id,
          reviewSlug: slug,
          userId:     uid,
          userName:   request.user!.name || 'User',
          userAvatar: (request.user as any)?.avatar || '',
          rating:     Number(rating),
          title:      title?.trim() || '',
          body:       reviewBody.trim(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      review: {
        id:         String(updated._id),
        rating:     updated.rating,
        title:      updated.title,
        body:       updated.body,
        createdAt:  updated.createdAt,
        isOwn:      true,
      },
    });
  } catch (err: any) {
    if (err.code === 11000)
      return NextResponse.json({ success: false, message: 'You already submitted a review' }, { status: 409 });
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/* ── DELETE: remove own review ───────────────────────────────────────────── */
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId   = request.user!.userId as string;

  await dbConnect();
  const review = await MovieReview.findOne({ slug: slug.toLowerCase().trim() }).select('_id').lean();
  if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });

  const del = await UserReview.findOneAndDelete({
    reviewId: (review as any)._id,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!del) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export const POST   = withAuth(postHandler,   ['user', 'admin', 'superadmin']);
export const DELETE = withAuth(deleteHandler, ['user', 'admin', 'superadmin']);
