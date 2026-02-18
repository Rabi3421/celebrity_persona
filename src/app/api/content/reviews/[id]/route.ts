import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import Movie from '@/models/Movie';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET single movie review
async function getMovieReview(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const review = await MovieReview.findById(params.id)
      .populate('movie', 'title poster slug');

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie review not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: review
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get movie review error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get movie review'
      },
      { status: 500 }
    );
  }
}

// UPDATE movie review
async function updateMovieReview(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    await dbConnect();

    const review = await MovieReview.findById(params.id);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie review not found'
        },
        { status: 404 }
      );
    }

    // Validate rating if being updated
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 10)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rating must be between 1 and 10'
        },
        { status: 400 }
      );
    }

    // Check if movie exists if being updated
    if (updates.movie) {
      const movieExists = await Movie.findById(updates.movie);
      if (!movieExists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Movie not found'
          },
          { status: 404 }
        );
      }
    }

    // Handle arrays properly
    if (updates.pros && !Array.isArray(updates.pros)) {
      updates.pros = [];
    }

    if (updates.cons && !Array.isArray(updates.cons)) {
      updates.cons = [];
    }

    // Update last modified
    updates.updatedAt = new Date();

    const updatedReview = await MovieReview.findByIdAndUpdate(
      params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('movie', 'title poster slug');

    return NextResponse.json(
      {
        success: true,
        message: 'Movie review updated successfully',
        data: updatedReview
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update movie review error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update movie review'
      },
      { status: 500 }
    );
  }
}

// DELETE movie review
async function deleteMovieReview(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const review = await MovieReview.findById(params.id);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie review not found'
        },
        { status: 404 }
      );
    }

    await MovieReview.findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Movie review deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete movie review error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete movie review'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMovieReview, ['superadmin', 'admin']);
export const PUT = withAuth(updateMovieReview, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteMovieReview, ['superadmin', 'admin']);