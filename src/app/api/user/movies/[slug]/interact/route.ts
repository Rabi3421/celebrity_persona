/**
 * POST /api/user/movies/[slug]/interact
 * body: { action: 'like'|'unlike'|'save'|'unsave'|'comment'|'delete-comment', text?, commentId? }
 * Requires: Bearer auth
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
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

    const movie = await Movie.findOne({ slug: slug.toLowerCase().trim() });
    if (!movie) {
      return NextResponse.json({ success: false, message: 'Movie not found' }, { status: 404 });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    /* ── like / unlike ─────────────────────────────────────────────────── */
    if (action === 'like') {
      if (!movie.likes.some((id: mongoose.Types.ObjectId) => id.equals(uid))) {
        movie.likes.push(uid);
        await movie.save();
      }
      return NextResponse.json({ success: true, liked: true, count: movie.likes.length });
    }

    if (action === 'unlike') {
      movie.likes = movie.likes.filter((id: mongoose.Types.ObjectId) => !id.equals(uid));
      await movie.save();
      return NextResponse.json({ success: true, liked: false, count: movie.likes.length });
    }

    /* ── save / unsave ─────────────────────────────────────────────────── */
    if (action === 'save') {
      if (!movie.saves.some((id: mongoose.Types.ObjectId) => id.equals(uid))) {
        movie.saves.push(uid);
        await movie.save();
      }
      return NextResponse.json({ success: true, saved: true, count: movie.saves.length });
    }

    if (action === 'unsave') {
      movie.saves = movie.saves.filter((id: mongoose.Types.ObjectId) => !id.equals(uid));
      await movie.save();
      return NextResponse.json({ success: true, saved: false, count: movie.saves.length });
    }

    /* ── comment ───────────────────────────────────────────────────────── */
    if (action === 'comment') {
      const text = (body.text as string | undefined)?.trim();
      if (!text) {
        return NextResponse.json({ success: false, message: 'Comment text required' }, { status: 400 });
      }
      if (text.length > 1000) {
        return NextResponse.json({ success: false, message: 'Comment too long (max 1000 chars)' }, { status: 400 });
      }

      const comment = {
        userId:     uid,
        userName:   request.user!.name,
        userAvatar: request.user!.avatar ?? '',
        text,
      };
      movie.comments.push(comment as any);
      await movie.save();

      const saved = movie.comments[movie.comments.length - 1];
      return NextResponse.json({
        success: true,
        comment: {
          id:         saved._id.toString(),
          userId:     userId,
          userName:   request.user!.name,
          userAvatar: request.user!.avatar ?? '',
          text:       saved.text,
          createdAt:  saved.createdAt,
          isOwn:      true,
        },
        count: movie.comments.length,
      });
    }

    /* ── delete-comment ────────────────────────────────────────────────── */
    if (action === 'delete-comment') {
      const cid = body.commentId as string | undefined;
      if (!cid) {
        return NextResponse.json({ success: false, message: 'commentId required' }, { status: 400 });
      }
      const before = movie.comments.length;
      movie.comments = movie.comments.filter(
        (c: any) => !(c._id.toString() === cid && c.userId.equals(uid))
      );
      if (movie.comments.length === before) {
        return NextResponse.json({ success: false, message: 'Comment not found or not yours' }, { status: 404 });
      }
      await movie.save();
      return NextResponse.json({ success: true, count: movie.comments.length });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/user/movies/[slug]/interact]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
