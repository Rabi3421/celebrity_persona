/**
 * GET /api/user/movies/[slug]/status
 * Returns: { liked, saved, likeCount, saveCount, commentCount, comments[] }
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

    const movie = await Movie.findOne({ slug: slug.toLowerCase().trim() })
      .select('likes saves comments')
      .lean() as any;

    if (!movie) {
      return NextResponse.json({ success: false, message: 'Movie not found' }, { status: 404 });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    const liked   = (movie.likes ?? []).some((id: any) => id.equals(uid));
    const saved   = (movie.saves ?? []).some((id: any) => id.equals(uid));

    const comments = (movie.comments ?? []).map((c: any) => ({
      id:         c._id.toString(),
      userId:     c.userId.toString(),
      userName:   c.userName,
      userAvatar: c.userAvatar ?? '',
      text:       c.text,
      createdAt:  c.createdAt,
      isOwn:      c.userId.equals(uid),
    }));

    return NextResponse.json({
      success:      true,
      liked,
      saved,
      likeCount:    (movie.likes ?? []).length,
      saveCount:    (movie.saves ?? []).length,
      commentCount: (movie.comments ?? []).length,
      comments,
    });
  } catch (err: any) {
    console.error('[GET /api/user/movies/[slug]/status]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
