// /api/auth/me — verifies the access token and returns current user
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenService } from '@/lib/tokenService';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const user = await User.findById(request.user?.userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Issue a fresh access token (silent refresh on page reload)
    const accessToken = TokenService.generateAccessToken(user);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        accessToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['user', 'admin', 'superadmin']);
