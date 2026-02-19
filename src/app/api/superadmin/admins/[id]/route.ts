// /api/superadmin/admins/[id] — GET / PUT / DELETE for a single admin (superadmin only)
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
      const admin = await User.findById(id)
        .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires')
        .lean();
      if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
      const obj: any = { ...admin };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    if (request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const allowed: Record<string, boolean> = { name: true, email: true, role: true, isActive: true, lastLogin: true };
      const update: any = {};
      for (const key of Object.keys(body || {})) {
        if (allowed[key]) update[key] = body[key];
      }
      // Validate role if provided (admins may be promoted/demoted)
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
      if (!updated) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
      const obj: any = { ...updated };
      obj.id = obj._id ? String(obj._id) : undefined;
      delete obj._id; delete obj.__v;
      return NextResponse.json({ success: true, data: obj });
    }

    if (request.method === 'DELETE') {
      const removed = await User.findByIdAndDelete(id).lean();
      if (!removed) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Admin deleted' });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin id CRUD error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
export const PUT = withAuth(handler, ['superadmin']);
export const DELETE = withAuth(handler, ['superadmin']);
