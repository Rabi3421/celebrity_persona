import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import TokenService from '@/lib/tokenService';

// Middleware to check if user is SuperAdmin
async function checkSuperAdminAuth(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return { error: 'Not authenticated', status: 401 };
    }

    const decoded = TokenService.verifyRefreshToken(refreshToken);
    await dbConnect();
    
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'superadmin' || !user.refreshTokens.includes(refreshToken)) {
      return { error: 'Unauthorized - SuperAdmin access required', status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check SuperAdmin authentication
    const authCheck = await checkSuperAdminAuth(request);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new admin user
    const newAdmin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
    });

    await newAdmin.save();

    // Return admin data (excluding password)
    const adminResponse = {
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt,
      updatedAt: newAdmin.updatedAt,
    };

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        admin: adminResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create admin error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return NextResponse.json(
        { message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all admin users (SuperAdmin only)
export async function GET(request: NextRequest) {
  try {
    // Check SuperAdmin authentication
    const authCheck = await checkSuperAdminAuth(request);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    await dbConnect();

    // Get all admin users
    const admins = await User.find({ role: 'admin' }).select('-password -refreshTokens');

    return NextResponse.json(
      {
        message: 'Admins fetched successfully',
        admins,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Fetch admins error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}