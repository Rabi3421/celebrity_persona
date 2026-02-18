import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMovieReview extends Document {
  _id: string;
  movieId: string;
  movieTitle: string;
  reviewerName: string;
  reviewerType: 'CRITIC' | 'USER' | 'EXPERT';
  reviewerAvatar?: string;
  title: string;
  content: string;
  rating: number; // 1-10 scale
  pros: string[];
  cons: string[];
  publishDate: Date;
  source?: string; // e.g., "Rolling Stone", "IMDb"
  likes: number;
  dislikes: number;
  helpfulVotes: number;
  isVerified: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const movieReviewSchema = new Schema<IMovieReview>(
  {
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      ref: 'Movie',
    },
    movieTitle: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    reviewerName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
    },
    reviewerType: {
      type: String,
      enum: ['CRITIC', 'USER', 'EXPERT'],
      required: [true, 'Reviewer type is required'],
    },
    reviewerAvatar: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      minlength: [50, 'Content must be at least 50 characters'],
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot exceed 10'],
    },
    pros: [
      {
        type: String,
        trim: true,
      },
    ],
    cons: [
      {
        type: String,
        trim: true,
      },
    ],
    publishDate: {
      type: Date,
      required: [true, 'Publish date is required'],
    },
    source: {
      type: String,
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
movieReviewSchema.index({ movieId: 1, rating: -1 });
movieReviewSchema.index({ publishDate: -1 });
movieReviewSchema.index({ reviewerType: 1 });
movieReviewSchema.index({ title: 'text', content: 'text' });

const MovieReview: Model<IMovieReview> = mongoose.models.MovieReview || mongoose.model<IMovieReview>('MovieReview', movieReviewSchema);

export default MovieReview;