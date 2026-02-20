// /api/superadmin/outfits — GET paginated list + POST create (superadmin only)
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity'; // ensure Celebrity schema is registered for populate

// Auto-generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // ── GET: paginated list ───────────────────────────────────────────────
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page      = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
      const limit     = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
      const q         = (searchParams.get('q') || '').trim();
      const brand     = searchParams.get('brand') || '';
      const category  = searchParams.get('category') || '';
      const event     = searchParams.get('event') || '';
      const active    = searchParams.get('isActive');
      const featured  = searchParams.get('isFeatured');

      const filter: Record<string, any> = {};
      if (q) filter.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand:       { $regex: q, $options: 'i' } },
        { designer:    { $regex: q, $options: 'i' } },
        { tags:        { $regex: q, $options: 'i' } },
      ];
      if (brand)    filter.brand    = { $regex: brand, $options: 'i' };
      if (category) filter.category = { $regex: category, $options: 'i' };
      if (event)    filter.event    = { $regex: event, $options: 'i' };
      if (active   === 'true')  filter.isActive   = true;
      if (active   === 'false') filter.isActive   = false;
      if (featured === 'true')  filter.isFeatured = true;
      if (featured === 'false') filter.isFeatured = false;

      const [total, docs] = await Promise.all([
        CelebrityOutfit.countDocuments(filter),
        CelebrityOutfit.find(filter)
          .select('title slug celebrity images event designer brand category color price purchaseLink tags isActive isFeatured likesCount commentsCount createdAt')
          .populate('celebrity', 'name slug')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      const data = docs.map((d: any) => {
        const obj = { ...d, id: String(d._id) };
        delete obj._id; delete obj.__v;
        return obj;
      });

      return NextResponse.json({
        success: true, data, total, page, limit,
        pages: Math.ceil(total / limit),
      });
    }

    // ── POST: create ─────────────────────────────────────────────────────
    if (request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { title, celebrity, images } = body;

      if (!title || typeof title !== 'string' || !title.trim())
        return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
      if (!celebrity)
        return NextResponse.json({ success: false, message: 'Celebrity ID is required' }, { status: 400 });
      if (!Array.isArray(images) || images.length === 0)
        return NextResponse.json({ success: false, message: 'At least one image URL is required' }, { status: 400 });

      // Generate unique slug
      let slug = body.slug?.trim() || generateSlug(title.trim());
      const existing = await CelebrityOutfit.findOne({ slug }).lean();
      if (existing) slug = `${slug}-${Date.now()}`;

      const outfit = await CelebrityOutfit.create({
        title:        title.trim(),
        slug,
        celebrity,
        images:       images.filter((u: any) => typeof u === 'string' && u.trim()),
        event:        body.event?.trim()        || undefined,
        designer:     body.designer?.trim()     || undefined,
        description:  body.description?.trim()  || undefined,
        tags:         Array.isArray(body.tags)  ? body.tags : [],
        purchaseLink: body.purchaseLink?.trim() || undefined,
        price:        body.price?.trim()        || undefined,
        brand:        body.brand?.trim()        || undefined,
        category:     body.category?.trim()     || undefined,
        color:        body.color?.trim()        || undefined,
        size:         body.size?.trim()         || undefined,
        isActive:     body.isActive  !== false,
        isFeatured:   body.isFeatured === true,
        likesCount:   0,
        commentsCount: 0,
        seo:          body.seo || undefined,
      });

      const obj: any = outfit.toObject();
      obj.id = String(obj._id); delete obj._id; delete obj.__v;

      return NextResponse.json({ success: true, data: obj }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Superadmin outfits error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const GET  = withAuth(handler, ['superadmin']);
export const POST = withAuth(handler, ['superadmin']);
