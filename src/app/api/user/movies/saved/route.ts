/**
 * GET /api/user/movies/saved
 * Returns all movies saved (wishlisted) by the authenticated user.
 * Requires: Bearer auth
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;

  try {
    await dbConnect();

    const uid = new mongoose.Types.ObjectId(userId);

    const movies = await Movie.find({ saves: uid })
      .select('title slug poster backdrop releaseDate genre status anticipationScore featured likes saves comments')
      .sort({ releaseDate: 1 })
      .lean();

    const items = movies.map((m: any) => ({
      id:               m._id.toString(),
      title:            m.title,
      slug:             m.slug,
      poster:           m.poster ?? null,
      backdrop:         m.backdrop ?? null,
      releaseDate:      m.releaseDate ?? null,
      genre:            m.genre ?? [],
      status:           m.status ?? 'Upcoming',
      anticipationScore: m.anticipationScore ?? null,
      featured:         m.featured ?? false,
      likeCount:        Array.isArray(m.likes)    ? m.likes.length    : 0,
      saveCount:        Array.isArray(m.saves)    ? m.saves.length    : 0,
      commentCount:     Array.isArray(m.comments) ? m.comments.length : 0,
    }));

    return NextResponse.json({ success: true, movies: items });
  } catch (err: any) {
    console.error('[GET /api/user/movies/saved]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch saved movies' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
