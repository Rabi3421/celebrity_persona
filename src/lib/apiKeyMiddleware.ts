/**
 * withApiKey middleware
 * ─────────────────────
 * Validates the `x-api-key` header on public v1 API routes.
 * Increments hit counters (total, monthly, daily) and enforces
 * the per-month quota (freeQuota + purchasedQuota).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';

// ── helper: generate a new API key string ─────────────────────────────────────
export function generateApiKeyString(): string {
  return 'cp_live_' + crypto.randomBytes(24).toString('hex');
}

// ── helper: get current YYYY-MM and YYYY-MM-DD strings ───────────────────────
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-02"
}
function currentDay(): string {
  return new Date().toISOString().slice(0, 10); // "2026-02-25"
}

// ── main middleware ───────────────────────────────────────────────────────────
export async function withApiKey(
  request: NextRequest,
  handler: (request: NextRequest, apiKeyDoc: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const key = request.headers.get('x-api-key');

  // Derive a clean endpoint label: "GET /api/v1/celebrities"
  const endpoint = `${request.method} ${new URL(request.url).pathname}`;

  if (!key) {
    return NextResponse.json(
      {
        success: false,
        error: 'MISSING_API_KEY',
        message: 'API key required. Pass your key in the x-api-key header.',
        docs: 'https://celebritypersona.com/docs/api',
      },
      { status: 401 }
    );
  }

  await dbConnect();

  const apiKeyDoc = await ApiKey.findOne({ key, isActive: true });

  if (!apiKeyDoc) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or has been revoked.',
      },
      { status: 401 }
    );
  }

  // ── Quota check ─────────────────────────────────────────────────────────────
  const month = currentMonth();
  const monthEntry = apiKeyDoc.monthlyHits.find((m: any) => m.month === month);
  const monthCount = monthEntry ? monthEntry.count : 0;
  const totalQuota = apiKeyDoc.freeQuota + apiKeyDoc.purchasedQuota;

  if (monthCount >= totalQuota) {
    return NextResponse.json(
      {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: `Monthly quota of ${totalQuota} requests exceeded. Upgrade your plan to continue.`,
        quota: {
          used: monthCount,
          total: totalQuota,
          resetsOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        },
      },
      { status: 429 }
    );
  }

  // ── Increment counters (fire and forget — don't block response) ──────────────
  const day = currentDay();

  // Update monthly
  if (monthEntry) {
    monthEntry.count += 1;
  } else {
    apiKeyDoc.monthlyHits.push({ month, count: 1 });
    // Keep only last 24 months
    if (apiKeyDoc.monthlyHits.length > 24) {
      apiKeyDoc.monthlyHits.shift();
    }
  }

  // Update daily
  const dayEntry = apiKeyDoc.dailyHits.find((d: any) => d.date === day);
  if (dayEntry) {
    dayEntry.count += 1;
  } else {
    apiKeyDoc.dailyHits.push({ date: day, count: 1 });
    // Keep only last 30 days
    if (apiKeyDoc.dailyHits.length > 30) {
      apiKeyDoc.dailyHits.shift();
    }
  }

  apiKeyDoc.totalHits += 1;
  apiKeyDoc.lastUsedAt = new Date();

  // Update endpoint hits
  const epEntry = apiKeyDoc.endpointHits?.find((e: any) => e.endpoint === endpoint);
  if (epEntry) {
    epEntry.count += 1;
    epEntry.lastHitAt = new Date();
  } else {
    if (!apiKeyDoc.endpointHits) apiKeyDoc.endpointHits = [];
    apiKeyDoc.endpointHits.push({ endpoint, count: 1, lastHitAt: new Date() });
    // Keep only top 50 endpoints
    if (apiKeyDoc.endpointHits.length > 50) {
      apiKeyDoc.endpointHits.sort((a: any, b: any) => b.count - a.count);
      apiKeyDoc.endpointHits = apiKeyDoc.endpointHits.slice(0, 50);
    }
  }

  // Save without awaiting to keep response fast
  apiKeyDoc.save().catch(() => {});

  return handler(request, apiKeyDoc);
}
