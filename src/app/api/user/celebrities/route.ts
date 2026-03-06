import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

// ── API Key guard ─────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.X_API_KEY;
}

// ── GET /api/user/celebrities ─────────────────────────────────────────────────
// Query params:
//   q          - search by name / occupation / tags
//   category   - filter by category (movie | fashion | music | sports)
//   featured   - "true" → only featured celebrities
//   sort       - "popular" (default) | "latest" | "oldest" | "name"
//   page       - 1-based (default 1)
//   limit      - results per page (default 12, max 50)
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
    const featured = searchParams.get('featured');
    const sort     = searchParams.get('sort') || 'popular';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      isActive: true,
      $or: [{ status: { $exists: false } }, { status: 'published' }],
    };

    if (q) {
      filter.$and = [
        {
          $or: [
            { name:       { $regex: q, $options: 'i' } },
            { occupation: { $regex: q, $options: 'i' } },
            { tags:       { $regex: q, $options: 'i' } },
            { nationality:{ $regex: q, $options: 'i' } },
          ],
        },
      ];
      // remove the top-level $or so it doesn't conflict
      delete filter.$or;
    }

    if (category && category !== 'all') {
      filter.categories = { $regex: category, $options: 'i' };
    }

    if (featured === 'true') filter.isFeatured = true;

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortObj: Record<string, any> = { popularityScore: -1, viewCount: -1 };
    if (sort === 'latest') sortObj = { createdAt: -1 };
    else if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'name') sortObj = { name: 1 };

    const skip  = (page - 1) * limit;
    const total = await Celebrity.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const docs = await Celebrity.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select(
        'name slug occupation categories tags profileImage coverImage ' +
        'popularityScore viewCount isFeatured isVerified movies ' +
        'socialMedia netWorth nationality yearsActive introduction'
      )
      .lean();

    const celebrities = docs.map((d) => ({
      id:         (d._id as { toString(): string }).toString(),
      name:       d.name,
      slug:       d.slug,
      // occupation array → single readable string
      profession: Array.isArray(d.occupation) ? d.occupation.join(' & ') : (d.occupation || ''),
      // derive a category label from categories array
      category: deriveCategory(d.categories as string[]),
      profileImage: d.profileImage || '',
      coverImage:   d.coverImage   || '',
      isFeatured:   d.isFeatured   || false,
      isVerified:   d.isVerified   || false,
      popularityScore: d.popularityScore || 0,
      viewCount:    d.viewCount    || 0,
      netWorth:     d.netWorth     || '',
      nationality:  d.nationality  || '',
      yearsActive:  d.yearsActive  || '',
      // count movies
      movieCount:  Array.isArray(d.movies) ? (d.movies as unknown[]).length : 0,
      // social followers placeholder — real count would require a separate service
      socialMedia:  d.socialMedia  || {},
      introduction: stripApiHtml(d.introduction || '').slice(0, 280),
    }));

    return NextResponse.json({
      success:    true,
      celebrities,
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error('[GET /api/user/celebrities]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Strip HTML tags + decode common entities for API output */
function stripApiHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function deriveCategory(cats: string[] = []): string {
  const c = cats.map((x) => x.toLowerCase()).join(' ');
  if (/sport|athletic|tennis|football|basketball|cricket/.test(c)) return 'sports';
  if (/music|singer|rapper|dj|artist/.test(c)) return 'music';
  if (/fashion|model|designer|style/.test(c)) return 'fashion';
  return 'movie'; // default
}
