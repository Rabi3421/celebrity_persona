import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenService } from '@/lib/tokenService';

function unauthorized(message: string) {
  const response = NextResponse.json({ success: false, message }, { status: 401 });
  response.cookies.set('cp_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('cp_refresh_token')?.value;
    if (!refreshToken) return unauthorized('No refresh token');

    let decoded;
    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      return unauthorized('Invalid or expired refresh token');
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken) || !user.isActive) {
      return unauthorized('Invalid refresh token');
    }

    const accessToken = TokenService.generateAccessToken(user);

    return NextResponse.json(
      {
        success: true,
        message: 'Access token refreshed successfully',
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        data: {
          accessToken,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
