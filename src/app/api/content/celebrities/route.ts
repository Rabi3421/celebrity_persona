import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET all celebrities
async function getCelebrities(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    await dbConnect();

    // Build query
    const query: any = {};

    if (category && ['movie', 'music', 'sports', 'fashion', 'tv', 'other'].includes(category)) {
      query.category = category;
    }

    if (typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Get celebrities with pagination
    const skip = (page - 1) * limit;
    const celebrities = await Celebrity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Celebrity.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          celebrities,
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
    console.error('Get celebrities error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get celebrities'
      },
      { status: 500 }
    );
  }
}

// CREATE new celebrity
async function createCelebrity(request: AuthenticatedRequest) {
  try {
    const {
      name,
      profession,
      bio,
      birthDate,
      birthPlace,
      nationality,
      height,
      awards,
      socialMedia,
      image,
      imageAlt,
      latestProject,
      netWorth,
      category
    } = await request.json();

    // Validate required fields
    if (!name || !profession || !bio || !image || !imageAlt || !latestProject || !category) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, profession, bio, image, imageAlt, latestProject, and category are required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if celebrity already exists
    const existingCelebrity = await Celebrity.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingCelebrity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Celebrity with this name already exists'
        },
        { status: 409 }
      );
    }

    // Create celebrity
    const celebrity = new Celebrity({
      name,
      profession,
      bio,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      birthPlace,
      nationality,
      height,
      awards: awards || [],
      socialMedia: socialMedia || {},
      image,
      imageAlt,
      latestProject,
      netWorth,
      category,
      isActive: true,
    });

    await celebrity.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Celebrity created successfully',
        data: celebrity
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create celebrity error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create celebrity'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getCelebrities, ['superadmin', 'admin']);
export const POST = withAuth(createCelebrity, ['superadmin', 'admin']);