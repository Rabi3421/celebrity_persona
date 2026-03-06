// GET  /api/user/preferences  — fetch saved notification & privacy prefs
// PATCH /api/user/preferences — save them
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function getPreferences(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const user = await User.findById(request.user?.userId).select('preferences').lean() as any;
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const prefs = user.preferences ?? {
      emailNotifications: true,
      pushNotifications:  false,
      privateProfile:     false,
      showActivity:       true,
    };
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

async function updatePreferences(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const allowed = ['emailNotifications', 'pushNotifications', 'privateProfile', 'showActivity'];
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (typeof body[key] === 'boolean') updates[`preferences.${key}`] = body[key];
    }

    await User.findByIdAndUpdate(
      request.user?.userId,
      { $set: updates },
      { strict: false }
    );

    return NextResponse.json({ success: true, message: 'Preferences saved' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const GET   = withAuth(getPreferences);
export const PATCH = withAuth(updatePreferences);
