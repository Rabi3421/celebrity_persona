import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Get superadmin profile
    const superAdmin = await User.findById(request.user?.userId);

    if (!superAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'SuperAdmin not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          isActive: superAdmin.isActive,
          lastLogin: superAdmin.lastLogin,
          createdAt: superAdmin.createdAt,
          updatedAt: superAdmin.updatedAt
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get SuperAdmin profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get profile'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['superadmin']);