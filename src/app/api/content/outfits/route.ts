import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity'; // ensure Celebrity schema is registered for populate
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET all outfits
async function getOutfits(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));
    const q        = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const brand    = searchParams.get('brand')    || '';
    const category = searchParams.get('category') || '';
    const event    = searchParams.get('event')    || '';
    const active   = searchParams.get('isActive');
    const featured = searchParams.get('isFeatured');

    await dbConnect();

    const query: Record<string, any> = {};

    if (q) {
      query.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand:       { $regex: q, $options: 'i' } },
        { designer:    { $regex: q, $options: 'i' } },
        { tags:        { $regex: q, $options: 'i' } },
      ];
    }
    if (brand)    query.brand    = { $regex: brand,    $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };
    if (event)    query.event    = { $regex: event,    $options: 'i' };
    if (active   === 'true')  query.isActive   = true;
    if (active   === 'false') query.isActive   = false;
    if (featured === 'true')  query.isFeatured = true;
    if (featured === 'false') query.isFeatured = false;

    const skip  = (page - 1) * limit;
    const total = await CelebrityOutfit.countDocuments(query);
    const outfits = await CelebrityOutfit.find(query)
      .select('title slug celebrity images event designer brand category color price purchaseLink tags isActive isFeatured likesCount commentsCount createdAt')
      .populate('celebrity', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = outfits.map((d: any) => {
      const obj = { ...d, id: String(d._id) };
      delete obj._id; delete obj.__v;
      return obj;
    });

    return NextResponse.json({
      success: true,
      data: {
        outfits: data,
        pagination: {
          current: page,
          pages:   Math.ceil(total / limit),
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

// Generate slug helper
function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

// CREATE new outfit
async function createOutfit(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { title, celebrity, images } = body;

    if (!title)
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    if (!celebrity)
      return NextResponse.json({ success: false, message: 'Celebrity ID is required' }, { status: 400 });
    if (!Array.isArray(images) || images.length === 0)
      return NextResponse.json({ success: false, message: 'At least one image URL is required' }, { status: 400 });

    await dbConnect();

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

    return NextResponse.json({ success: true, message: 'Outfit created successfully', data: obj }, { status: 201 });
  } catch (error: any) {
    console.error('Create outfit error:', error);
    if (error.code === 11000)
      return NextResponse.json({ success: false, message: 'An outfit with this slug already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: error.message || 'Failed to create outfit' }, { status: 500 });
  }
}

export const GET  = withAuth(getOutfits,    ['superadmin', 'admin']);
export const POST = withAuth(createOutfit,  ['superadmin', 'admin']);
