import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICelebrityNews extends Document {
  _id: string;
  headline: string;
  slug: string;
  excerpt: string;
  content: string;
  celebrity: string;
  celebrityId?: string;
  author: string;
  publishDate: Date;
  category: 'MOVIES' | 'MUSIC' | 'FASHION' | 'LIFESTYLE' | 'AWARDS' | 'RELATIONSHIPS' | 'CAREER' | 'OTHER';
  thumbnail: string;
  thumbnailAlt: string;
  readTime: string;
  tags: string[];
  views: number;
  likes: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const celebrityNewsSchema = new Schema<ICelebrityNews>(
  {
    headline: {
      type: String,
      required: [true, 'News headline is required'],
      trim: true,
      maxlength: [200, 'Headline cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'News slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'News excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'News content is required'],
      minlength: [100, 'Content must be at least 100 characters'],
    },
    celebrity: {
      type: String,
      required: [true, 'Celebrity name is required'],
      trim: true,
    },
    celebrityId: {
      type: String,
      ref: 'Celebrity',
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    publishDate: {
      type: Date,
      required: [true, 'Publish date is required'],
    },
    category: {
      type: String,
      enum: ['MOVIES', 'MUSIC', 'FASHION', 'LIFESTYLE', 'AWARDS', 'RELATIONSHIPS', 'CAREER', 'OTHER'],
      required: [true, 'Category is required'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail image is required'],
    },
    thumbnailAlt: {
      type: String,
      required: [true, 'Thumbnail alt text is required'],
      maxlength: [200, 'Thumbnail alt text cannot exceed 200 characters'],
    },
    readTime: {
      type: String,
      required: [true, 'Read time is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
celebrityNewsSchema.index({ slug: 1 });
celebrityNewsSchema.index({ celebrity: 1, category: 1 });
celebrityNewsSchema.index({ publishDate: -1 });
celebrityNewsSchema.index({ headline: 'text', excerpt: 'text', content: 'text' });

const CelebrityNews: Model<ICelebrityNews> = mongoose.models.CelebrityNews || mongoose.model<ICelebrityNews>('CelebrityNews', celebrityNewsSchema);

export default CelebrityNews;