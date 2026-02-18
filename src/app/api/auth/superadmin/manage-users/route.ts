import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function getAllUsers(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    await dbConnect();

    // Build query - always exclude superadmin
    const query: any = { role: { $ne: 'superadmin' } };

    // If specific role is requested, filter by that role (but still exclude superadmin)
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password -refreshTokens -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          users,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get users'
      },
      { status: 500 }
    );
  }
}

async function updateUser(request: AuthenticatedRequest) {
  try {
    const { userId, name, email, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Prevent modifying superadmin
    if (user.role === 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot modify superadmin account'
        },
        { status: 403 }
      );
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update user'
      },
      { status: 500 }
    );
  }
}

async function deleteUser(request: AuthenticatedRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Prevent deleting superadmin
    if (user.role === 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete superadmin account'
        },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete user'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAllUsers, ['superadmin']);
export const PUT = withAuth(updateUser, ['superadmin']);
export const DELETE = withAuth(deleteUser, ['superadmin']);