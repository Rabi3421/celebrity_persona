// /api/superadmin/users/[id] — GET / PUT / DELETE for a single user (superadmin only)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest, { params }: any) {
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  try {
    await dbConnect();

    if (request.method === 'GET') {
      const user = await User.findById(id)
        .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
        .lean();
      if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      const obj: any = { ...user };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    if (request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));

      // Superadmin accounts: only password update is allowed
      const targetUser = await User.findById(id).select('role').lean() as any;
      const isSuperadmin = targetUser?.role === 'superadmin';
      if (isSuperadmin && !body.newPassword) {
        return NextResponse.json({ success: false, message: 'Only password updates are permitted for superadmin accounts' }, { status: 403 });
      }
      if (isSuperadmin && body.role && body.role !== 'superadmin') {
        return NextResponse.json({ success: false, message: 'Cannot change role of a superadmin account' }, { status: 403 });
      }

      const allowed: Record<string, boolean> = { name: true, email: true, role: true, isActive: true, lastLogin: true };
      // For superadmin: only allow password field (handled below), no profile fields
      const update: any = {};
      if (!isSuperadmin) {
        for (const key of Object.keys(body || {})) {
          if (allowed[key]) update[key] = body[key];
        }
      }
      // Prevent role escalation mistakes: ensure role is valid if provided
      if (update.role && !['user', 'admin', 'superadmin'].includes(update.role)) {
        return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
      }
      // Handle password update separately (needs hashing)
      if (body.newPassword) {
        if (typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
          return NextResponse.json({ success: false, message: 'New password must be at least 6 characters' }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(12);
        update.password = await bcrypt.hash(body.newPassword, salt);
      }

      const updated = await User.findByIdAndUpdate(id, update, { new: true })
        .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
        .lean();
      if (!updated) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      const obj: any = { ...updated };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    if (request.method === 'DELETE') {
      const toDelete = await User.findById(id).select('role').lean() as any;
      if (!toDelete) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      if (toDelete.role === 'superadmin') {
        return NextResponse.json({ success: false, message: 'Superadmin accounts cannot be deleted' }, { status: 403 });
      }
      await User.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'User deleted' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('User id CRUD error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
export const PUT = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
