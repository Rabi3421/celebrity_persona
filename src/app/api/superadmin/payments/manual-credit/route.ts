/**
 * POST /api/superadmin/payments/manual-credit
 * ─────────────────────────────────────────────
 * Manually credits quota to a user when payment succeeded but auto-credit failed.
 * Body: { orderId, note? }
 */
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiOrder from '@/models/ApiOrder';
import ApiKey from '@/models/ApiKey';
import { getPlanById } from '@/lib/apiPlans';

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { orderId, note } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 });
    }

    await dbConnect();

    const order = await ApiOrder.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { success: false, message: `Cannot credit — order status is "${order.status}", not "paid".` },
        { status: 400 }
      );
    }

    const plan = getPlanById(order.planId);
    if (!plan) {
      return NextResponse.json({ success: false, message: 'Plan not found.' }, { status: 500 });
    }

    const apiKey = await ApiKey.findOne({ userId: order.userId });
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'User does not have an API key. Ask them to generate one first.' },
        { status: 404 }
      );
    }

    const newPurchasedQuota = Math.max(0, plan.quota - apiKey.freeQuota);
    apiKey.purchasedQuota = newPurchasedQuota;
    apiKey.planId = plan.id;
    await apiKey.save();

    return NextResponse.json({
      success: true,
      message: `Quota manually credited for order ${orderId}. Plan: ${plan.label}, Quota: ${plan.quota}/mo.`,
      creditedTo: order.userId.toString(),
      plan: plan.id,
      newTotalQuota: apiKey.freeQuota + apiKey.purchasedQuota,
      note: note || null,
    });
  } catch (error) {
    console.error('Manual credit error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['superadmin']);
