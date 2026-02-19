import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET single celebrity
async function getCelebrity(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const celebrity = await Celebrity.findById(id).select('-__v');

    if (!celebrity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Celebrity not found'
        },
        { status: 404 }
      );
    }

    // Increment view count
    await Celebrity.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    return NextResponse.json(
      {
        success: true,
        data: celebrity
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get celebrity error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get celebrity'
      },
      { status: 500 }
    );
  }
}

// UPDATE celebrity
async function updateCelebrity(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const data = await request.json();

    await dbConnect();

    const celebrity = await Celebrity.findById(id);

    if (!celebrity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Celebrity not found'
        },
        { status: 404 }
      );
    }

    // Handle slug update if name is being changed
    if (data.name && data.name !== celebrity.name) {
      let newSlug = data.slug || generateSlug(data.name);
      
      // Ensure slug is unique (excluding current celebrity)
      let counter = 1;
      let originalSlug = newSlug;
      while (await Celebrity.findOne({ slug: newSlug, _id: { $ne: id } })) {
        newSlug = `${originalSlug}-${counter}`;
        counter++;
      }
      data.slug = newSlug;
    }

    // Handle arrays properly
    if (data.citizenship && !Array.isArray(data.citizenship)) {
      data.citizenship = [];
    }
    if (data.occupation && !Array.isArray(data.occupation)) {
      data.occupation = [];
    }
    if (data.children && !Array.isArray(data.children)) {
      data.children = [];
    }
    if (data.parents && !Array.isArray(data.parents)) {
      data.parents = [];
    }
    if (data.siblings && !Array.isArray(data.siblings)) {
      data.siblings = [];
    }
    if (data.relatives && !Array.isArray(data.relatives)) {
      data.relatives = [];
    }
    if (data.education && !Array.isArray(data.education)) {
      data.education = [];
    }
    if (data.achievements && !Array.isArray(data.achievements)) {
      data.achievements = [];
    }
    if (data.controversies && !Array.isArray(data.controversies)) {
      data.controversies = [];
    }
    if (data.philanthropy && !Array.isArray(data.philanthropy)) {
      data.philanthropy = [];
    }
    if (data.trivia && !Array.isArray(data.trivia)) {
      data.trivia = [];
    }
    if (data.works && !Array.isArray(data.works)) {
      data.works = [];
    }
    if (data.movies && !Array.isArray(data.movies)) {
      data.movies = [];
    }
    if (data.quotes && !Array.isArray(data.quotes)) {
      data.quotes = [];
    }
    if (data.relatedCelebrities && !Array.isArray(data.relatedCelebrities)) {
      data.relatedCelebrities = [];
    }
    if (data.newsArticles && !Array.isArray(data.newsArticles)) {
      data.newsArticles = [];
    }
    if (data.tags && !Array.isArray(data.tags)) {
      data.tags = [];
    }
    if (data.categories && !Array.isArray(data.categories)) {
      data.categories = [];
    }
    if (data.galleryImages && !Array.isArray(data.galleryImages)) {
      data.galleryImages = [];
    }

    // Handle publishAt date conversion
    if (data.publishAt) {
      data.publishAt = new Date(data.publishAt);
    }

    // Update fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== '_id' && key !== 'createdAt') {
        celebrity[key] = data[key];
      }
    });

    // Manually set updatedAt
    celebrity.updatedAt = new Date();

    await celebrity.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Celebrity updated successfully',
        data: celebrity
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update celebrity error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update celebrity'
      },
      { status: 500 }
    );
  }
}

// DELETE celebrity
async function deleteCelebrity(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const celebrity = await Celebrity.findById(id);

    if (!celebrity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Celebrity not found'
        },
        { status: 404 }
      );
    }

    await Celebrity.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Celebrity deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete celebrity error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete celebrity'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getCelebrity, ['superadmin', 'admin']);
export const PUT = withAuth(updateCelebrity, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteCelebrity, ['superadmin', 'admin']);