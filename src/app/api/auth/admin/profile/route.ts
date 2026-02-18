import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Get admin profile
    const admin = await User.findById(request.user?.userId);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get admin profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get profile'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['admin']);