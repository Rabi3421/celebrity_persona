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

// GET all celebrities
async function getCelebrities(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const nationality = searchParams.get('nationality');
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await dbConnect();

    // Build query
    const query: any = {};

    if (category) {
      query.categories = { $in: [category] };
    }

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query.status = status;
    }

    if (nationality) {
      query.nationality = { $regex: nationality, $options: 'i' };
    }

    if (typeof isActive === 'string') {
      query.isActive = isActive === 'true';
    }

    if (typeof isFeatured === 'string') {
      query.isFeatured = isFeatured === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { introduction: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get celebrities with pagination
    const skip = (page - 1) * limit;
    const celebrities = await Celebrity.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

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
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Celebrity name is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from name if not provided
    let slug = data.slug || generateSlug(data.name);
    
    // Ensure slug is unique
    let counter = 1;
    let originalSlug = slug;
    while (await Celebrity.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create celebrity with comprehensive data structure
    const celebrityData = {
      name: data.name,
      slug,
      born: data.born || '',
      birthPlace: data.birthPlace || '',
      died: data.died || '',
      age: data.age || 0,
      nationality: data.nationality || '',
      citizenship: Array.isArray(data.citizenship) ? data.citizenship : [],
      occupation: Array.isArray(data.occupation) ? data.occupation : [],
      yearsActive: data.yearsActive || '',
      height: data.height || '',
      weight: data.weight || '',
      bodyMeasurements: data.bodyMeasurements || '',
      eyeColor: data.eyeColor || '',
      hairColor: data.hairColor || '',
      spouse: data.spouse || '',
      children: Array.isArray(data.children) ? data.children : [],
      parents: Array.isArray(data.parents) ? data.parents : [],
      siblings: Array.isArray(data.siblings) ? data.siblings : [],
      relatives: Array.isArray(data.relatives) ? data.relatives : [],
      education: Array.isArray(data.education) ? data.education : [],
      netWorth: data.netWorth || '',
      introduction: data.introduction || '',
      earlyLife: data.earlyLife || '',
      career: data.career || '',
      personalLife: data.personalLife || '',
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
      controversies: Array.isArray(data.controversies) ? data.controversies : [],
      philanthropy: Array.isArray(data.philanthropy) ? data.philanthropy : [],
      trivia: Array.isArray(data.trivia) ? data.trivia : [],
      works: Array.isArray(data.works) ? data.works : [],
      movies: Array.isArray(data.movies) ? data.movies : [],
      quotes: Array.isArray(data.quotes) ? data.quotes : [],
      relatedCelebrities: Array.isArray(data.relatedCelebrities) ? data.relatedCelebrities : [],
      newsArticles: Array.isArray(data.newsArticles) ? data.newsArticles : [],
      socialMedia: {
        instagram: data.socialMedia?.instagram || '',
        twitter: data.socialMedia?.twitter || '',
        facebook: data.socialMedia?.facebook || '',
        youtube: data.socialMedia?.youtube || '',
        tiktok: data.socialMedia?.tiktok || '',
        website: data.socialMedia?.website || ''
      },
      seo: data.seo || {
        metaTitle: `${data.name} Biography`,
        metaDescription: `Learn about ${data.name}'s biography, career, and achievements`,
        metaKeywords: [data.name, 'biography', 'celebrity'],
        ogImages: [],
        tags: [],
        alternateLangs: [],
        canonicalAlternates: [],
        relatedTopics: []
      },
      popularity: data.popularity || 0,
      popularityScore: data.popularityScore || 0,
      viewCount: data.viewCount || 0,
      shareCount: data.shareCount || 0,
      searchRank: data.searchRank || 0,
      trendingScore: data.trendingScore || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isFeatured: data.isFeatured || false,
      isVerified: data.isVerified || false,
      contentQuality: data.contentQuality || 'draft',
      tags: Array.isArray(data.tags) ? data.tags : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      language: data.language || 'en',
      profileImage: data.profileImage || '',
      coverImage: data.coverImage || '',
      galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
      status: data.status || 'draft',
      isScheduled: data.isScheduled || false,
      publishAt: data.publishAt ? new Date(data.publishAt) : null
    };

    const celebrity = new Celebrity(celebrityData);
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