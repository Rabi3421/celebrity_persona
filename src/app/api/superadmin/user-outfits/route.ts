// GET  /api/superadmin/user-outfits           → list all (with filter by status)
// PATCH /api/superadmin/user-outfits/[id]     → approve / reject / toggle publish

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// ── GET: list all user outfits ────────────────────────────────────────────────
async function getHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status   = searchParams.get('status') || 'all'; // all | pending | approved | draft
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const q        = searchParams.get('q')?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status === 'pending')  { filter.isPublished = true;  filter.isApproved = false; }
    if (status === 'approved') { filter.isPublished = true;  filter.isApproved = true; }
    if (status === 'draft')    { filter.isPublished = false; }

    if (q) {
      filter.$or = [
        { title:    { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    const skip  = (page - 1) * limit;
    const total = await UserOutfit.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const outfits = await UserOutfit.find(filter)
      .select('-clicks -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email avatar')
      .lean();

    // Count badges
    const pendingCount  = await UserOutfit.countDocuments({ isPublished: true,  isApproved: false });
    const approvedCount = await UserOutfit.countDocuments({ isPublished: true,  isApproved: true  });
    const draftCount    = await UserOutfit.countDocuments({ isPublished: false });

    return NextResponse.json({
      success: true,
      outfits,
      page, pages, total,
      counts: { pending: pendingCount, approved: approvedCount, draft: draftCount },
    });
  } catch (err: any) {
    console.error('[superadmin/user-outfits GET]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, ['superadmin', 'admin']);
