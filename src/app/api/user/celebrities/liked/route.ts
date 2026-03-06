// GET /api/user/celebrities/liked
// Returns all celebrity IDs (and basic info) that the current user has liked
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  await dbConnect();

  const uid = new mongoose.Types.ObjectId(request.user!.userId as string);

  try {
    const celebrities = await Celebrity.find({ likes: uid, isActive: true })
      .select('_id name slug profileImage occupation isVerified likes')
      .lean();

    const result = celebrities.map((c: any) => ({
      id:           String(c._id),
      name:         c.name,
      slug:         c.slug,
      profileImage: c.profileImage ?? '',
      occupation:   c.occupation ?? [],
      isVerified:   c.isVerified ?? false,
      likeCount:    (c.likes ?? []).length,
    }));

    return NextResponse.json({ success: true, celebrities: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
