import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICelebrity extends Document {
  _id: string;
  name: string;
  profession: string;
  bio: string;
  birthDate?: Date;
  birthPlace?: string;
  nationality?: string;
  height?: string;
  awards: string[];
  socialMedia: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    instagramFollowers?: string;
  };
  image: string;
  imageAlt: string;
  latestProject: string;
  netWorth?: string;
  category: 'movie' | 'music' | 'sports' | 'fashion' | 'tv' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const celebritySchema = new Schema<ICelebrity>(
  {
    name: {
      type: String,
      required: [true, 'Celebrity name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    profession: {
      type: String,
      required: [true, 'Profession is required'],
      trim: true,
      maxlength: [100, 'Profession cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      required: [true, 'Biography is required'],
      minlength: [50, 'Biography must be at least 50 characters'],
      maxlength: [2000, 'Biography cannot exceed 2000 characters'],
    },
    birthDate: {
      type: Date,
    },
    birthPlace: {
      type: String,
      trim: true,
      maxlength: [100, 'Birth place cannot exceed 100 characters'],
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [50, 'Nationality cannot exceed 50 characters'],
    },
    height: {
      type: String,
      trim: true,
      maxlength: [20, 'Height cannot exceed 20 characters'],
    },
    awards: [
      {
        type: String,
        trim: true,
      },
    ],
    socialMedia: {
      instagram: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
      instagramFollowers: {
        type: String,
        trim: true,
      },
    },
    image: {
      type: String,
      required: [true, 'Celebrity image is required'],
    },
    imageAlt: {
      type: String,
      required: [true, 'Image alt text is required'],
      maxlength: [200, 'Image alt text cannot exceed 200 characters'],
    },
    latestProject: {
      type: String,
      required: [true, 'Latest project is required'],
      trim: true,
      maxlength: [150, 'Latest project cannot exceed 150 characters'],
    },
    netWorth: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['movie', 'music', 'sports', 'fashion', 'tv', 'other'],
      required: [true, 'Category is required'],
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

// Index for search functionality
celebritySchema.index({ name: 'text', profession: 'text', bio: 'text' });

const Celebrity: Model<ICelebrity> = mongoose.models.Celebrity || mongoose.model<ICelebrity>('Celebrity', celebritySchema);

export default Celebrity;