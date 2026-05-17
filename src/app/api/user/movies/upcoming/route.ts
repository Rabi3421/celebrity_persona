import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { serializeMovie, upcomingMovieQuery } from '@/lib/upcomingMovies';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key');
  return !process.env.X_API_KEY || key === process.env.X_API_KEY;
}

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const q = searchParams.get('q')?.trim();
    const genre = searchParams.get('genre')?.trim();
    const language = searchParams.get('language')?.trim();
    const releaseYear = searchParams.get('releaseYear')?.trim();
    const ottPlatform = searchParams.get('ottPlatform')?.trim();
    const availabilityStatus = searchParams.get('availabilityStatus')?.trim();
    const celebrity = searchParams.get('celebrity')?.trim();
    const director = searchParams.get('director')?.trim();
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const editorPick = searchParams.get('editorPick');
    const sort = searchParams.get('sort') || 'latest';

    const filter: Record<string, any> = upcomingMovieQuery();

    if (q) {
      filter.$and.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { originalTitle: { $regex: q, $options: 'i' } },
          { 'leadCast.name': { $regex: q, $options: 'i' } },
          { 'supportingCast.name': { $regex: q, $options: 'i' } },
          { 'director.name': { $regex: q, $options: 'i' } },
          { 'cast.name': { $regex: q, $options: 'i' } },
          { synopsis: { $regex: q, $options: 'i' } },
        ],
      });
    }
    if (genre && genre !== 'all')
      filter.$and.push({
        $or: [
          { genres: { $regex: genre, $options: 'i' } },
          { genre: { $regex: genre, $options: 'i' } },
        ],
      });
    if (language && language !== 'all')
      filter.$and.push({
        $or: [
          { languages: { $regex: language, $options: 'i' } },
          { language: { $regex: language, $options: 'i' } },
        ],
      });
    if (releaseYear && releaseYear !== 'all')
      filter.$and.push({ releaseYear: Number(releaseYear) });
    if (ottPlatform && ottPlatform !== 'all')
      filter.$and.push({ ottPlatform: { $regex: ottPlatform, $options: 'i' } });
    if (availabilityStatus && availabilityStatus !== 'all')
      filter.$and.push({ availabilityStatus });
    if (celebrity)
      filter.$and.push({
        $or: [
          { 'leadCast.slug': celebrity },
          { 'leadCast.name': { $regex: celebrity, $options: 'i' } },
          { 'cast.name': { $regex: celebrity, $options: 'i' } },
        ],
      });
    if (director)
      filter.$and.push({
        $or: [
          { 'director.slug': director },
          { 'director.name': { $regex: director, $options: 'i' } },
        ],
      });
    if (featured === 'true') filter.$and.push({ $or: [{ isFeatured: true }, { featured: true }] });
    if (trending === 'true') filter.$and.push({ isTrending: true });
    if (editorPick === 'true') filter.$and.push({ isEditorPick: true });

    let sortOption: Record<string, any> = { publishedAt: -1, createdAt: -1 };
    if (sort === 'release') sortOption = { releaseDate: 1, releaseYear: 1, createdAt: -1 };
    if (sort === 'trending') sortOption = { isTrending: -1, publishedAt: -1, createdAt: -1 };
    if (sort === 'featured')
      sortOption = { isFeatured: -1, featured: -1, publishedAt: -1, createdAt: -1 };

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Movie.find(filter)
        .select('-__v -likes -saves -comments')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
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
    console.error('[GET /api/user/movies/upcoming]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch upcoming movies' },
      { status: 500 }
    );
  }
}
