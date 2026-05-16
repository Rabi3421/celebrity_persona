import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import Celebrity from '@/models/Celebrity';
import { publicNewsFilter, serializeNews } from '@/lib/celebrityNews';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── API Key guard ─────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.X_API_KEY;
}

// ── GET /api/user/news ────────────────────────────────────────────────────────
// Query params:
//   q         - full-text search (title / excerpt / author)
//   category  - filter by category string (case-insensitive)
//   celebrity - filter by celebrity name (case-insensitive)
//   featured  - "true" → only featured articles
//   sort      - "latest" (default) | "oldest" | "featured"
//   page      - 1-based page number (default 1)
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
    void Celebrity.modelName; // ensure Celebrity schema is registered for populate
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '12', 10));
    const q          = searchParams.get('q')?.trim();
    const category   = searchParams.get('category')?.trim();
    const celebrity  = searchParams.get('celebrity')?.trim();
    const featured   = searchParams.get('featured');
    const sort       = searchParams.get('sort') || 'latest';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = publicNewsFilter();

    if (q) {
      filter.$or = [
        { title:   { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { author:  { $regex: q, $options: 'i' } },
        { authorName: { $regex: q, $options: 'i' } },
        { tags:    { $regex: q, $options: 'i' } },
        { 'seo.contentTags': { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (celebrity) {
      const celebDoc = await Celebrity.findOne({
        $or: [
          { name: { $regex: celebrity, $options: 'i' } },
          { slug: celebrity.toLowerCase() },
        ],
      }).select('_id slug').lean() as { _id: unknown; slug?: string } | null;
      if (celebDoc) {
        filter.$or = [
          { celebrity: celebDoc._id },
          { primaryCelebrity: celebDoc._id },
          { primaryCelebritySlug: celebDoc.slug },
          { 'relatedCelebrities.slug': celebDoc.slug },
        ];
      } else {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, limit, pages: 0 });
      }
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    // Sort strategy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortOption: Record<string, any> = { publishedAt: -1, publishDate: -1, createdAt: -1 }; // latest
    if (sort === 'oldest')  sortOption = { publishedAt: 1, publishDate: 1, createdAt: 1 };
    if (sort === 'featured') sortOption = { isFeatured: -1, featured: -1, publishedAt: -1, publishDate: -1, createdAt: -1 };
    if (sort === 'trending') sortOption = { isTrending: -1, publishedAt: -1, publishDate: -1, createdAt: -1 };
    if (sort === 'breaking') sortOption = { isBreaking: -1, publishedAt: -1, publishDate: -1, createdAt: -1 };

    const skip  = (page - 1) * limit;
    const total = await CelebrityNews.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await CelebrityNews.find(filter)
      .select('-__v -content -seo') // exclude heavy fields for list view
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('celebrity primaryCelebrity', 'name slug profileImage') // attach basic celeb info
      .lean();

    return NextResponse.json({
      success: true,
      data: data.map(serializeNews),
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    console.error('[GET /api/user/news]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
