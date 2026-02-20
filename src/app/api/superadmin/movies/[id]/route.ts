import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { withAuth } from '@/lib/authMiddleware';

const ALLOWED_FIELDS = [
  'title', 'slug', 'releaseDate', 'poster', 'backdrop',
  'language', 'originalLanguage', 'worldwide', 'genre',
  'director', 'writers', 'producers', 'cast', 'synopsis',
  'plotSummary', 'productionNotes', 'status', 'anticipationScore',
  'duration', 'mpaaRating', 'regions', 'subtitles', 'budget',
  'boxOfficeProjection', 'featured', 'images', 'studio',
  'trailer', 'ticketLinks', 'preOrderAvailable', 'seoData',
];

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const movie = await Movie.findById(id).lean();
    if (!movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: movie });
  } catch (error) {
    console.error('[GET /api/superadmin/movies/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch movie' }, { status: 500 });
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    if (update.slug) {
      const clash = await Movie.findOne({ slug: update.slug, _id: { $ne: id } }).lean();
      if (clash) update.slug = `${update.slug}-${Date.now()}`;
    }

    const movie = await Movie.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: movie });
  } catch (error) {
    console.error('[PUT /api/superadmin/movies/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to update movie' }, { status: 500 });
  }
}

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const movie = await Movie.findByIdAndDelete(id).lean();
    if (!movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/superadmin/movies/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete movie' }, { status: 500 });
  }
}

export const GET    = withAuth(getHandler,    ['superadmin', 'admin']);
export const PUT    = withAuth(putHandler,    ['superadmin']);
export const DELETE = withAuth(deleteHandler, ['superadmin']);
