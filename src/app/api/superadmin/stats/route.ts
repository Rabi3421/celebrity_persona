// /api/superadmin/stats — returns platform statistics for superadmins
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import ApiKey from '@/models/ApiKey';
import ApiOrder from '@/models/ApiOrder';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import User from '@/models/User';
import UserOutfit from '@/models/UserOutfit';

type ActivityItem = {
  msg: string;
  time: string;
  color: string;
  at: Date;
};

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getRelativeTime(value?: Date | string | null) {
  if (!value) return 'Recently';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) return 'Recently';
  if (diff < 60_000) return 'Just now';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))} hr ago`;
  if (diff < 7 * 24 * 60 * 60_000) return `${Math.floor(diff / (24 * 60 * 60_000))} day ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toActivity(
  msg: string,
  value: any,
  color: string,
  dateField: 'createdAt' | 'updatedAt' = 'createdAt'
): ActivityItem {
  const at = new Date(value?.[dateField] || value?.createdAt || value?.updatedAt || Date.now());

  return {
    msg,
    time: getRelativeTime(at),
    color,
    at,
  };
}

async function getTelemetryStats(db: mongoose.mongo.Db, collections: { name: string }[]) {
  const possibleTelemetry = [
    'api_logs',
    'request_logs',
    'logs',
    'analytics',
    'telemetry',
    'api_requests',
  ];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const name of possibleTelemetry) {
    const exists = collections.find((c) => c.name === name);
    if (!exists) continue;

    const col = db.collection(name);
    const total = await col.countDocuments({
      $or: [{ timestamp: { $gte: since } }, { createdAt: { $gte: since } }],
    });
    const errorCount = await col.countDocuments({
      $and: [
        { $or: [{ timestamp: { $gte: since } }, { createdAt: { $gte: since } }] },
        {
          $or: [
            { status: { $gte: 500 } },
            { statusCode: { $gte: 500 } },
            { status: 'error' },
            { level: 'error' },
            { error: { $exists: true, $ne: null } },
          ],
        },
      ],
    });

    return {
      telemetryFound: name,
      apiCallsFromTelemetry: total,
      errorRatePercent: total > 0 ? round((errorCount / total) * 100) : 0,
    };
  }

  return {
    telemetryFound: null,
    apiCallsFromTelemetry: null,
    errorRatePercent: null,
  };
}

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database not initialized' },
        { status: 500 }
      );
    }

    const collections = await db.listCollections().toArray();
    const totalCollections = collections.length;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalAdmins,
      totalSuperadmins,
      activeUsers,
      contentCounts,
      apiKeys,
      revenueStats,
      recentUsers,
      recentOrders,
      recentNews,
      recentMovies,
      recentUserOutfits,
      telemetryStats,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'superadmin' }),
      User.countDocuments({ isActive: true }),
      Promise.all([
        Celebrity.countDocuments({}),
        CelebrityOutfit.countDocuments({}),
        CelebrityNews.countDocuments({}),
        Movie.countDocuments({}),
        MovieReview.countDocuments({}),
        UserOutfit.countDocuments({}),
        ApiKey.countDocuments({}),
      ]),
      ApiKey.find({}).select('dailyHits monthlyHits totalHits isActive lastUsedAt').lean(),
      ApiOrder.aggregate([
        {
          $facet: {
            mtd: [
              { $match: { status: 'paid', createdAt: { $gte: monthStart } } },
              {
                $group: {
                  _id: null,
                  amountPaise: { $sum: '$amountPaise' },
                  count: { $sum: 1 },
                },
              },
            ],
            allTime: [
              { $match: { status: 'paid' } },
              {
                $group: {
                  _id: null,
                  amountPaise: { $sum: '$amountPaise' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      User.find({}).select('name email role createdAt').sort({ createdAt: -1 }).limit(3).lean(),
      ApiOrder.find({})
        .select('planLabel amountPaise status createdAt')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      CelebrityNews.find({})
        .select('title status updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(2)
        .lean(),
      Movie.find({})
        .select('title publishStatus updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(2)
        .lean(),
      UserOutfit.find({})
        .select('title isApproved createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(2)
        .lean(),
      getTelemetryStats(db, collections),
    ]);

    const [celebrities, outfits, news, movies, reviews, userOutfits, apiKeyCount] = contentCounts;

    const apiCallsTodayFromKeys = apiKeys.reduce((total, key: any) => {
      const entry = key.dailyHits?.find((hit: any) => hit.date === todayKey);
      return total + (entry?.count || 0);
    }, 0);
    const apiCallsThisMonth = apiKeys.reduce((total, key: any) => {
      const entry = key.monthlyHits?.find((hit: any) => hit.month === monthKey);
      return total + (entry?.count || 0);
    }, 0);
    const activeApiKeys = apiKeys.filter((key: any) => key.isActive).length;

    const apiCallsToday = telemetryStats.apiCallsFromTelemetry ?? apiCallsTodayFromKeys;

    let storageUsedBytes = 0;
    try {
      const dbStats = await db.command({ dbStats: 1 });
      storageUsedBytes = dbStats.storageSize || dbStats.dataSize || 0;
    } catch (e) {
      storageUsedBytes = 0;
    }

    const storageUsedMB = round(storageUsedBytes / (1024 * 1024));
    const revenueMTD = round((revenueStats?.[0]?.mtd?.[0]?.amountPaise || 0) / 100);
    const revenueAllTime = round((revenueStats?.[0]?.allTime?.[0]?.amountPaise || 0) / 100);
    const ordersMTD = revenueStats?.[0]?.mtd?.[0]?.count || 0;
    const paidOrdersAllTime = revenueStats?.[0]?.allTime?.[0]?.count || 0;

    const recentActivity = [
      ...recentUsers.map((user: any) =>
        toActivity(`New ${user.role} registered: ${user.name || user.email}`, user, 'bg-blue-500')
      ),
      ...recentOrders.map((order: any) =>
        toActivity(
          `${order.status === 'paid' ? 'Payment received' : 'Payment updated'}: ${order.planLabel} (${order.status})`,
          order,
          order.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
        )
      ),
      ...recentNews.map((item: any) =>
        toActivity(
          `News updated: ${item.title || 'Untitled article'}`,
          item,
          'bg-purple-500',
          'updatedAt'
        )
      ),
      ...recentMovies.map((item: any) =>
        toActivity(
          `Movie updated: ${item.title || 'Untitled movie'}`,
          item,
          'bg-orange-500',
          'updatedAt'
        )
      ),
      ...recentUserOutfits.map((item: any) =>
        toActivity(
          `User outfit ${item.isApproved ? 'approved' : 'submitted'}: ${item.title || 'Untitled outfit'}`,
          item,
          item.isApproved ? 'bg-teal-500' : 'bg-yellow-500'
        )
      ),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 6)
      .map(({ at, ...item }) => item);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalSuperadmins,
        activeUsers,
        totalCollections,
        apiCallsToday,
        apiCallsThisMonth,
        activeApiKeys,
        errorRatePercent: telemetryStats.errorRatePercent,
        telemetryFound: telemetryStats.telemetryFound,
        storageUsedMB,
        revenueMTD,
        revenueAllTime,
        ordersMTD,
        paidOrdersAllTime,
        contentCounts: {
          celebrities,
          outfits,
          news,
          movies,
          reviews,
          userOutfits,
          apiKeys: apiKeyCount,
        },
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Superadmin stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to compute stats' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['superadmin']);
