import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Click sub-document ────────────────────────────────────────────────────────
export interface IOutfitClick {
  userLocation?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

// ── Main interface ────────────────────────────────────────────────────────────
export interface IUserOutfit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  images: string[];
  purchaseLink?: string;
  purchasePrice?: number;
  store?: string;
  tags: string[];
  category: string;
  brand?: string;
  size?: string;
  color?: string;
  views: number;
  isPublished: boolean;
  isApproved: boolean;
  slug: string;
  clicks: IOutfitClick[];
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Click sub-schema ──────────────────────────────────────────────────────────
const clickSchema = new Schema<IOutfitClick>(
  {
    userLocation: { type: String, default: 'Unknown' },
    userAgent:    { type: String },
    ipAddress:    { type: String, default: 'unknown' },
    timestamp:    { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const userOutfitSchema = new Schema<IUserOutfit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true },
    images: [{ type: String }],

    purchaseLink:  { type: String, trim: true },
    purchasePrice: { type: Number, min: 0 },
    store:         { type: String, trim: true },

    tags:     { type: [String], default: [] },
    category: { type: String, trim: true, default: 'casual' },
    brand:    { type: String, trim: true },
    size:     { type: String, trim: true },
    color:    { type: String, trim: true },

    views:       { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isApproved:  { type: Boolean, default: false },

    slug: { type: String, unique: true, index: true },

    clicks: { type: [clickSchema], default: [] },
    likes:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// ── Auto-generate slug before save ───────────────────────────────────────────
userOutfitSchema.pre('save', function () {
  if (!this.slug) {
    const base = String(this.title)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    this.slug = `${base}-${Date.now()}`;
  }
});

// ── Model (with cache-clear to avoid hot-reload issues) ───────────────────────
if (mongoose.models.UserOutfit) {
  delete (mongoose.models as Record<string, unknown>).UserOutfit;
}

const UserOutfit: Model<IUserOutfit> = mongoose.model<IUserOutfit>(
  'UserOutfit',
  userOutfitSchema
);

export default UserOutfit;
