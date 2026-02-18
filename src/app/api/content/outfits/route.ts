import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET all outfits
async function getOutfits(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const celebrityName = searchParams.get('celebrityName');
    const occasion = searchParams.get('occasion');
    const priceRange = searchParams.get('priceRange');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    await dbConnect();

    // Build query
    const query: any = {};

    if (celebrityName) {
      query.celebrityName = { $regex: celebrityName, $options: 'i' };
    }

    if (occasion && ['RED CARPET', 'AIRPORT', 'CASUAL', 'PARTY', 'FORMAL', 'STREET STYLE', 'OTHER'].includes(occasion)) {
      query.occasion = occasion;
    }

    if (priceRange && ['$', '$$', '$$$', '$$$$'].includes(priceRange)) {
      query.priceRange = priceRange;
    }

    if (typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { celebrityName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get outfits with pagination
    const skip = (page - 1) * limit;
    const outfits = await CelebrityOutfit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CelebrityOutfit.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          outfits,
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
    console.error('Get outfits error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get outfits'
      },
      { status: 500 }
    );
  }
}

// CREATE new outfit
async function createOutfit(request: AuthenticatedRequest) {
  try {
    const {
      celebrityId,
      celebrityName,
      title,
      description,
      occasion,
      priceRange,
      image,
      imageAlt,
      outfitItems,
      tags,
      eventDate,
      eventLocation
    } = await request.json();

    // Validate required fields
    if (!celebrityName || !title || !description || !occasion || !priceRange || !image || !imageAlt) {
      return NextResponse.json(
        {
          success: false,
          message: 'CelebrityName, title, description, occasion, priceRange, image, and imageAlt are required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create outfit
    const outfit = new CelebrityOutfit({
      celebrityId,
      celebrityName,
      title,
      description,
      occasion,
      priceRange,
      image,
      imageAlt,
      outfitItems: outfitItems || [],
      tags: tags || [],
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventLocation,
      views: 0,
      likes: 0,
      isActive: true,
    });

    await outfit.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Outfit created successfully',
        data: outfit
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create outfit error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create outfit'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getOutfits, ['superadmin', 'admin']);
export const POST = withAuth(createOutfit, ['superadmin', 'admin']);