/**
 * GET /api/user/apikey/stats
 * ──────────────────────────
 * Returns usage stats (NO key string) for the dashboard.
 * Safe to call without password verification.
 */

import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const userId = request.user!.userId;
    const apiKey = await ApiKey.findOne({ userId });

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        hasKey: false,
        stats: null,
      });
    }

    const month = currentMonth();
    const monthEntry = apiKey.monthlyHits.find((m: any) => m.month === month);
    const monthUsed = monthEntry ? monthEntry.count : 0;
    const totalQuota = apiKey.freeQuota + apiKey.purchasedQuota;

    // Last 7 days for chart
    const last7: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = apiKey.dailyHits.find((e: any) => e.date === dateStr);
      last7.push({ date: dateStr, count: entry ? entry.count : 0 });
    }

    return NextResponse.json({
      success: true,
      hasKey: true,
      stats: {
        isActive: apiKey.isActive,
        keyPrefix: apiKey.key.slice(0, 12) + '••••••••••••••••••••••••••••••••',
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        totalHits: apiKey.totalHits,
        monthUsed,
        freeQuota: apiKey.freeQuota,
        purchasedQuota: apiKey.purchasedQuota,
        totalQuota,
        remaining: Math.max(0, totalQuota - monthUsed),
        percentUsed: totalQuota > 0 ? Math.round((monthUsed / totalQuota) * 100) : 0,
        planId: apiKey.planId || 'free',
        last7Days: last7,
        last3Months: apiKey.monthlyHits.slice(-3).map((m: any) => ({
          month: m.month,
          count: m.count,
        })),
      },
    });
  } catch (error) {
    console.error('API key stats error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
