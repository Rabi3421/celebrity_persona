/**
 * POST /api/user/apikey/generate
 * ─────────────────────────────
 * Generates an API key for the authenticated user.
 * Only one key allowed per user — returns existing if already created.
 * Returns the key ONCE on creation. After that, use /reveal.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import { generateApiKeyString } from '@/lib/apiKeyMiddleware';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const userId = request.user!.userId;

    // Check if key already exists
    const existing = await ApiKey.findOne({ userId });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'API key already exists. Use /reveal to view it after password verification.',
          hasKey: true,
        },
        { status: 409 }
      );
    }

    // Generate new key
    const keyString = generateApiKeyString();
    const apiKey = await ApiKey.create({
      userId,
      key: keyString,
      freeQuota: 100,
      purchasedQuota: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'API key generated successfully. Save this key — it will not be shown again without password verification.',
      apiKey: {
        key: keyString,
        createdAt: apiKey.createdAt,
        freeQuota: apiKey.freeQuota,
        purchasedQuota: apiKey.purchasedQuota,
        totalQuota: apiKey.freeQuota + apiKey.purchasedQuota,
      },
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
