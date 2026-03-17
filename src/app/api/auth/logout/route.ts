import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function logoutHandler(request: AuthenticatedRequest) {
  try {
    // Read refresh token from httpOnly cookie — not from body
    const refreshToken = request.cookies.get('cp_refresh_token')?.value;
    let logoutAll = false;
    try { const body = await request.json(); logoutAll = !!body.logoutAll; } catch { /* no body */ }

    await dbConnect();

    const user = await User.findById(request.user?.userId);
    if (user) {
      if (logoutAll) {
        user.refreshTokens = [];
      } else if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
      }
      await user.save();
    }

    const response = NextResponse.json(
      { success: true, message: logoutAll ? 'Logged out from all devices' : 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the httpOnly cookie
    response.cookies.set('cp_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to logout' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(logoutHandler, ['user', 'admin', 'superadmin']);