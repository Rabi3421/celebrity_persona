import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityNews from '@/models/CelebrityNews';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET single news
async function getNews(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const news = await CelebrityNews.findById(id);

    if (!news) {
      return NextResponse.json(
        {
          success: false,
          message: 'News not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: news
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

// UPDATE news
async function updateNews(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updateData = await request.json();

    await dbConnect();

    const news = await CelebrityNews.findById(id);

    if (!news) {
      return NextResponse.json(
        {
          success: false,
          message: 'News not found'
        },
        { status: 404 }
      );
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'slug') {
        news[key] = updateData[key];
      }
    });

    await news.save();

    return NextResponse.json(
      {
        success: true,
        message: 'News updated successfully',
        data: news
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update news error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update news'
      },
      { status: 500 }
    );
  }
}

// DELETE news
async function deleteNews(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const news = await CelebrityNews.findById(id);

    if (!news) {
      return NextResponse.json(
        {
          success: false,
          message: 'News not found'
        },
        { status: 404 }
      );
    }

    await CelebrityNews.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'News deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete news'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNews, ['superadmin', 'admin']);
export const PUT = withAuth(updateNews, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteNews, ['superadmin', 'admin']);