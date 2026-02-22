import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';

// ── API Key guard ─────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.X_API_KEY;
}

// ── GET /api/user/outfits ─────────────────────────────────────────────────────
// Query params:
//   q         - search by title / designer / brand / tags
//   category  - filter by category (case-insensitive)
//   event     - filter by event string
//   brand     - filter by brand string
//   featured  - "true" → only featured outfits
//   sort      - "latest" (default) | "oldest" | "featured"
//   page      - 1-based (default 1)
//   limit     - results per page (default 12, max 50)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing x-api-key' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '12', 10));
    const q        = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();
    const event    = searchParams.get('event')?.trim();
    const brand    = searchParams.get('brand')?.trim();
    const featured = searchParams.get('featured');
    const sort     = searchParams.get('sort') || 'latest';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isActive: true };

    if (q) {
      filter.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { designer:    { $regex: q, $options: 'i' } },
        { brand:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags:        { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') filter.category = { $regex: category, $options: 'i' };
    if (event    && event    !== 'all') filter.event    = { $regex: event,    $options: 'i' };
    if (brand    && brand    !== 'all') filter.brand    = { $regex: brand,    $options: 'i' };
    if (featured === 'true') filter.isFeatured = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === 'oldest')  sortOption = { createdAt: 1 };
    if (sort === 'featured') sortOption = { isFeatured: -1, createdAt: -1 };

    const skip  = (page - 1) * limit;
    const total = await CelebrityOutfit.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await CelebrityOutfit.find(filter)
      .select('-__v -seo') // exclude heavy SEO blob for listing
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('celebrity', 'name slug profileImage')
      .lean();

    // Normalise _id → id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalised = data.map((d: any) => {
      const obj = { ...d, id: String(d._id) };
      delete obj._id;
      return obj;
    });

    return NextResponse.json({ success: true, data: normalised, total, page, limit, pages });
  } catch (err: any) {
    console.error('GET /api/user/outfits error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
