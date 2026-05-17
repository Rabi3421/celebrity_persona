import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { withAuth } from '@/lib/authMiddleware';
import {
  serializeMovie,
  slugifyMovie,
  toMovieWritePayload,
  validateMoviePayload,
} from '@/lib/upcomingMovies';

function cleanError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error)
    return String((error as { message: string }).message);
  return 'Something went wrong';
}

async function uniqueSlug(baseSlug: string, currentId?: string) {
  let slug = slugifyMovie(baseSlug);
  if (!slug) slug = `movie-${Date.now()}`;
  const original = slug;
  let counter = 2;

  while (
    await Movie.findOne({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })
      .select('_id')
      .lean()
  ) {
    slug = `${original}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function getHandler(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const q = searchParams.get('q')?.trim();
    const status = searchParams.get('status')?.trim();
    const publishStatus = searchParams.get('publishStatus')?.trim();
    const genre = searchParams.get('genre')?.trim();
    const language = searchParams.get('language')?.trim();
    const releaseYear = searchParams.get('releaseYear')?.trim();
    const ottPlatform = searchParams.get('ottPlatform')?.trim();
    const availabilityStatus = searchParams.get('availabilityStatus')?.trim();
    const featured = searchParams.get('featured');

    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { originalTitle: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { synopsis: { $regex: q, $options: 'i' } },
        { 'leadCast.name': { $regex: q, $options: 'i' } },
        { 'supportingCast.name': { $regex: q, $options: 'i' } },
        { 'director.name': { $regex: q, $options: 'i' } },
        { 'cast.name': { $regex: q, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (publishStatus) filter.publishStatus = publishStatus;
    if (genre)
      filter.$or = [
        ...(filter.$or || []),
        { genres: { $regex: genre, $options: 'i' } },
        { genre: { $regex: genre, $options: 'i' } },
      ];
    if (language)
      filter.$or = [
        ...(filter.$or || []),
        { languages: { $regex: language, $options: 'i' } },
        { language: { $regex: language, $options: 'i' } },
      ];
    if (releaseYear) filter.releaseYear = Number(releaseYear);
    if (ottPlatform) filter.ottPlatform = { $regex: ottPlatform, $options: 'i' };
    if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
    if (featured !== null && featured !== undefined) filter.isFeatured = featured === 'true';

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Movie.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Movie.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: docs.map(serializeMovie),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('[GET /api/superadmin/movies]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch movies' }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const payload = toMovieWritePayload(body);
    payload.slug = await uniqueSlug(payload.slug || payload.title);

    const mode = payload.publishStatus === 'published' ? 'publish' : 'draft';
    const errors = validateMoviePayload(payload, mode);
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, error: 'Please fix the highlighted fields', errors },
        { status: 400 }
      );
    }

    if (payload.publishStatus === 'published' && !payload.publishedAt)
      payload.publishedAt = new Date();
    const movie = await Movie.create(payload);
    return NextResponse.json(
      { success: true, data: serializeMovie(movie.toObject()) },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/superadmin/movies]', error);
    return NextResponse.json(
      { success: false, error: cleanError(error) || 'Failed to create movie' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler, ['superadmin', 'admin']);
export const POST = withAuth(postHandler, ['superadmin']);
