import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenService } from '@/lib/tokenService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find superadmin
    const superAdmin = await User.findOne({ 
      email, 
      role: 'superadmin',
      isActive: true 
    });

    if (!superAdmin) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: 'If the email exists, a reset token has been generated'
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = TokenService.generateResetToken();
    const hashedToken = TokenService.hashResetToken(resetToken);

    // Save hashed token and expiry (15 minutes)
    superAdmin.resetPasswordToken = hashedToken;
    superAdmin.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await superAdmin.save();

    // In a real app, you would send this via email
    // For now, we'll return it in the response (not recommended for production)
    return NextResponse.json(
      {
        success: true,
        message: 'Reset token generated successfully',
        resetToken // Remove this in production - send via email instead
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('SuperAdmin reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate reset token'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reset token and new password are required'
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

    // Hash the provided token to match with stored hash
    const hashedToken = TokenService.hashResetToken(resetToken);

    // Find superadmin with valid reset token
    const superAdmin = await User.findOne({
      role: 'superadmin',
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!superAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired reset token'
        },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    superAdmin.password = newPassword;
    superAdmin.resetPasswordToken = undefined;
    superAdmin.resetPasswordExpires = undefined;
    superAdmin.refreshTokens = []; // Clear all refresh tokens
    await superAdmin.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('SuperAdmin reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to reset password'
      },
      { status: 500 }
    );
  }
}