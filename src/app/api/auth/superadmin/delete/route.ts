import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function DELETE(request: NextRequest) {
  try {
    const { specialKey } = await request.json();

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

    await dbConnect();

    // Find and delete superadmin
    const superAdmin = await User.findOneAndDelete({ role: 'superadmin' });
    
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
        message: 'SuperAdmin deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete SuperAdmin error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete SuperAdmin'
      },
      { status: 500 }
    );
  }
}