/**
 * POST /api/user/apikey/reveal
 * ────────────────────────────
 * Returns the API key after verifying the user's login password.
 * Body: { password: string }
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required to reveal your API key.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = request.user!.userId;

    // Fetch user WITH password field (it's select:false by default)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // Verify password
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Find API key
    const apiKey = await ApiKey.findOne({ userId });
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'No API key found. Generate one first.', hasKey: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        key: apiKey.key,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        freeQuota: apiKey.freeQuota,
        purchasedQuota: apiKey.purchasedQuota,
        totalQuota: apiKey.freeQuota + apiKey.purchasedQuota,
        totalHits: apiKey.totalHits,
      },
    });
  } catch (error) {
    console.error('Reveal API key error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
