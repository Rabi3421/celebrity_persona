import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';

// GET celebrity names for dropdown search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeImage = searchParams.get('includeImage') !== 'false'; // default true

    await dbConnect();

    // Build search query
    const searchQuery: any = {
      status: 'published', // Only show published celebrities
      isActive: true, // Only show active celebrities
    };

    if (query.trim()) {
      // Enhanced search - match name, categories, or tags
      searchQuery.$or = [
        { name: { $regex: query.trim(), $options: 'i' } },
        { categories: { $in: [new RegExp(query.trim(), 'i')] } },
        { tags: { $in: [new RegExp(query.trim(), 'i')] } }
      ];
    }

    // Select fields based on includeImage parameter
    const selectFields = includeImage 
      ? '_id name profileImage' 
      : '_id name';

    // Get celebrities matching the search
    const celebrities = await Celebrity.find(searchQuery)
      .select(selectFields)
      .sort({ name: 1 })
      .limit(Math.min(limit, 50)); // Cap at 50 results

    // Format response for dropdown
    const formattedResults = celebrities.map(celebrity => ({
      id: celebrity._id.toString(),
      name: celebrity.name,
      ...(includeImage && celebrity.profileImage && { profileImage: celebrity.profileImage }),
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedResults,
        meta: {
          total: formattedResults.length,
          query: query.trim(),
          limit
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Search celebrities error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to search celebrities',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}