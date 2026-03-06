// GET /api/user/celebrities/like-status/[slug]
// PUBLIC — returns total like count for a celebrity.
// If a valid Bearer token is provided, also returns the user's personal like status.
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import TokenService from '@/lib/tokenService';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  await dbConnect();

  const slug = params.slug?.toLowerCase().trim();
  if (!slug) {
    return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 });
  }

  try {
    const celebrity = await Celebrity.findOne({ slug, isActive: true })
      .select('likes')
      .lean() as any;

    if (!celebrity) {
      return NextResponse.json({ success: false, message: 'Celebrity not found' }, { status: 404 });
    }

    const likes: any[] = celebrity.likes ?? [];
    const count = likes.length;

    // Try to resolve the logged-in user's like status from the Bearer token (optional)
    let liked = false;
    try {
      const authHeader = request.headers.get('authorization') ?? '';
      if (authHeader.startsWith('Bearer ')) {
        const token   = authHeader.replace('Bearer ', '').trim();
        const payload = TokenService.verifyAccessToken(token);
        if (payload?.userId) {
          const uid = new mongoose.Types.ObjectId(payload.userId as string);
          liked = likes.some((id: any) => String(id) === String(uid));
        }
      }
    } catch { /* invalid/missing token — liked stays false */ }

    return NextResponse.json({ success: true, liked, count });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
