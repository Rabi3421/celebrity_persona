import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// Helper function to generate slug from headline
function generateSlug(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET all news
async function getNews(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const celebrity = searchParams.get('celebrity');
    const category = searchParams.get('category');
    const isPublished = searchParams.get('isPublished');
    const isFeatured = searchParams.get('isFeatured');
    const search = searchParams.get('search');

    await dbConnect();

    // Build query
    const query: any = {};

    if (celebrity) {
      query.celebrity = { $regex: celebrity, $options: 'i' };
    }

    if (category && ['MOVIES', 'MUSIC', 'FASHION', 'LIFESTYLE', 'AWARDS', 'RELATIONSHIPS', 'CAREER', 'OTHER'].includes(category)) {
      query.category = category;
    }

    if (typeof isPublished === 'string') {
      query.isPublished = isPublished === 'true';
    }

    if (typeof isFeatured === 'string') {
      query.isFeatured = isFeatured === 'true';
    }

    if (search) {
      query.$or = [
        { headline: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { celebrity: { $regex: search, $options: 'i' } }
      ];
    }

    // Get news with pagination
    const skip = (page - 1) * limit;
    const news = await CelebrityNews.find(query)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CelebrityNews.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          news,
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
    console.error('Get news error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get news'
      },
      { status: 500 }
    );
  }
}

// CREATE new news
async function createNews(request: AuthenticatedRequest) {
  try {
    const {
      headline,
      excerpt,
      content,
      celebrity,
      celebrityId,
      author,
      publishDate,
      category,
      thumbnail,
      thumbnailAlt,
      readTime,
      tags,
      isFeatured
    } = await request.json();

    // Validate required fields
    if (!headline || !excerpt || !content || !celebrity || !author || !publishDate || !category || !thumbnail || !thumbnailAlt || !readTime) {
      return NextResponse.json(
        {
          success: false,
          message: 'Headline, excerpt, content, celebrity, author, publishDate, category, thumbnail, thumbnailAlt, and readTime are required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from headline
    let slug = generateSlug(headline);
    
    // Ensure slug is unique
    let counter = 1;
    let originalSlug = slug;
    while (await CelebrityNews.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create news
    const news = new CelebrityNews({
      headline,
      slug,
      excerpt,
      content,
      celebrity,
      celebrityId,
      author,
      publishDate: new Date(publishDate),
      category,
      thumbnail,
      thumbnailAlt,
      readTime,
      tags: tags || [],
      views: 0,
      likes: 0,
      isPublished: true,
      isFeatured: isFeatured || false,
    });

    await news.save();

    return NextResponse.json(
      {
        success: true,
        message: 'News created successfully',
        data: news
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create news error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create news'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNews, ['superadmin', 'admin']);
export const POST = withAuth(createNews, ['superadmin', 'admin']);