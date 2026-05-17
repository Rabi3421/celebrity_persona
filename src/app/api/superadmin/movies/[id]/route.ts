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

async function uniqueSlug(baseSlug: string, currentId: string) {
  let slug = slugifyMovie(baseSlug);
  if (!slug) slug = `movie-${Date.now()}`;
  const original = slug;
  let counter = 2;

  while (
    await Movie.findOne({ slug, _id: { $ne: currentId } })
      .select('_id')
      .lean()
  ) {
    slug = `${original}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function getHandler(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const movie = await Movie.findById(id).lean();
    if (!movie)
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeMovie(movie) });
  } catch (error) {
    console.error('[GET /api/superadmin/movies/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch movie' }, { status: 500 });
  }
}

async function putHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const payload = toMovieWritePayload(body);
    payload.slug = await uniqueSlug(payload.slug || payload.title, id);

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

    const movie = await Movie.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();
    if (!movie)
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeMovie(movie) });
  } catch (error) {
    console.error('[PUT /api/superadmin/movies/[id]]', error);
    return NextResponse.json(
      { success: false, error: cleanError(error) || 'Failed to update movie' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';
    const movie = hard
      ? await Movie.findByIdAndDelete(id).lean()
      : await Movie.findByIdAndUpdate(
          id,
          { $set: { publishStatus: 'archived' } },
          { new: true }
        ).lean();

    if (!movie)
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    return NextResponse.json({
      success: true,
      message: hard ? 'Movie deleted successfully' : 'Movie archived successfully',
      data: hard ? undefined : serializeMovie(movie),
    });
  } catch (error) {
    console.error('[DELETE /api/superadmin/movies/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to archive movie' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, ['superadmin', 'admin']);
export const PUT = withAuth(putHandler, ['superadmin']);
export const DELETE = withAuth(deleteHandler, ['superadmin']);
