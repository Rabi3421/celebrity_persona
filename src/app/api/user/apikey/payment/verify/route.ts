/**
 * POST /api/user/apikey/payment/verify
 * ─────────────────────────────────────
 * Verifies Razorpay payment signature after client-side checkout.
 * On success, upgrades the user's API quota to the purchased plan.
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import ApiOrder from '@/models/ApiOrder';
import { getPlanById } from '@/lib/apiPlans';

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification fields.' },
        { status: 400 }
      );
    }

    // ── 1. Verify HMAC signature ──────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = request.user!.userId;

    // ── 2. Find the pending order ─────────────────────────────────────────
    const order = await ApiOrder.findOne({
      razorpayOrderId,
      userId,
      status: 'created',
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or already processed.' },
        { status: 404 }
      );
    }

    // ── 3. Mark order as paid ─────────────────────────────────────────────
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.status = 'paid';
    await order.save();

    // ── 4. Upgrade user's API quota ───────────────────────────────────────
    const plan = getPlanById(order.planId);
    if (!plan) {
      return NextResponse.json({ success: false, message: 'Plan not found.' }, { status: 500 });
    }

    // Set purchasedQuota = plan.quota - freeQuota (so totalQuota = plan.quota)
    const apiKey = await ApiKey.findOne({ userId });
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'API key not found.' }, { status: 404 });
    }

    const newPurchasedQuota = Math.max(0, plan.quota - apiKey.freeQuota);
    apiKey.purchasedQuota = newPurchasedQuota;
    apiKey.planId = plan.id;
    await apiKey.save();

    return NextResponse.json({
      success: true,
      message: `Payment successful! Your plan has been upgraded to ${plan.label}.`,
      plan: {
        id: plan.id,
        label: plan.label,
        quota: plan.quota,
        quotaLabel: plan.quotaLabel,
      },
      newQuota: {
        freeQuota: apiKey.freeQuota,
        purchasedQuota: apiKey.purchasedQuota,
        totalQuota: apiKey.freeQuota + apiKey.purchasedQuota,
      },
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ success: false, message: 'Payment verification failed.' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
