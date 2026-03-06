// POST /api/user/profile/avatar — upload profile photo to Firebase, save URL
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/imageUpload';

async function uploadAvatar(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided. Send file as "avatar" field.' },
        { status: 400 }
      );
    }

    // Validate (reuses the shared validator)
    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(request.user?.userId).select('avatar');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete old avatar from Firebase if it exists
    if (user.avatar) {
      await deleteImage(user.avatar).catch(() => { /* non-critical */ });
    }

    // Upload new avatar
    const avatarUrl = await uploadImage(file, 'avatars');

    // Persist URL — use updateOne to bypass any schema caching issues
    await User.updateOne(
      { _id: request.user?.userId },
      { $set: { avatar: avatarUrl } }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Avatar updated successfully',
        avatarUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadAvatar, ['user', 'admin', 'superadmin']);
