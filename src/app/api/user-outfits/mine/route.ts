// GET /api/user-outfits/mine  → authed user's own outfits (all statuses)

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const userId = request.user!.userId;

    const outfits = await UserOutfit.find({ userId })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    const totalViews  = outfits.reduce((s, o) => s + (o.views ?? 0), 0);
    const totalLikes  = outfits.reduce((s, o) => s + ((o.likes as any[])?.length ?? 0), 0);
    const totalClicks = outfits.reduce((s, o) => s + ((o.clicks as any[])?.length ?? 0), 0);

    return NextResponse.json({
      success: true,
      outfits,
      stats: {
        totalUploads: outfits.length,
        totalViews,
        totalLikes,
        totalClicks,
      },
    });
  } catch (err: any) {
    console.error('[user-outfits/mine]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['user', 'admin', 'superadmin']);
