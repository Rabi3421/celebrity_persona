// GET /api/celebrity-outfits/favourites
// Returns all CelebrityOutfits the current user has favourited
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.userId as string;
  try {
    await dbConnect();
    const uid = new mongoose.Types.ObjectId(userId);

    const outfits = await CelebrityOutfit.find({
      favourites: uid,
      isActive: true,
    })
      .populate('celebrity', 'name slug profileImage')
      .select('_id title slug images category brand price event designer likes favourites comments createdAt celebrity')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, outfits });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, ['user', 'admin', 'superadmin']);
