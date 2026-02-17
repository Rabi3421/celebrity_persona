import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, password, specialKey } = await request.json();

    // Validate special key
    if (specialKey !== process.env.SUPERADMIN_SPECIAL_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid special key. Unauthorized operation.'
        },
        { status: 403 }
      );
    }

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

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'SuperAdmin already exists. Only one SuperAdmin is allowed.'
        },
        { status: 409 }
      );
    }

    // Check if email already exists
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

    // Create superadmin
    const superAdmin = new User({
      name: 'Super Administrator',
      email,
      password,
      role: 'superadmin',
      isActive: true,
    });

    await superAdmin.save();

    return NextResponse.json(
      {
        success: true,
        message: 'SuperAdmin created successfully',
        data: {
          id: superAdmin._id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create SuperAdmin error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create SuperAdmin'
      },
      { status: 500 }
    );
  }
}