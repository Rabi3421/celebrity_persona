import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET all movies
async function getMovies(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const director = searchParams.get('director');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    await dbConnect();

    // Build query
    const query: any = {};

    if (genre) {
      query.genre = { $in: [genre] };
    }

    if (status && ['UPCOMING', 'IN_THEATERS', 'STREAMING', 'COMPLETED'].includes(status)) {
      query.status = status;
    }

    if (director) {
      query.director = { $regex: director, $options: 'i' };
    }

    if (typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }

    // Get movies with pagination
    const skip = (page - 1) * limit;
    const movies = await Movie.find(query)
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Movie.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          movies,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get movies error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get movies'
      },
      { status: 500 }
    );
  }
}

// CREATE new movie
async function createMovie(request: AuthenticatedRequest) {
  try {
    const {
      title,
      description,
      synopsis,
      director,
      genre,
      releaseDate,
      duration,
      poster,
      posterAlt,
      backdrop,
      backdropAlt,
      trailer,
      cast,
      ratings,
      budget,
      boxOffice,
      language,
      country,
      productionCompany,
      status
    } = await request.json();

    // Validate required fields
    if (!title || !description || !synopsis || !director || !genre || !releaseDate || !duration || !poster || !posterAlt || !backdrop || !backdropAlt || !language || !country || !status) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title, description, synopsis, director, genre, releaseDate, duration, poster, posterAlt, backdrop, backdropAlt, language, country, and status are required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let counter = 1;
    let originalSlug = slug;
    while (await Movie.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create movie
    const movie = new Movie({
      title,
      slug,
      description,
      synopsis,
      director,
      genre: Array.isArray(genre) ? genre : [genre],
      releaseDate: new Date(releaseDate),
      duration,
      poster,
      posterAlt,
      backdrop,
      backdropAlt,
      trailer,
      cast: cast || [],
      ratings: ratings || {
        imdb: { score: 0, votes: '0' },
        rottenTomatoes: { critics: 0, audience: 0 },
        aggregated: 0
      },
      budget,
      boxOffice,
      language,
      country,
      productionCompany: Array.isArray(productionCompany) ? productionCompany : [productionCompany],
      status,
      isActive: true,
    });

    await movie.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Movie created successfully',
        data: movie
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create movie error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create movie'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMovies, ['superadmin', 'admin']);
export const POST = withAuth(createMovie, ['superadmin', 'admin']);