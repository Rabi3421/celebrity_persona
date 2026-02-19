// /api/superadmin/stats — returns platform statistics for superadmins
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // 1) Total number of users (role === 'user' only)
    const totalUsers = await User.countDocuments({ role: 'user' });

    // 2) Total number of admins
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // 3) Total number of DB collections
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
    }
    const collections = await db.listCollections().toArray();
    const totalCollections = collections.length;

    // 4 & 5) API calls per day & error rate (try to use an existing telemetry collection)
    const possibleTelemetry = ['api_logs', 'request_logs', 'logs', 'analytics', 'telemetry', 'api_requests'];
    let apiCallsPerDay: number | null = null;
    let errorRatePercent: number | null = null;
    let telemetryFound: string | null = null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const name of possibleTelemetry) {
      const exists = collections.find((c) => c.name === name);
      if (!exists) continue;
      telemetryFound = name;
      const col = db.collection(name);

      // Count total calls in last 24h
      const total = await col.countDocuments({ timestamp: { $gte: since } });
      // Attempt to count errors using common patterns
      const errorCount = await col.countDocuments({
        timestamp: { $gte: since },
        $or: [
          { status: { $gte: 500 } },
          { status: 'error' },
          { level: 'error' },
          { error: { $exists: true, $ne: null } },
        ],
      });

      apiCallsPerDay = total;
      errorRatePercent = total > 0 ? Math.round((errorCount / total) * 10000) / 100 : 0;
      break;
    }

    // 6) Total storage used (DB stats)
    let storageUsedBytes = 0;
    try {
      // dbStats returns sizes in bytes
      // Some managed providers may disallow this command; guard with try/catch
      // Use scale 1 to get bytes
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const stats = await db.command({ dbStats: 1 });
      storageUsedBytes = stats.storageSize || stats.dataSize || 0;
    } catch (e) {
      storageUsedBytes = 0;
    }

    const storageUsedMB = Math.round((storageUsedBytes / (1024 * 1024)) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalCollections,
        apiCallsPerDay,
        errorRatePercent,
        telemetryFound,
        storageUsedMB,
      },
    });
  } catch (error: any) {
    console.error('Superadmin stats error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to compute stats' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
