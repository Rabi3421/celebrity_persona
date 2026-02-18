import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMovie extends Document {
  _id: string;
  title: string;
  slug: string;
  description: string;
  synopsis: string;
  director: string;
  genre: string[];
  releaseDate: Date;
  duration: string; // e.g., "2h 49min"
  poster: string;
  posterAlt: string;
  backdrop: string;
  backdropAlt: string;
  trailer?: string;
  cast: {
    actorId?: string;
    name: string;
    character: string;
    image: string;
    imageAlt: string;
  }[];
  ratings: {
    imdb: {
      score: number;
      votes: string;
    };
    rottenTomatoes: {
      critics: number;
      audience: number;
    };
    aggregated: number;
  };
  budget?: string;
  boxOffice?: string;
  language: string;
  country: string;
  productionCompany: string[];
  status: 'UPCOMING' | 'IN_THEATERS' | 'STREAMING' | 'COMPLETED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Movie slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    synopsis: {
      type: String,
      required: [true, 'Movie synopsis is required'],
      maxlength: [2000, 'Synopsis cannot exceed 2000 characters'],
    },
    director: {
      type: String,
      required: [true, 'Director is required'],
      trim: true,
    },
    genre: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    poster: {
      type: String,
      required: [true, 'Movie poster is required'],
    },
    posterAlt: {
      type: String,
      required: [true, 'Poster alt text is required'],
    },
    backdrop: {
      type: String,
      required: [true, 'Backdrop image is required'],
    },
    backdropAlt: {
      type: String,
      required: [true, 'Backdrop alt text is required'],
    },
    trailer: {
      type: String,
      trim: true,
    },
    cast: [
      {
        actorId: {
          type: String,
          ref: 'Celebrity',
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        character: {
          type: String,
          required: true,
          trim: true,
        },
        image: {
          type: String,
          required: true,
        },
        imageAlt: {
          type: String,
          required: true,
        },
      },
    ],
    ratings: {
      imdb: {
        score: {
          type: Number,
          min: 0,
          max: 10,
        },
        votes: {
          type: String,
          trim: true,
        },
      },
      rottenTomatoes: {
        critics: {
          type: Number,
          min: 0,
          max: 100,
        },
        audience: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
      aggregated: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    budget: {
      type: String,
      trim: true,
    },
    boxOffice: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    productionCompany: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['UPCOMING', 'IN_THEATERS', 'STREAMING', 'COMPLETED'],
      required: [true, 'Status is required'],
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
movieSchema.index({ slug: 1 });
movieSchema.index({ genre: 1, status: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ title: 'text', description: 'text', synopsis: 'text' });

const Movie: Model<IMovie> = mongoose.models.Movie || mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;