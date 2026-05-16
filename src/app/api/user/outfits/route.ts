import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { publicOutfitFilter, serializeOutfit } from '@/lib/celebrityOutfits';
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
//   celebrity - filter by populated celebrity name (case-insensitive)
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
    const q          = searchParams.get('q')?.trim();
    const category   = searchParams.get('category')?.trim();
    const event      = searchParams.get('event')?.trim();
    const outfitType = searchParams.get('outfitType')?.trim();
    const designer   = searchParams.get('designer')?.trim();
    const brand      = searchParams.get('brand')?.trim();
    const celebrity  = searchParams.get('celebrity')?.trim();
    const featured   = searchParams.get('featured');
    const trending   = searchParams.get('trending');
    const editorPick = searchParams.get('editorPick');
    const sort       = searchParams.get('sort') || 'latest';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = publicOutfitFilter();

    if (q) {
      filter.$and.push({
        $or: [
          { title:       { $regex: q, $options: 'i' } },
          { designer:    { $regex: q, $options: 'i' } },
          { brand:       { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { outfitDescription: { $regex: q, $options: 'i' } },
          { outfitSummary: { $regex: q, $options: 'i' } },
          { tags:        { $regex: q, $options: 'i' } },
        ],
      });
    }
    if (category && category !== 'all') filter.category = { $regex: category, $options: 'i' };
    if (event    && event    !== 'all') filter.$and.push({ $or: [{ event: { $regex: event, $options: 'i' } }, { eventName: { $regex: event, $options: 'i' } }] });
    if (outfitType && outfitType !== 'all') filter.outfitType = { $regex: outfitType, $options: 'i' };
    if (brand    && brand    !== 'all') filter.brand    = { $regex: brand,    $options: 'i' };
    if (designer && designer !== 'all') filter.designer = { $regex: designer, $options: 'i' };
    if (featured === 'true') filter.isFeatured = true;
    if (trending === 'true') filter.isTrending = true;
    if (editorPick === 'true') filter.isEditorPick = true;

    // Filter by celebrity name via lookup
    if (celebrity) {
      const { default: Celebrity } = await import('@/models/Celebrity');
      const celebDoc = await Celebrity.findOne({ name: { $regex: celebrity, $options: 'i' } }).select('_id').lean() as { _id: unknown } | null;
      if (celebDoc) {
        filter.$or = [{ celebrity: celebDoc._id }, { primaryCelebrity: celebDoc._id }, { primaryCelebritySlug: celebrity }];
      } else {
        // No matching celebrity — return empty
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, limit, pages: 0 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === 'oldest')  sortOption = { createdAt: 1 };
    if (sort === 'featured') sortOption = { isFeatured: -1, createdAt: -1 };
    if (sort === 'trending') sortOption = { isTrending: -1, publishedAt: -1, createdAt: -1 };
    if (sort === 'editor-picks') sortOption = { isEditorPick: -1, publishedAt: -1, createdAt: -1 };

    const skip  = (page - 1) * limit;
    const total = await CelebrityOutfit.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await CelebrityOutfit.find(filter)
      .select('-__v -seo') // exclude heavy SEO blob for listing
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();

    // Normalise _id → id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalised = data.map((d: any) => serializeOutfit(d));

    return NextResponse.json({ success: true, data: normalised, total, page, limit, pages });
  } catch (err: any) {
    console.error('GET /api/user/outfits error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
