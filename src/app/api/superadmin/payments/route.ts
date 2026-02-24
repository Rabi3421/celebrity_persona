/**
 * GET /api/superadmin/payments
 * ─────────────────────────────
 * Returns all payment orders with user details, plan info, and failure reasons.
 * Superadmin can see every payment attempt — paid, failed, created (abandoned).
 */
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiOrder from '@/models/ApiOrder';
import User from '@/models/User';

async function handler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '25'));
    const skip   = (page - 1) * limit;

    // Build query
    const query: Record<string, any> = {};
    if (status) query.status = status;

    const allOrders = await ApiOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Fetch users
    const userIds = [...new Set(allOrders.map((o) => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email')
      .lean();

    const userMap: Record<string, any> = {};
    for (const u of users) userMap[u._id.toString()] = u;

    let merged = allOrders.map((o) => {
      const user = userMap[o.userId.toString()] || {};
      return {
        orderId:      o._id.toString(),
        userId:       o.userId.toString(),
        userName:     user.name  || 'Unknown',
        userEmail:    user.email || 'Unknown',
        // Plan
        planId:       o.planId,
        planLabel:    o.planLabel,
        quotaGranted: o.quotaGranted,
        // Payment
        amountINR:    (o.amountPaise / 100).toFixed(2),
        amountPaise:  o.amountPaise,
        currency:     o.currency,
        // Razorpay
        razorpayOrderId:   o.razorpayOrderId,
        razorpayPaymentId: o.razorpayPaymentId || null,
        razorpaySignature: o.razorpaySignature ? '✓ present' : null,
        // Status
        status:    o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.razorpayOrderId?.toLowerCase().includes(q) ||
          r.razorpayPaymentId?.toLowerCase().includes(q)
      );
    }

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    // Summary
    const paid    = allOrders.filter((o) => o.status === 'paid');
    const failed  = allOrders.filter((o) => o.status === 'failed');
    const created = allOrders.filter((o) => o.status === 'created');

    const summary = {
      totalOrders:   allOrders.length,
      paid:          paid.length,
      failed:        failed.length,
      abandoned:     created.length,  // created but never paid
      totalRevenueINR: (paid.reduce((s, o) => s + o.amountPaise, 0) / 100).toFixed(2),
      byPlan: {
        starter: paid.filter((o) => o.planId === 'starter').length,
        pro:     paid.filter((o) => o.planId === 'pro').length,
        ultra:   paid.filter((o) => o.planId === 'ultra').length,
      },
    };

    return NextResponse.json({
      success: true,
      summary,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: paginated,
    });
  } catch (error) {
    console.error('Superadmin payments error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['superadmin']);
