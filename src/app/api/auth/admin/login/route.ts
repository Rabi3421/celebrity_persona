import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenService } from '@/lib/tokenService';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find admin and include password for comparison
    const admin = await User.findOne({
      email,
      role: 'admin',
      isActive: true,
    }).select('+password');

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Compare password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = TokenService.generateTokenPair(admin);

    // Save refresh token
    admin.refreshTokens.push(refreshToken);
    admin.lastLogin = new Date();
    await admin.save();

    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            lastLogin: admin.lastLogin,
          },
          accessToken,
        },
        accessToken,
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
      },
      { status: 200 }
    );

    response.cookies.set('cp_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to login',
      },
      { status: 500 }
    );
  }
}
