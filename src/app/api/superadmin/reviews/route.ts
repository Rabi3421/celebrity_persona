import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { withAuth } from '@/lib/authMiddleware';

const ALLOWED_FIELDS = [
  'title', 'slug', 'movieTitle', 'poster', 'backdropImage', 'trailer',
  'rating', 'content', 'excerpt', 'author', 'movieDetails', 'scores',
  'publishDate', 'featured', 'pros', 'cons', 'verdict', 'seoData', 'seo',
];

async function getHandler(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
    const q        = searchParams.get('q')?.trim();
    const featured = searchParams.get('featured');
    const minRating = searchParams.get('minRating');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { title:      { $regex: q, $options: 'i' } },
        { movieTitle: { $regex: q, $options: 'i' } },
        { excerpt:    { $regex: q, $options: 'i' } },
      ];
    }
    if (featured !== null && featured !== undefined && featured !== '') {
      filter.featured = featured === 'true';
    }
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const skip  = (page - 1) * limit;
    const total = await MovieReview.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const data = await MovieReview.find(filter)
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data, total, page, limit, pages });
  } catch (error) {
    console.error('[GET /api/superadmin/reviews]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!body.movieTitle?.trim()) {
      return NextResponse.json({ success: false, error: 'Movie title is required' }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }
    if (body.rating === undefined || body.rating === null) {
      return NextResponse.json({ success: false, error: 'Rating is required' }, { status: 400 });
    }
    if (!body.author?.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Author name is required' }, { status: 400 });
    }

    // Auto-generate slug if not provided
    let finalSlug = body.slug?.trim();
    if (!finalSlug) {
      finalSlug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    const existing = await MovieReview.findOne({ slug: finalSlug }).lean();
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: Record<string, any> = { slug: finalSlug };
    for (const field of ALLOWED_FIELDS) {
      if (field !== 'slug' && field in body) doc[field] = body[field];
    }
    doc.title = body.title.trim();
    if (!('featured' in doc)) doc.featured = false;

    const review = await MovieReview.create(doc);
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/superadmin/reviews]', error);
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
  }
}

export const GET  = withAuth(getHandler,  ['superadmin', 'admin']);
export const POST = withAuth(postHandler, ['superadmin']);
