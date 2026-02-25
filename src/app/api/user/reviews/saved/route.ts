/**
 * GET /api/user/reviews/saved
 * Returns all movie reviews saved by the authenticated user.
 * Requires: Bearer auth
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;

  try {
    await dbConnect();

    const uid = new mongoose.Types.ObjectId(userId);

    const reviews = await MovieReview.find({ saves: uid })
      .select('title slug movieTitle poster rating excerpt publishDate featured saves likes comments')
      .sort({ publishDate: -1 })
      .lean();

    const items = reviews.map((r: any) => ({
      id:          r._id.toString(),
      title:       r.title,
      slug:        r.slug,
      movieTitle:  r.movieTitle ?? r.title,
      poster:      r.poster ?? null,
      rating:      r.rating ?? null,
      excerpt:     r.excerpt ?? '',
      publishDate: r.publishDate ?? r.createdAt ?? null,
      featured:    r.featured ?? false,
      likeCount:   Array.isArray(r.likes)    ? r.likes.length    : 0,
      saveCount:   Array.isArray(r.saves)    ? r.saves.length    : 0,
      commentCount: Array.isArray(r.comments) ? r.comments.length : 0,
    }));

    return NextResponse.json({ success: true, reviews: items });
  } catch (err: any) {
    console.error('[GET /api/user/reviews/saved]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch saved reviews' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
