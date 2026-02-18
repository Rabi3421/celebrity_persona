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

// GET single movie
async function getMovie(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const movie = await Movie.findById(params.id);

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: movie
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get movie error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get movie'
      },
      { status: 500 }
    );
  }
}

// UPDATE movie
async function updateMovie(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    await dbConnect();

    const movie = await Movie.findById(params.id);

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie not found'
        },
        { status: 404 }
      );
    }

    // Handle slug update if title is being changed
    if (updates.title && updates.title !== movie.title) {
      let newSlug = generateSlug(updates.title);
      
      // Ensure slug is unique (excluding current movie)
      let counter = 1;
      let originalSlug = newSlug;
      while (await Movie.findOne({ slug: newSlug, _id: { $ne: params.id } })) {
        newSlug = `${originalSlug}-${counter}`;
        counter++;
      }
      updates.slug = newSlug;
    }

    // Handle arrays properly
    if (updates.genre && !Array.isArray(updates.genre)) {
      updates.genre = [updates.genre];
    }

    if (updates.productionCompany && !Array.isArray(updates.productionCompany)) {
      updates.productionCompany = [updates.productionCompany];
    }

    // Handle date conversion
    if (updates.releaseDate) {
      updates.releaseDate = new Date(updates.releaseDate);
    }

    // Update last modified
    updates.updatedAt = new Date();

    const updatedMovie = await Movie.findByIdAndUpdate(
      params.id,
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Movie updated successfully',
        data: updatedMovie
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update movie error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update movie'
      },
      { status: 500 }
    );
  }
}

// DELETE movie
async function deleteMovie(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const movie = await Movie.findById(params.id);

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: 'Movie not found'
        },
        { status: 404 }
      );
    }

    await Movie.findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Movie deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete movie error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete movie'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMovie, ['superadmin', 'admin']);
export const PUT = withAuth(updateMovie, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteMovie, ['superadmin', 'admin']);