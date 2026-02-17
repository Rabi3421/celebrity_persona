import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password and new password are required'
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 6 characters long'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get admin with password
    const admin = await User.findById(request.user?.userId).select('+password');

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin not found'
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await admin.comparePassword(currentPassword);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect'
        },
        { status: 400 }
      );
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password updated successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update admin password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update password'
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handler, ['admin']);