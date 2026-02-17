import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      return NextResponse.json(
        { message: 'SuperAdmin already exists' },
        { status: 409 }
      );
    }

    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@celebritypersona.com';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!';

    // Create SuperAdmin account
    const superAdmin = new User({
      name: 'SuperAdmin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'superadmin',
    });

    await superAdmin.save();

    return NextResponse.json(
      {
        message: 'SuperAdmin account created successfully',
        email: superAdminEmail,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('SuperAdmin initialization error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'SuperAdmin with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create SuperAdmin account' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    // Check if SuperAdmin exists
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('name email createdAt');
    
    if (superAdmin) {
      return NextResponse.json(
        {
          exists: true,
          superAdmin: {
            name: superAdmin.name,
            email: superAdmin.email,
            createdAt: superAdmin.createdAt,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('SuperAdmin check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}