/**
 * POST /api/user/reviews/[slug]/interact
 * body: { action: 'like'|'unlike'|'save'|'unsave'|'comment'|'delete-comment', text?, commentId? }
 * Requires: Bearer auth
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId   = request.user!.userId as string;

  try {
    await dbConnect();

    const body   = await request.json();
    const action = (body.action as string) ?? '';

    const review = await MovieReview.findOne({ slug: slug.toLowerCase().trim() });
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    // Ensure arrays exist on old documents
    if (!review.likes)    review.likes    = [];
    if (!review.saves)    review.saves    = [];
    if (!review.comments) review.comments = [];

    /* ── Like / Unlike ──────────────────────────────────────────────────── */
    if (action === 'like') {
      await MovieReview.findByIdAndUpdate(review._id, { $addToSet: { likes: uid } });
      const updated: any = await MovieReview.findById(review._id).select('likes').lean();
      return NextResponse.json({ success: true, liked: true, count: (updated?.likes ?? []).length });
    }

    if (action === 'unlike') {
      await MovieReview.findByIdAndUpdate(review._id, { $pull: { likes: uid } });
      const updated: any = await MovieReview.findById(review._id).select('likes').lean();
      return NextResponse.json({ success: true, liked: false, count: (updated?.likes ?? []).length });
    }

    /* ── Save / Unsave ──────────────────────────────────────────────────── */
    if (action === 'save') {
      await MovieReview.findByIdAndUpdate(review._id, { $addToSet: { saves: uid } });
      const updated: any = await MovieReview.findById(review._id).select('saves').lean();
      return NextResponse.json({ success: true, saved: true, count: (updated?.saves ?? []).length });
    }

    if (action === 'unsave') {
      await MovieReview.findByIdAndUpdate(review._id, { $pull: { saves: uid } });
      const updated: any = await MovieReview.findById(review._id).select('saves').lean();
      return NextResponse.json({ success: true, saved: false, count: (updated?.saves ?? []).length });
    }

    /* ── Comment ────────────────────────────────────────────────────────── */
    if (action === 'comment') {
      const text = (body.text || '').trim();
      if (!text) return NextResponse.json({ success: false, message: 'Comment text is required' }, { status: 400 });
      if (text.length > 1000) return NextResponse.json({ success: false, message: 'Comment cannot exceed 1000 characters' }, { status: 400 });

      const comment = {
        _id:        new mongoose.Types.ObjectId(),
        userId:     uid,
        userName:   request.user!.name || 'User',
        userAvatar: (request.user as any)?.avatar || '',
        text,
        createdAt:  new Date(),
      };
      review.comments.push(comment as any);
      await review.save();
      return NextResponse.json({
        success: true,
        comment: {
          id:         String(comment._id),
          userId:     String(comment.userId),
          userName:   comment.userName,
          userAvatar: comment.userAvatar,
          text:       comment.text,
          createdAt:  comment.createdAt,
          isOwn:      true,
        },
        count: review.comments.length,
      });
    }

    /* ── Delete comment ─────────────────────────────────────────────────── */
    if (action === 'delete-comment') {
      const cid = body.commentId as string;
      const idx = review.comments.findIndex(
        (c: any) => String(c._id) === cid && String(c.userId) === userId
      );
      if (idx === -1) return NextResponse.json({ success: false, message: 'Comment not found or not yours' }, { status: 403 });
      review.comments.splice(idx, 1);
      await review.save();
      return NextResponse.json({ success: true, commentId: cid, count: review.comments.length });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[review interact]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['user', 'admin', 'superadmin']);
