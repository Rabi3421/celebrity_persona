import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import Movie from '@/models/Movie';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET all movie reviews
async function getMovieReviews(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const movieId = searchParams.get('movieId');
    const reviewerType = searchParams.get('reviewerType');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    await dbConnect();

    // Build query
    const query: any = {};

    if (movieId) {
      query.movie = movieId;
    }

    if (reviewerType && ['USER', 'CRITIC', 'CELEBRITY'].includes(reviewerType)) {
      query.reviewerType = reviewerType;
    }

    if (minRating) {
      query.rating = { ...query.rating, $gte: parseFloat(minRating) };
    }

    if (maxRating) {
      query.rating = { ...query.rating, $lte: parseFloat(maxRating) };
    }

    if (typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { reviewerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await MovieReview.find(query)
      .populate('movie', 'title poster slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MovieReview.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          reviews,
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
    console.error('Get movie reviews error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get movie reviews'
      },
      { status: 500 }
    );
  }
}

// CREATE new movie review
async function createMovieReview(request: AuthenticatedRequest) {
  try {
    const {
      movie,
      title,
      content,
      rating,
      reviewerType,
      reviewerName,
      reviewerAvatar,
      pros,
      cons
    } = await request.json();

    // Validate required fields
    if (!movie || !title || !content || rating === undefined || !reviewerType || !reviewerName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie, title, content, rating, reviewerType, and reviewerName are required'
        },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rating must be between 1 and 10'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if movie exists
    const movieExists = await Movie.findById(movie);
    if (!movieExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie not found'
        },
        { status: 404 }
      );
    }

    // Create review
    const review = new MovieReview({
      movie,
      title,
      content,
      rating,
      reviewerType,
      reviewerName,
      reviewerAvatar,
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      isActive: true
    });

    await review.save();

    // Populate movie details before returning
    await review.populate('movie', 'title poster slug');

    return NextResponse.json(
      {
        success: true,
        message: 'Movie review created successfully',
        data: review
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create movie review error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create movie review'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMovieReviews, ['superadmin', 'admin']);
export const POST = withAuth(createMovieReview, ['superadmin', 'admin']);