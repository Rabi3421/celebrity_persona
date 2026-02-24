/**
 * ApiOrder — tracks every Razorpay payment made to upgrade API quota.
 * One document per payment attempt.
 */
import mongoose, { Document, Model, Schema } from 'mongoose';

export type OrderStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface IApiOrder extends Document {
  userId: mongoose.Types.ObjectId;
  planId: string;               // e.g. 'starter' | 'pro' | 'ultra'
  planLabel: string;            // e.g. 'Starter Plan'
  quotaGranted: number;         // requests added on success
  amountPaise: number;          // amount in paise (₹499 → 49900)
  currency: string;             // 'INR'
  razorpayOrderId: string;      // from Razorpay order creation
  razorpayPaymentId?: string;   // from Razorpay webhook / client callback
  razorpaySignature?: string;   // for HMAC verification
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const apiOrderSchema = new Schema<IApiOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId:       { type: String, required: true },
    planLabel:    { type: String, required: true },
    quotaGranted: { type: Number, required: true },
    amountPaise:  { type: Number, required: true },
    currency:     { type: String, default: 'INR' },
    razorpayOrderId:  { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
  },
  { timestamps: true }
);

if (mongoose.models.ApiOrder) {
  delete (mongoose.models as Record<string, unknown>).ApiOrder;
}

const ApiOrder: Model<IApiOrder> = mongoose.model<IApiOrder>('ApiOrder', apiOrderSchema);
export default ApiOrder;
