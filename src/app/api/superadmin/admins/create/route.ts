// /api/admin/create — create a new admin account (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create admin — password hashing is handled by the User model pre-save hook
    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin account created successfully',
        admin: {
          id: String(newAdmin._id),
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          isActive: newAdmin.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create admin error:', error);
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler, ['superadmin']);
