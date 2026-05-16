import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { normalizeOutfitPayload, serializeOutfit, validateOutfitPayload } from '@/lib/celebrityOutfits';

async function getOutfits(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const brand = searchParams.get('brand') || '';
    const category = searchParams.get('category') || '';
    const event = searchParams.get('event') || '';
    const active = searchParams.get('isActive');
    const featured = searchParams.get('isFeatured');

    await dbConnect();

    const query: Record<string, any> = {};
    const and: Record<string, any>[] = [];
    if (q) {
      and.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { outfitDescription: { $regex: q, $options: 'i' } },
          { outfitSummary: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { designer: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      });
    }
    if (event) and.push({ $or: [{ event: { $regex: event, $options: 'i' } }, { eventName: { $regex: event, $options: 'i' } }] });
    if (and.length) query.$and = and;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;
    if (featured === 'true') query.isFeatured = true;
    if (featured === 'false') query.isFeatured = false;

    const skip = (page - 1) * limit;
    const [total, outfits] = await Promise.all([
      CelebrityOutfit.countDocuments(query),
      CelebrityOutfit.find(query)
        .select('-__v')
        .populate('celebrity primaryCelebrity', 'name slug profileImage')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        outfits: outfits.map((outfit: any) => serializeOutfit(outfit)),
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get outfits error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to get outfits' }, { status: 500 });
  }
}

async function createOutfit(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    await dbConnect();

    const payload = normalizeOutfitPayload(body);
    const errors = validateOutfitPayload(payload);
    if (Object.keys(errors).length) {
      return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
    }
    const existing = await CelebrityOutfit.findOne({ slug: payload.slug }).select('_id').lean();
    if (existing) {
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    }

    const outfit = await CelebrityOutfit.create({ ...payload, likesCount: 0, commentsCount: 0 });
    return NextResponse.json({ success: true, message: 'Outfit created successfully', data: serializeOutfit(outfit.toObject()) }, { status: 201 });
  } catch (error: any) {
    console.error('Create outfit error:', error);
    if (error.code === 11000) return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error.message || 'Failed to create outfit' }, { status: 500 });
  }
}

export const GET = withAuth(getOutfits, ['superadmin', 'admin']);
export const POST = withAuth(createOutfit, ['superadmin', 'admin']);
