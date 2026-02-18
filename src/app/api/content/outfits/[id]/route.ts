import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET single outfit
async function getOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const outfit = await CelebrityOutfit.findById(id);

    if (!outfit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Outfit not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: outfit
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get outfit error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get outfit'
      },
      { status: 500 }
    );
  }
}

// UPDATE outfit
async function updateOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updateData = await request.json();

    await dbConnect();

    const outfit = await CelebrityOutfit.findById(id);

    if (!outfit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Outfit not found'
        },
        { status: 404 }
      );
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        outfit[key] = updateData[key];
      }
    });

    await outfit.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Outfit updated successfully',
        data: outfit
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Update outfit error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update outfit'
      },
      { status: 500 }
    );
  }
}

// DELETE outfit
async function deleteOutfit(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await dbConnect();

    const outfit = await CelebrityOutfit.findById(id);

    if (!outfit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Outfit not found'
        },
        { status: 404 }
      );
    }

    await CelebrityOutfit.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Outfit deleted successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Delete outfit error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete outfit'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getOutfit, ['superadmin', 'admin']);
export const PUT = withAuth(updateOutfit, ['superadmin', 'admin']);
export const DELETE = withAuth(deleteOutfit, ['superadmin', 'admin']);