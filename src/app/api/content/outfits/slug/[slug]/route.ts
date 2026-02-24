// GET /api/content/outfits/slug/[slug]  → public, fetch celebrity outfit by slug
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    await dbConnect();

    const outfit = await CelebrityOutfit.findOne({ slug })
      .populate('celebrity', 'name slug profileImage')
      .lean() as any;

    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    }

    const data = {
      ...outfit,
      id:         String(outfit._id),
      // expose arrays as plain string arrays so the client can check membership
      likes:      (outfit.likes      ?? []).map(String),
      favourites: (outfit.favourites ?? []).map(String),
      comments:   (outfit.comments   ?? []).map((c: any) => ({
        _id:        String(c._id),
        userId:     String(c.userId),
        userName:   c.userName,
        userAvatar: c.userAvatar || '',
        text:       c.text,
        createdAt:  c.createdAt,
      })),
    };
    delete data._id;
    delete data.__v;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
