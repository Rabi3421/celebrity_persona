import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenService } from '@/lib/tokenService';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token is required'
        },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid refresh token'
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid refresh token'
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated'
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = TokenService.generateAccessToken(user);

    return NextResponse.json(
      {
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to refresh token'
      },
      { status: 500 }
    );
  }
}