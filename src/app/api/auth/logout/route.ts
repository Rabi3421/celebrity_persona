import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function logoutHandler(request: AuthenticatedRequest) {
  try {
    const { refreshToken, logoutAll } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user
    const user = await User.findById(request.user?.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    if (logoutAll) {
      // Logout from all devices - clear all refresh tokens
      user.refreshTokens = [];
    } else {
      // Logout from current device only - remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: logoutAll ? 'Logged out from all devices successfully' : 'Logged out successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to logout'
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(logoutHandler, ['user', 'admin', 'superadmin']);