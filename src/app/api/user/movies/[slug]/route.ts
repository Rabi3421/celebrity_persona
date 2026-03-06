import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import mongoose from 'mongoose';

// ── API Key guard ─────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key');
  return key === process.env.X_API_KEY;
}

// ── GET /api/user/movies/[slug] ───────────────────────────────────────────────
// Accepts either a URL slug (e.g. "dhurandhar-the-revenge") or a MongoDB _id.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing x-api-key' },
      { status: 401 }
    );
  }

  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { success: false, message: 'Movie slug or id is required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Try by slug first; fall back to _id if slug looks like a valid ObjectId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let movie: any = await Movie.findOne({ slug }).select('-__v').lean();

    if (!movie && mongoose.isValidObjectId(slug)) {
      movie = await Movie.findById(slug).select('-__v').lean();
    }

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: movie });
  } catch (error) {
    console.error('[GET /api/user/movies/[slug]]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch movie' },
      { status: 500 }
    );
  }
}
