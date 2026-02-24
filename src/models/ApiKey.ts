import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IApiKeyUsageEntry {
  date: string;   // YYYY-MM-DD
  count: number;
}

export interface IApiKeyMonthlyUsage {
  month: string;  // YYYY-MM
  count: number;
}

export interface IApiKeyEndpointHit {
  endpoint: string;  // e.g. "GET /api/v1/celebrities"
  count: number;
  lastHitAt: Date;
}

export interface IApiKey extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  key: string;                         // cp_live_<random hex>
  isActive: boolean;
  // Usage tracking
  totalHits: number;
  monthlyHits: IApiKeyMonthlyUsage[];  // rolling per-month totals
  dailyHits: IApiKeyUsageEntry[];      // last 30 days
  endpointHits: IApiKeyEndpointHit[]; // per-endpoint breakdown
  lastUsedAt?: Date;
  // Quota
  freeQuota: number;                   // default 100 / month
  purchasedQuota: number;              // additional purchased hits
  // Plan
  planId: string;                      // 'free' | 'starter' | 'pro' | 'ultra'
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const monthlyUsageSchema = new Schema<IApiKeyMonthlyUsage>(
  {
    month: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const dailyUsageSchema = new Schema<IApiKeyUsageEntry>(
  {
    date:  { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const endpointHitSchema = new Schema<IApiKeyEndpointHit>(
  {
    endpoint:  { type: String, required: true },
    count:     { type: Number, default: 0 },
    lastHitAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const apiKeySchema = new Schema<IApiKey>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // one key per user
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalHits: {
      type: Number,
      default: 0,
    },
    monthlyHits: {
      type: [monthlyUsageSchema],
      default: [],
    },
    dailyHits: {
      type: [dailyUsageSchema],
      default: [],
    },
    endpointHits: {
      type: [endpointHitSchema],
      default: [],
    },
    lastUsedAt: {
      type: Date,
    },
    freeQuota: {
      type: Number,
      default: 100,
    },
    purchasedQuota: {
      type: Number,
      default: 0,
    },
    planId: {
      type: String,
      default: 'free',
    },
  },
  { timestamps: true }
);

// Index for fast lookup by key
apiKeySchema.index({ key: 1 });
apiKeySchema.index({ userId: 1 });

if (mongoose.models.ApiKey) {
  delete (mongoose.models as Record<string, unknown>).ApiKey;
}

const ApiKey: Model<IApiKey> = mongoose.model<IApiKey>('ApiKey', apiKeySchema);

export default ApiKey;
