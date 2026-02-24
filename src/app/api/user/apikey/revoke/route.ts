/**
 * POST /api/user/apikey/revoke
 * ────────────────────────────
 * Revokes (deactivates) the user's API key.
 * Requires password verification.
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
        { success: false, message: 'Password is required to revoke your API key.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = request.user!.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password.' },
        { status: 401 }
      );
    }

    const apiKey = await ApiKey.findOneAndDelete({ userId });
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'No API key found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked and deleted successfully. You can generate a new one anytime.',
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
