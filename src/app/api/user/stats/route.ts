// GET /api/user/stats — returns quick counts for the profile stats grid
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import UserOutfit from '@/models/UserOutfit';
import Celebrity from '@/models/Celebrity';

async function getStats(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Keep Celebrity referenced so mongoose registers the schema
    void Celebrity.modelName;

    const uid = new mongoose.Types.ObjectId(request.user!.userId as string);

    const [user, savedCelebrity, savedUser, uploads, likedCelebrities] =
      await Promise.all([
        // Following count — stored on the User document
        User.findById(uid).select('followedCelebrities').lean() as Promise<any>,

        // Outfits saved (favourited) from the celebrity outfit gallery
        CelebrityOutfit.countDocuments({ favourites: uid }),

        // Outfits saved from user-uploaded outfits
        UserOutfit.countDocuments({ favourites: uid }),

        // Outfits the user themselves uploaded
        UserOutfit.countDocuments({ userId: uid }),

        // Celebrities the user has liked
        Celebrity.countDocuments({ likes: uid }),
      ]);

    const following    = (user?.followedCelebrities ?? []).length;
    const savedOutfits = savedCelebrity + savedUser;

    return NextResponse.json({
      success: true,
      stats: {
        savedOutfits,
        uploads,
        following,
        likedCelebrities,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStats);
