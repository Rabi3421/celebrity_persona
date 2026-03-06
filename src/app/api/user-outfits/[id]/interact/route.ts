// POST /api/user-outfits/[id]/interact
// body: { action: 'like' | 'unlike' | 'favourite' | 'unfavourite' | 'comment' | 'delete-comment', text?, commentId? }
// Requires: Bearer auth

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

async function handler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.user!.userId as string;

  try {
    await dbConnect();

    const body   = await request.json();
    const action = body.action as string;

    // find by slug or _id
    const outfit = await UserOutfit.findOne({
      $or: [
        { slug: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : new mongoose.Types.ObjectId() },
      ],
    });

    if (!outfit) {
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    if (action === 'like') {
      if (!outfit.likes.some((l: mongoose.Types.ObjectId) => l.equals(uid))) {
        outfit.likes.push(uid);
        await outfit.save();
      }
      return NextResponse.json({ success: true, liked: true, count: outfit.likes.length });
    }

    if (action === 'unlike') {
      outfit.likes = outfit.likes.filter((l: mongoose.Types.ObjectId) => !l.equals(uid));
      await outfit.save();
      return NextResponse.json({ success: true, liked: false, count: outfit.likes.length });
    }

    if (action === 'favourite') {
      if (!outfit.favourites.some((f: mongoose.Types.ObjectId) => f.equals(uid))) {
        outfit.favourites.push(uid);
        await outfit.save();
      }
      return NextResponse.json({ success: true, favourited: true, count: outfit.favourites.length });
    }

    if (action === 'unfavourite') {
      outfit.favourites = outfit.favourites.filter((f: mongoose.Types.ObjectId) => !f.equals(uid));
      await outfit.save();
      return NextResponse.json({ success: true, favourited: false, count: outfit.favourites.length });
    }

    if (action === 'comment') {
      const text = (body.text || '').trim();
      if (!text) {
        return NextResponse.json({ success: false, message: 'Comment text is required' }, { status: 400 });
      }
      const comment = {
        _id:        new mongoose.Types.ObjectId(),
        userId:     uid,
        userName:   request.user!.name || 'User',
        userAvatar: request.user!.avatar || '',
        text,
        createdAt:  new Date(),
      };
      outfit.comments.push(comment as any);
      await outfit.save();
      return NextResponse.json({ success: true, comment });
    }

    if (action === 'delete-comment') {
      const cid = body.commentId as string;
      const idx = outfit.comments.findIndex(
        (c: any) => c._id.toString() === cid && c.userId.toString() === userId
      );
      if (idx === -1) {
        return NextResponse.json({ success: false, message: 'Comment not found or not yours' }, { status: 403 });
      }
      outfit.comments.splice(idx, 1);
      await outfit.save();
      return NextResponse.json({ success: true, commentId: cid });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[interact]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['user', 'admin', 'superadmin']);
