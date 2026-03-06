import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserReview extends Document {
  reviewId:   mongoose.Types.ObjectId;  // ref → MovieReview
  reviewSlug: string;                   // denormalised for easy query
  userId:     mongoose.Types.ObjectId;
  userName:   string;
  userAvatar?: string;
  rating:     number;   // 1-10
  title?:     string;
  body:       string;
  helpful:    mongoose.Types.ObjectId[];
  createdAt:  Date;
  updatedAt:  Date;
}

const userReviewSchema = new Schema<IUserReview>(
  {
    reviewId:   { type: Schema.Types.ObjectId, ref: 'MovieReview', required: true, index: true },
    reviewSlug: { type: String, required: true, index: true },
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:   { type: String, required: true },
    userAvatar: { type: String },
    rating:     { type: Number, required: true, min: 1, max: 10 },
    title:      { type: String, maxlength: 200 },
    body:       { type: String, required: true, maxlength: 2000 },
    helpful:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// one review per user per movie-review
userReviewSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const UserReview: Model<IUserReview> =
  mongoose.models.UserReview ||
  mongoose.model<IUserReview>('UserReview', userReviewSchema);

export default UserReview;
