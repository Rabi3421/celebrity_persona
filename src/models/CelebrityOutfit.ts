import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICelebrityOutfit extends Document {
  _id: string;
  celebrityId: string;
  celebrityName: string;
  title: string;
  description: string;
  occasion: 'RED CARPET' | 'AIRPORT' | 'CASUAL' | 'PARTY' | 'FORMAL' | 'STREET STYLE' | 'OTHER';
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  image: string;
  imageAlt: string;
  outfitItems: {
    type: string; // e.g., "Jacket", "Dress", "Shoes"
    brand?: string;
    price?: string;
    buyingUrl?: string;
    description?: string;
  }[];
  tags: string[];
  eventDate?: Date;
  eventLocation?: string;
  views: number;
  likes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const celebrityOutfitSchema = new Schema<ICelebrityOutfit>(
  {
    celebrityId: {
      type: String,
      required: [true, 'Celebrity ID is required'],
      ref: 'Celebrity',
    },
    celebrityName: {
      type: String,
      required: [true, 'Celebrity name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Outfit title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Outfit description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    occasion: {
      type: String,
      enum: ['RED CARPET', 'AIRPORT', 'CASUAL', 'PARTY', 'FORMAL', 'STREET STYLE', 'OTHER'],
      required: [true, 'Occasion is required'],
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      required: [true, 'Price range is required'],
    },
    image: {
      type: String,
      required: [true, 'Outfit image is required'],
    },
    imageAlt: {
      type: String,
      required: [true, 'Image alt text is required'],
      maxlength: [200, 'Image alt text cannot exceed 200 characters'],
    },
    outfitItems: [
      {
        type: {
          type: String,
          required: true,
          trim: true,
        },
        brand: {
          type: String,
          trim: true,
        },
        price: {
          type: String,
          trim: true,
        },
        buyingUrl: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    eventDate: {
      type: Date,
    },
    eventLocation: {
      type: String,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
celebrityOutfitSchema.index({ celebrityName: 1, occasion: 1 });
celebrityOutfitSchema.index({ tags: 1 });
celebrityOutfitSchema.index({ title: 'text', description: 'text' });

const CelebrityOutfit: Model<ICelebrityOutfit> = mongoose.models.CelebrityOutfit || mongoose.model<ICelebrityOutfit>('CelebrityOutfit', celebrityOutfitSchema);

export default CelebrityOutfit;