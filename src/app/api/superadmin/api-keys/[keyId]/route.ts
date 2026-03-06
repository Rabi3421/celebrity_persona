/**
 * PATCH /api/superadmin/api-keys/[keyId]  — toggle isActive (revoke / restore)
 * DELETE /api/superadmin/api-keys/[keyId] — permanently delete an API key
 */
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';

// ── PATCH: toggle active ──────────────────────────────────────────────────────
async function patchHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    await dbConnect();
    const { keyId } = await params;
    const { isActive } = await request.json();

    const key = await ApiKey.findById(keyId);
    if (!key) return NextResponse.json({ success: false, message: 'Key not found' }, { status: 404 });

    key.isActive = isActive;
    await key.save();

    return NextResponse.json({
      success: true,
      message: isActive ? 'API key restored.' : 'API key revoked.',
      isActive: key.isActive,
    });
  } catch (error) {
    console.error('Superadmin PATCH api-key error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ── DELETE: permanently remove ────────────────────────────────────────────────
async function deleteHandler(
  _request: AuthenticatedRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    await dbConnect();
    const { keyId } = await params;

    const key = await ApiKey.findByIdAndDelete(keyId);
    if (!key) return NextResponse.json({ success: false, message: 'Key not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'API key permanently deleted.' });
  } catch (error) {
    console.error('Superadmin DELETE api-key error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const PATCH  = withAuth(patchHandler,  ['superadmin']);
export const DELETE = withAuth(deleteHandler, ['superadmin']);
