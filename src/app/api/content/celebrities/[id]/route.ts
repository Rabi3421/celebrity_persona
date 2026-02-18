import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET single celebrity
async function getCelebrity(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
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
    const updateData = await request.json();

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

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        celebrity[key] = updateData[key];
      }
    });

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