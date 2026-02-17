import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import TokenService from '@/lib/tokenService';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Generate new access token
    const newAccessToken = TokenService.generateAccessToken(user);

    // Create response with user data
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      {
        message: 'Token refreshed successfully',
        user: userResponse,
        accessToken: newAccessToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}