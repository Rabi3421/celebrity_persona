// GET  /api/user/profile  — fetch current user's full profile
// PATCH /api/user/profile  — update name, bio, location
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// ── GET ───────────────────────────────────────────────────────────────────────
async function getProfile(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const user = await User.findById(request.user?.userId).select(
      'name email bio location avatar role createdAt lastLogin'
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          id:        user._id,
          name:      user.name,
          email:     user.email,
          bio:       user.bio       || '',
          location:  user.location  || '',
          avatar:    user.avatar    || '',
          role:      user.role,
          joinDate:  user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
async function updateProfile(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, bio, location } = body;

    // Validate
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }
    if (bio !== undefined && typeof bio === 'string' && bio.length > 300) {
      return NextResponse.json(
        { success: false, message: 'Bio cannot exceed 300 characters' },
        { status: 400 }
      );
    }
    if (location !== undefined && typeof location === 'string' && location.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Location cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    const updates: Record<string, string> = {};
    if (name     !== undefined) updates.name     = name.trim();
    if (bio      !== undefined) updates.bio      = bio.trim();
    if (location !== undefined) updates.location = location.trim();

    const user = await User.findByIdAndUpdate(
      request.user?.userId,
      { $set: updates },
      { new: true, runValidators: true, strict: false }
    ).select('name email bio location avatar role createdAt lastLogin');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        profile: {
          id:        user._id,
          name:      user.name,
          email:     user.email,
          bio:       user.bio       || '',
          location:  user.location  || '',
          avatar:    user.avatar    || '',
          role:      user.role,
          joinDate:  user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export const GET   = withAuth(getProfile,   ['user', 'admin', 'superadmin']);
export const PATCH = withAuth(updateProfile, ['user', 'admin', 'superadmin']);
