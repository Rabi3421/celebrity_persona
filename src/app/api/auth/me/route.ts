// /api/auth/me — called on every page load to restore session from the httpOnly refresh cookie
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

export async function GET(request: NextRequest) {
  try {
    // Restore session using the httpOnly refresh cookie
    const refreshToken = request.cookies.get('cp_refresh_token')?.value;
    if (!refreshToken) {
      return unauthorized('Not authenticated');
    }

    let decoded;
    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      return unauthorized('Session expired');
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
      return unauthorized('Session invalid');
    }

    // Issue a fresh short-lived access token (in-memory on the client)
    const accessToken = TokenService.generateAccessToken(user);

    return NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
