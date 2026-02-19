// /api/superadmin/all-users — returns ALL users regardless of role (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function handler(_request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const users = await User.find({})
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
      .sort({ role: 1, createdAt: -1 })
      .lean();

    const sanitized = users.map((u: any) => {
      const obj = { ...u };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    const counts = {
      user: sanitized.filter((u) => u.role === 'user').length,
      admin: sanitized.filter((u) => u.role === 'admin').length,
      superadmin: sanitized.filter((u) => u.role === 'superadmin').length,
    };

    return NextResponse.json({ success: true, data: sanitized, counts });
  } catch (error: any) {
    console.error('Superadmin all-users error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['superadmin']);
