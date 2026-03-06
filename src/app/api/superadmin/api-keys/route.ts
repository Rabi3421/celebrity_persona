/**
 * GET /api/superadmin/api-keys
 * ─────────────────────────────
 * Returns all users who have API keys, with full usage details.
 * Supports search by email/name and filter by plan.
 */
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search  = searchParams.get('search')  || '';
    const planId  = searchParams.get('plan')    || '';
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit   = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip    = (page - 1) * limit;

    // Fetch all API keys with populated user
    const allKeys = (await ApiKey.find({})
      .sort({ createdAt: -1 })
      .lean()) as any[];

    // Collect user IDs
    const userIds = allKeys.map((k: any) => k.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email role isActive createdAt')
      .lean();

    const userMap: Record<string, any> = {};
    for (const u of users) {
      userMap[u._id.toString()] = u;
    }

    // Merge and filter
    const currentMonth = new Date().toISOString().slice(0, 7);

    let merged = allKeys.map((k) => {
      const user = userMap[k.userId.toString()] || {};
      const monthEntry = (k.monthlyHits || []).find((m: any) => m.month === currentMonth);
      const monthUsed  = monthEntry ? monthEntry.count : 0;
      const totalQuota = (k.freeQuota || 100) + (k.purchasedQuota || 0);

      // Last 7 days
      const last7: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const entry = (k.dailyHits || []).find((e: any) => e.date === dateStr);
        last7.push({ date: dateStr, count: entry ? entry.count : 0 });
      }

      return {
        keyId:    k._id.toString(),
        userId:   k.userId.toString(),
        // User info — if user not found, flag as orphaned
        userName:  user.name  || null,
        userEmail: user.email || null,
        userRole:  user.role  || 'user',
        userActive: user.isActive !== false,
        isOrphaned: !user.name,  // true = user was deleted
        // Key info
        keyPrefix:  k.key ? k.key.slice(0, 12) + '••••••••••••' : '',
        isActive:   k.isActive,
        planId:     k.planId || 'free',
        // Quota
        freeQuota:      k.freeQuota      || 100,
        purchasedQuota: k.purchasedQuota || 0,
        totalQuota,
        // Usage
        totalHits: k.totalHits || 0,
        monthUsed,
        remaining:    Math.max(0, totalQuota - monthUsed),
        percentUsed:  totalQuota > 0 ? Math.round((monthUsed / totalQuota) * 100) : 0,
        last7Days:    last7,
        monthlyHits:  (k.monthlyHits || []).slice(-6),
        endpointHits: (k.endpointHits || []).sort((a: any, b: any) => b.count - a.count),
        lastUsedAt:   k.lastUsedAt || null,
        createdAt:    k.createdAt,
      };
    });

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q)
      );
    }
    if (planId) {
      merged = merged.filter((r) => r.planId === planId);
    }

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    // Summary stats
    const summary = {
      totalKeys:     allKeys.length,
      activeKeys:    allKeys.filter((k) => k.isActive).length,
      totalHitsAllTime: allKeys.reduce((s, k) => s + (k.totalHits || 0), 0),
      totalHitsThisMonth: merged.reduce((s, r) => s + r.monthUsed, 0),
      byPlan: {
        free:    merged.filter((r) => r.planId === 'free').length,
        starter: merged.filter((r) => r.planId === 'starter').length,
        pro:     merged.filter((r) => r.planId === 'pro').length,
        ultra:   merged.filter((r) => r.planId === 'ultra').length,
      },
    };

    return NextResponse.json({
      success: true,
      summary,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: paginated,
    });
  } catch (error) {
    console.error('Superadmin API keys error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
