// GET  /api/user-outfits          → public list (x-api-key)
// POST /api/user-outfits          → create (Bearer token)

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

function isApiKeyValid(req: NextRequest): boolean {
  return req.headers.get('x-api-key') === process.env.X_API_KEY;
}

// ── GET: public listing ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isApiKeyValid(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '12', 10));
    const q        = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();
    const userId   = searchParams.get('userId')?.trim();
    const sort     = searchParams.get('sort') || 'latest';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isPublished: true, isApproved: true };

    if (q) {
      filter.$or = [
        { title:    { $regex: q, $options: 'i' } },
        { brand:    { $regex: q, $options: 'i' } },
        { tags:     { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') filter.category = { $regex: category, $options: 'i' };
    if (userId) filter.userId = userId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === 'oldest')   sortOption = { createdAt: 1 };
    if (sort === 'popular')  sortOption = { views: -1, createdAt: -1 };
    if (sort === 'liked')    sortOption = { 'likes': -1, createdAt: -1 };

    const skip  = (page - 1) * limit;
    const total = await UserOutfit.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await UserOutfit.find(filter)
      .select('-clicks -__v')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar')
      .lean();

    return NextResponse.json({
      success: true,
      data,
      page,
      pages,
      total,
    });
  } catch (err: any) {
    console.error('[user-outfits GET]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ── POST: create outfit (auth required) ───────────────────────────────────────
async function postHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const userId = request.user!.userId;

    const {
      title, description, images,
      purchaseLink, purchasePrice, store,
      tags, category, brand, size, color,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }
    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one image is required' }, { status: 400 });
    }

    const outfit = await UserOutfit.create({
      userId,
      title: title.trim(),
      description: description?.trim(),
      images,
      purchaseLink: purchaseLink?.trim(),
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      store: store?.trim(),
      tags: Array.isArray(tags) ? tags : [],
      category: category || 'casual',
      brand: brand?.trim(),
      size: size?.trim(),
      color: color?.trim(),
      isPublished: true,   // immediately submitted for review (pending)
      isApproved: false,
    });

    return NextResponse.json({ success: true, outfit }, { status: 201 });
  } catch (err: any) {
    console.error('[user-outfits POST]', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(postHandler, ['user', 'admin', 'superadmin']);
