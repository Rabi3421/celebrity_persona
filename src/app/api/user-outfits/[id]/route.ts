// GET    /api/user-outfits/[id]   → single outfit (public + view tracking)
// PATCH  /api/user-outfits/[id]   → update owner's outfit (auth)
// DELETE /api/user-outfits/[id]   → delete owner's outfit (auth)

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// ── GET: public detail + view / click tracking ────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();

    // find by slug OR _id
    const outfit = await UserOutfit.findOne(
      { $or: [{ slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
    )
      .populate('userId', 'name avatar')
      .lean() as any;

    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    }

    // Only expose publicly if approved+published
    if (!outfit.isApproved || !outfit.isPublished) {
      return NextResponse.json({ success: false, message: 'Outfit not available' }, { status: 404 });
    }

    // Track view + click
    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    await UserOutfit.updateOne(
      { _id: outfit._id },
      {
        $inc: { views: 1 },
        $push: {
          clicks: {
            userAgent:    ua,
            ipAddress:    ip,
            userLocation: 'Unknown',
            timestamp:    new Date(),
          },
        },
      }
    );

    return NextResponse.json({ success: true, outfit: { ...outfit, views: (outfit.views ?? 0) + 1 } });
  } catch (err: any) {
    console.error('[user-outfits/:id GET]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ── PATCH: owner update ───────────────────────────────────────────────────────
async function patchHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const userId = request.user!.userId;

    const outfit = await UserOutfit.findById(id);
    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    if (String(outfit.userId) !== String(userId)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      'title', 'description', 'images', 'purchaseLink', 'purchasePrice',
      'store', 'tags', 'category', 'brand', 'size', 'color', 'isPublished',
    ];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const updated = await UserOutfit.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, outfit: updated });
  } catch (err: any) {
    console.error('[user-outfits/:id PATCH]', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}

// ── DELETE: owner delete ──────────────────────────────────────────────────────
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const userId = request.user!.userId;

    const outfit = await UserOutfit.findById(id);
    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    if (String(outfit.userId) !== String(userId)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await UserOutfit.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    console.error('[user-outfits/:id DELETE]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const PATCH  = withAuth(patchHandler,  ['user', 'admin', 'superadmin']);
export const DELETE = withAuth(deleteHandler, ['user', 'admin', 'superadmin']);
