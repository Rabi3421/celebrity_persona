// /api/superadmin/admins — returns list of admin ids (role === 'admin')
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Return full admin objects for role 'admin', but sanitize sensitive fields
    const admins = await User.find({ role: 'admin' })
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
      .lean();

    const sanitized = admins.map((a: any) => {
      const obj = { ...a };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Superadmin admin ids error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to fetch admin ids' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
