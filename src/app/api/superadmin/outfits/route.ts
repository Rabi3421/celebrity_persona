// /api/superadmin/outfits — GET paginated list + POST create (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import {
  normalizeOutfitPayload,
  serializeOutfit,
  validateOutfitPayload,
} from '@/lib/celebrityOutfits';
import '@/models/Celebrity';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q = (searchParams.get('q') || '').trim();
      const brand = searchParams.get('brand') || '';
      const designer = searchParams.get('designer') || '';
      const category = searchParams.get('category') || '';
      const outfitType = searchParams.get('outfitType') || '';
      const event = searchParams.get('event') || '';
      const celebrity = searchParams.get('celebrity') || '';
      const active = searchParams.get('isActive');
      const featured = searchParams.get('isFeatured');
      const trending = searchParams.get('isTrending');
      const editorPick = searchParams.get('isEditorPick');
      const status = searchParams.get('status') || '';

      const filter: Record<string, any> = {};
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
      if (and.length) filter.$and = and;
      if (brand) filter.brand = { $regex: brand, $options: 'i' };
      if (designer) filter.designer = { $regex: designer, $options: 'i' };
      if (category) filter.category = { $regex: category, $options: 'i' };
      if (outfitType) filter.outfitType = { $regex: outfitType, $options: 'i' };
      if (celebrity) filter.primaryCelebritySlug = celebrity;
      if (active === 'true') filter.isActive = true;
      if (active === 'false') filter.isActive = false;
      if (featured === 'true') filter.isFeatured = true;
      if (featured === 'false') filter.isFeatured = false;
      if (trending === 'true') filter.isTrending = true;
      if (trending === 'false') filter.isTrending = false;
      if (editorPick === 'true') filter.isEditorPick = true;
      if (editorPick === 'false') filter.isEditorPick = false;
      if (status) filter.status = status;

      const [total, docs] = await Promise.all([
        CelebrityOutfit.countDocuments(filter),
        CelebrityOutfit.find(filter)
          .select('-__v')
          .populate('celebrity primaryCelebrity', 'name slug profileImage')
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      return NextResponse.json({
        success: true,
        data: docs.map((doc: any) => serializeOutfit(doc)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    }

    if (request.method === 'POST') {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const payload = normalizeOutfitPayload(body);
      const errors = validateOutfitPayload(payload);
      if (Object.keys(errors).length) {
        return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
      }

      const existing = await CelebrityOutfit.findOne({ slug: payload.slug }).select('_id').lean();
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'An outfit with this slug already exists', errors: { slug: 'Slug must be unique' } },
          { status: 409 }
        );
      }

      const outfit = await CelebrityOutfit.create({ ...payload, likesCount: 0, commentsCount: 0 });
      return NextResponse.json({ success: true, data: serializeOutfit(outfit.toObject()) }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin outfits error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
export const POST = withAuth(handler, ['superadmin']);
