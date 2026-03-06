/**
 * GET /api/user/reviews/[slug]/status
 * Returns liked/saved status + comment list for the current user
 * Requires: Bearer auth
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import UserReview from '@/models/UserReview';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId   = request.user!.userId as string;

  await dbConnect();
  const review: any = await MovieReview.findOne({ slug: slug.toLowerCase().trim() })
    .select('likes saves comments')
    .lean();

  if (!review) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const uid     = userId.toString();
  const liked   = (review.likes ?? []).some((id: any) => String(id) === uid);
  const saved   = (review.saves ?? []).some((id: any) => String(id) === uid);
  const likeCount = (review.likes ?? []).length;
  const saveCount = (review.saves ?? []).length;

  const comments = (review.comments ?? []).map((c: any) => ({
    id:         String(c._id),
    userId:     String(c.userId),
    userName:   c.userName,
    userAvatar: c.userAvatar,
    text:       c.text,
    createdAt:  c.createdAt,
    isOwn:      String(c.userId) === uid,
  }));

  // Own user review if any
  const ownUserReview = await UserReview.findOne({
    reviewId: new mongoose.Types.ObjectId(String(review._id)),
    userId:   new mongoose.Types.ObjectId(userId),
  }).lean();

  return NextResponse.json({
    success: true,
    liked,
    saved,
    likeCount,
    saveCount,
    commentCount: comments.length,
    comments,
    ownUserReview: ownUserReview ? {
      id:        String((ownUserReview as any)._id),
      rating:    (ownUserReview as any).rating,
      title:     (ownUserReview as any).title,
      body:      (ownUserReview as any).body,
      createdAt: (ownUserReview as any).createdAt,
    } : null,
  });
}

export const GET = withAuth(handler, ['user', 'admin', 'superadmin']);
