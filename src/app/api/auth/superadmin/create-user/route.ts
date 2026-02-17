import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, email, password, and role are required'
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Role must be either user or admin'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists'
        },
        { status: 409 }
      );
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      isActive: true,
    });

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create user'
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler, ['superadmin']);