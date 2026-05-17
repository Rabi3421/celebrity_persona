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

    // Find superadmin and include password for comparison
    const superAdmin = await User.findOne({
      email,
      role: 'superadmin',
      isActive: true,
    }).select('+password');

    if (!superAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Compare password
    const isValidPassword = await superAdmin.comparePassword(password);
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
    const { accessToken, refreshToken } = TokenService.generateTokenPair(superAdmin);

    // Save refresh token
    superAdmin.refreshTokens.push(refreshToken);
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    const response = NextResponse.json(
      {
        success: true,
        message: 'SuperAdmin login successful',
        data: {
          user: {
            id: superAdmin._id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: superAdmin.role,
            lastLogin: superAdmin.lastLogin,
          },
          accessToken,
        },
        accessToken,
        user: {
          id: superAdmin._id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          lastLogin: superAdmin.lastLogin,
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
    console.error('SuperAdmin login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to login',
      },
      { status: 500 }
    );
  }
}
