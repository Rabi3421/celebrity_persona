// POST /api/user/celebrities/like
// body: { celebrityId: string }
// Toggles like/unlike for the authenticated user on a celebrity profile
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  await dbConnect();

  const userId = request.user!.userId as string;

  try {
    const body        = await request.json();
    const celebrityId = body.celebrityId as string;

    if (!celebrityId || !mongoose.Types.ObjectId.isValid(celebrityId)) {
      return NextResponse.json({ success: false, message: 'Invalid celebrity ID' }, { status: 400 });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    // First fetch to check current like state (initialise likes:[] if missing)
    const celebrity = await Celebrity.findByIdAndUpdate(
      celebrityId,
      { $setOnInsert: {} }, // no-op update just to get the doc
      { new: false }
    ).select('_id name slug likes');

    if (!celebrity) {
      return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
    }

    const currentLikes: mongoose.Types.ObjectId[] = celebrity.likes ?? [];
    const alreadyLiked = currentLikes.some((id) => id.equals(uid));

    // Use atomic $addToSet / $pull so missing array is handled safely
    const updated = await Celebrity.findByIdAndUpdate(
      celebrityId,
      alreadyLiked
        ? { $pull: { likes: uid } }
        : { $addToSet: { likes: uid } },
      { new: true }
    ).select('likes name slug');

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      liked:   !alreadyLiked,
      count:   (updated.likes ?? []).length,
      celebrity: {
        id:   String(updated._id),
        name: updated.name,
        slug: updated.slug,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
