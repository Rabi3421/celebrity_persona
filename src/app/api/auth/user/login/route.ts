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
          message: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user and include password for comparison
    const user = await User.findOne({ 
      email, 
      role: 'user',
      isActive: true 
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    // Compare password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = TokenService.generateTokenPair(user);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            lastLogin: user.lastLogin
          },
          accessToken,
          refreshToken
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('User login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to login'
      },
      { status: 500 }
    );
  }
}