import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Celebrity from '@/models/Celebrity'; // must be imported so Mongoose registers the schema before .populate()
import User from '@/models/User';
import mongoose from 'mongoose';

async function handler(request: AuthenticatedRequest) {
  await dbConnect();

  // Ensure Celebrity schema is registered before any .populate() calls
  // (Next.js may tree-shake unused imports — referencing the model directly prevents that)
  void Celebrity.modelName;

  const uid   = new mongoose.Types.ObjectId(request.user!.userId as string);
  const limit = 30; // max events to return

  const events: {
    type: string;
    title: string;
    description: string;
    link?: string;
    timestamp: Date | undefined;
    meta?: string;
  }[] = [];

  // ── 1. Outfits YOU uploaded ──────────────────────────────────────────────
  const myUserOutfits = await UserOutfit.find({ userId: uid })
    .select('title slug createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  for (const o of myUserOutfits) {
    events.push({
      type: 'uploaded',
      title: 'Uploaded Outfit',
      description: `You uploaded "${o.title}" to the gallery`,
      link: `/user-outfits/${o.slug}`,
      timestamp: o.createdAt as Date,
    });
  }

  // ── 2. Likes YOUR outfits received ──────────────────────────────────────
  const likedMyOutfits = await UserOutfit.find({
    userId: uid,
    'likes.0': { $exists: true },
  })
    .select('title slug likes')
    .limit(20)
    .lean();

  for (const o of likedMyOutfits) {
    // Show one event per outfit (total likes count — not per-person)
    events.push({
      type: 'received_like',
      title: 'Outfit Liked',
      description: `"${o.title}" has been liked by ${o.likes.length} ${o.likes.length === 1 ? 'person' : 'people'}`,
      link: `/user-outfits/${o.slug}`,
      timestamp: (o as any).updatedAt ?? (o as any).createdAt,
      meta: 'Your outfit',
    });
  }

  // ── 3. Comments on YOUR outfits ─────────────────────────────────────────
  const commentedMyOutfits = await UserOutfit.find({
    userId: uid,
    'comments.0': { $exists: true },
  })
    .select('title slug comments')
    .limit(20)
    .lean();

  for (const o of commentedMyOutfits) {
    for (const c of (o.comments as any[])) {
      // Skip if the commenter is the owner themselves
      if (String(c.userId) === String(uid)) continue;
      events.push({
        type: 'received_comment',
        title: 'New Comment',
        description: `${c.userName} commented on "${o.title}"`,
        link: `/user-outfits/${o.slug}`,
        timestamp: c.createdAt ?? (o as any).createdAt,
        meta: 'Your outfit',
      });
    }
  }

  // ── 4. Outfits YOU liked (UserOutfit) ───────────────────────────────────
  const youLikedUserOutfits = await UserOutfit.find({
    likes: uid,
    userId: { $ne: uid }, // not your own
  })
    .select('title slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  for (const o of youLikedUserOutfits) {
    events.push({
      type: 'liked',
      title: 'Liked Outfit',
      description: `You liked "${o.title}"`,
      link: `/user-outfits/${o.slug}`,
      timestamp: (o as any).updatedAt ?? (o as any).createdAt,
      meta: 'Community',
    });
  }

  // ── 5. Outfits YOU liked (CelebrityOutfit) ──────────────────────────────
  const youLikedCelebOutfits = await CelebrityOutfit.find({ likes: uid })
    .select('title slug updatedAt celebrity')
    .populate('celebrity', 'name')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  for (const o of youLikedCelebOutfits) {
    const celebName = (o.celebrity as any)?.name ?? 'a celebrity';
    events.push({
      type: 'liked',
      title: 'Liked Celebrity Outfit',
      description: `You liked "${o.title}" by ${celebName}`,
      link: `/celebrity-outfits/${o.slug}`,
      timestamp: (o as any).updatedAt ?? (o as any).createdAt,
      meta: '⭐ Celebrity',
    });
  }

  // ── 6. Outfits YOU saved (CelebrityOutfit) ──────────────────────────────
  const youSavedCelebOutfits = await CelebrityOutfit.find({ favourites: uid })
    .select('title slug updatedAt celebrity')
    .populate('celebrity', 'name')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  for (const o of youSavedCelebOutfits) {
    const celebName = (o.celebrity as any)?.name ?? 'a celebrity';
    events.push({
      type: 'saved',
      title: 'Saved Outfit',
      description: `You saved "${o.title}" by ${celebName}`,
      link: `/celebrity-outfits/${o.slug}`,
      timestamp: (o as any).updatedAt ?? (o as any).createdAt,
      meta: '⭐ Celebrity',
    });
  }

  // ── 7. Outfits YOU saved (UserOutfit) ───────────────────────────────────
  const youSavedUserOutfits = await UserOutfit.find({
    favourites: uid,
    userId: { $ne: uid },
  })
    .select('title slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  for (const o of youSavedUserOutfits) {
    events.push({
      type: 'saved',
      title: 'Saved Outfit',
      description: `You saved "${o.title}"`,
      link: `/user-outfits/${o.slug}`,
      timestamp: (o as any).updatedAt ?? (o as any).createdAt,
      meta: 'Community',
    });
  }

  // ── 8. Comments YOU posted on others' outfits ───────────────────────────
  const outfitsYouCommentedOn = await UserOutfit.find({
    'comments.userId': uid,
    userId: { $ne: uid },
  })
    .select('title slug comments')
    .limit(20)
    .lean();

  for (const o of outfitsYouCommentedOn) {
    const myComments = (o.comments as any[]).filter(
      (c) => String(c.userId) === String(uid)
    );
    for (const c of myComments) {
      events.push({
        type: 'commented',
        title: 'You Commented',
        description: `You commented on "${o.title}"`,
        link: `/user-outfits/${o.slug}`,
        timestamp: c.createdAt ?? (o as any).createdAt,
        meta: 'Community',
      });
    }
  }

  // ── 8b. Comments YOU posted on celebrity outfits ─────────────────────────
  const celebOutfitsYouCommentedOn = await CelebrityOutfit.find({
    'comments.userId': uid,
  })
    .select('title slug comments celebrity')
    .populate('celebrity', 'name')
    .limit(20)
    .lean();

  for (const o of celebOutfitsYouCommentedOn) {
    const celebName = (o.celebrity as any)?.name ?? 'a celebrity';
    const myComments = (o.comments as any[]).filter(
      (c) => String(c.userId) === String(uid)
    );
    for (const c of myComments) {
      events.push({
        type: 'commented',
        title: 'You Commented',
        description: `You commented on "${o.title}" by ${celebName}`,
        link: `/celebrity-outfits/${o.slug}`,
        timestamp: c.createdAt ?? (o as any).createdAt,
        meta: '⭐ Celebrity',
      });
    }
  }

  // ── 9. Celebrities YOU liked ─────────────────────────────────────────────
  const likedCelebrities = await Celebrity.find({ likes: uid })
    .select('name slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  for (const c of likedCelebrities) {
    events.push({
      type: 'liked',
      title: 'Liked Celebrity',
      description: `You liked ${c.name}'s profile`,
      link: `/celebrity-profiles/${c.slug}`,
      timestamp: (c as any).updatedAt ?? (c as any).createdAt,
      meta: '⭐ Celebrity',
    });
  }

  // ── 10. Celebrities YOU follow ───────────────────────────────────────────
  const me = await User.findById(uid)
    .select('followedCelebrities')
    .populate('followedCelebrities', 'name slug')
    .lean();

  for (const celeb of ((me as any)?.followedCelebrities ?? [])) {
    events.push({
      type: 'followed',
      title: 'Following Celebrity',
      description: `You are following ${celeb.name}`,
      link: `/celebrity-profiles/${celeb.slug}`,
      timestamp: new Date(0), // no timestamp available — put at end
    });
  }

  // ── Sort all events newest-first, cap at `limit` ─────────────────────────
  const toMs = (t: Date | undefined) => (t instanceof Date && !isNaN(t.getTime()) ? t.getTime() : 0);
  events.sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
  const feed = events.slice(0, limit).map((e) => ({
    ...e,
    timestamp: toMs(e.timestamp) === 0 ? null : e.timestamp!.toISOString(),
  }));

  return NextResponse.json({ success: true, activities: feed });
}

export const GET = withAuth(handler);
