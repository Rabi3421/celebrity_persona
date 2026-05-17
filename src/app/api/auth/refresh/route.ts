// Unified refresh — reads refreshToken from httpOnly cookie, returns new accessToken
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
    // Read refresh token from httpOnly cookie only — never from body
    const refreshToken = request.cookies.get('cp_refresh_token')?.value;

    if (!refreshToken) {
      return unauthorized('No refresh token');
    }

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

    // Rotate refresh token (old one invalidated, new one issued)
    const newAccessToken = TokenService.generateAccessToken(user);
    const { refreshToken: newRefreshToken } = TokenService.generateTokenPair(user);

    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const response = NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Rotate the httpOnly cookie with the new refresh token
    response.cookies.set('cp_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
