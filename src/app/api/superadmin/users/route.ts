// /api/superadmin/users — returns list of user ids (role === 'user')
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Return full user objects for role 'user', but sanitize sensitive fields
    const users = await User.find({ role: 'user' })
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
      .lean();

    const sanitized = users.map((u: any) => {
      const obj = { ...u };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Superadmin users ids error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to fetch user ids' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
