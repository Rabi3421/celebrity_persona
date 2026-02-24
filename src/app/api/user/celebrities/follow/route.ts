// POST /api/user/celebrities/follow
// body: { celebrityId: string }
// Toggles follow/unfollow for the authenticated user
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;
  try {
    await dbConnect();

    const body        = await request.json();
    const celebrityId = body.celebrityId as string;

    if (!celebrityId || !mongoose.Types.ObjectId.isValid(celebrityId)) {
      return NextResponse.json({ success: false, message: 'Invalid celebrity ID' }, { status: 400 });
    }

    // Make sure the celebrity exists
    const celebrity = await Celebrity.findById(celebrityId).select('_id name slug profileImage occupation').lean() as any;
    if (!celebrity) {
      return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
    }

    const user = await User.findById(userId).select('followedCelebrities');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const cid       = new mongoose.Types.ObjectId(celebrityId);
    const isFollowing = user.followedCelebrities.some((id) => id.equals(cid));

    if (isFollowing) {
      user.followedCelebrities = user.followedCelebrities.filter((id) => !id.equals(cid));
    } else {
      user.followedCelebrities.push(cid);
    }
    await user.save();

    return NextResponse.json({
      success:     true,
      following:   !isFollowing,
      count:       user.followedCelebrities.length,
      celebrity: {
        id:           String(celebrity._id),
        name:         celebrity.name,
        slug:         celebrity.slug,
        profileImage: celebrity.profileImage || '',
        occupation:   celebrity.occupation || [],
      },
    });
  } catch (err: any) {
    console.error('[follow celebrity]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['user', 'admin', 'superadmin']);
