// GET /api/user-outfits/favourites  → returns all outfits the current user has favourited
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;
  try {
    await dbConnect();
    const uid = new mongoose.Types.ObjectId(userId);

    const outfits = await UserOutfit.find({
      favourites: uid,
      isPublished: true,
      isApproved: true,
    })
      .populate('userId', 'name avatar')
      .select('_id title slug images category brand purchasePrice store views likes comments favourites createdAt userId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, outfits });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, ['user', 'admin', 'superadmin']);
