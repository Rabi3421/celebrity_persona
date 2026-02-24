// PATCH /api/superadmin/user-outfits/[id]  → approve | reject | toggle publish

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function patchHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const body = await request.json();
    const { action } = body; // 'approve' | 'reject' | 'publish' | 'unpublish'

    const outfit = await UserOutfit.findById(id);
    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    }

    if (action === 'approve') {
      outfit.isApproved  = true;
      outfit.isPublished = true;
    } else if (action === 'reject') {
      outfit.isApproved  = false;
      outfit.isPublished = false;
    } else if (action === 'publish') {
      outfit.isPublished = true;
    } else if (action === 'unpublish') {
      outfit.isPublished = false;
      outfit.isApproved  = false;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await UserOutfit.updateOne(
      { _id: id },
      { $set: { isApproved: outfit.isApproved, isPublished: outfit.isPublished } }
    );

    return NextResponse.json({ success: true, message: `Outfit ${action}d successfully` });
  } catch (err: any) {
    console.error('[superadmin/user-outfits/:id PATCH]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const PATCH = withAuth(patchHandler, ['superadmin', 'admin']);
