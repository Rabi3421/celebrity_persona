// GET /api/user/celebrities/following
// Returns all celebrities the authenticated user is following
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;
  try {
    await dbConnect();

    const user = await User.findById(userId)
      .select('followedCelebrities')
      .populate({
        path:   'followedCelebrities',
        select: '_id name slug profileImage occupation categories isVerified',
        match:  { isActive: true },
      })
      .lean() as any;

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const celebrities = (user.followedCelebrities || []).map((c: any) => ({
      id:           String(c._id),
      name:         c.name,
      slug:         c.slug,
      profileImage: c.profileImage || '',
      occupation:   c.occupation   || [],
      categories:   c.categories   || [],
      isVerified:   c.isVerified   || false,
    }));

    return NextResponse.json({ success: true, celebrities });
  } catch (err: any) {
    console.error('[following celebrities]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['user', 'admin', 'superadmin']);
