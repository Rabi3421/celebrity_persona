// POST /api/user-outfits/upload-image
// Uploads a single outfit image to Firebase Storage and returns the URL.

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { uploadImage, validateImageFile } from '@/lib/imageUpload';

async function handler(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No image file provided' }, { status: 400 });
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    const url = await uploadImage(file, 'user-outfits');
    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error('[user-outfits/upload-image]', err);
    return NextResponse.json({ success: false, message: err.message || 'Upload failed' }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['user', 'admin', 'superadmin']);
