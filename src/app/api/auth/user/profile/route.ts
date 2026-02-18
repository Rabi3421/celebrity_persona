import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function getProfile(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Get user profile
    const user = await User.findById(request.user?.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get profile'
      },
      { status: 500 }
    );
  }
}

async function updateProfile(request: AuthenticatedRequest) {
  try {
    const { name, email } = await request.json();

    await dbConnect();

    // Get user
    const user = await User.findById(request.user?.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Check if email is being updated and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email already exists'
          },
          { status: 409 }
        );
      }
      user.email = email;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update profile'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getProfile, ['user']);
export const PUT = withAuth(updateProfile, ['user']);