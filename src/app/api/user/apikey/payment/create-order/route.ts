/**
 * POST /api/user/apikey/payment/create-order
 * ─────────────────────────────────────────
 * Creates a Razorpay order for upgrading the API plan.
 * Returns { orderId, amount, currency, keyId } to the client.
 */
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import ApiOrder from '@/models/ApiOrder';
import { getPlanById } from '@/lib/apiPlans';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ success: false, message: 'planId is required.' }, { status: 400 });
    }

    const plan = getPlanById(planId);
    if (!plan || plan.id === 'free') {
      return NextResponse.json({ success: false, message: 'Invalid plan selected.' }, { status: 400 });
    }

    await dbConnect();
    const userId = request.user!.userId;

    // Check if user has an API key at all
    const apiKey = await ApiKey.findOne({ userId });
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Generate your free API key first before upgrading.' },
        { status: 400 }
      );
    }

    // Prevent downgrade to same or lower plan
    const currentPlanQuota = (apiKey.freeQuota || 0) + (apiKey.purchasedQuota || 0);
    if (plan.quota <= currentPlanQuota && apiKey.planId === planId) {
      return NextResponse.json(
        { success: false, message: 'You are already on this plan or a higher tier.' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: plan.amountPaise,
      currency: 'INR',
      receipt: `api_upgrade_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        planId: plan.id,
        planLabel: plan.label,
        quotaGranted: plan.quota.toString(),
      },
    });

    // Save order record (status: 'created')
    await ApiOrder.create({
      userId,
      planId: plan.id,
      planLabel: plan.label,
      quotaGranted: plan.quota,
      amountPaise: plan.amountPaise,
      currency: 'INR',
      razorpayOrderId: rzpOrder.id,
      status: 'created',
    });

    return NextResponse.json({
      success: true,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
      plan: {
        id: plan.id,
        label: plan.label,
        quota: plan.quota,
        quotaLabel: plan.quotaLabel,
        priceINR: plan.priceINR,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create Razorpay order error:', error);
    return NextResponse.json(
      { success: false, message: error?.error?.description || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
