"use client";

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Review {
  id: string;
  author: string;
  avatar: string;
  avatarAlt: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}

interface UserReviewsProps {
  reviews: Review[];
}

export default function UserReviews({ reviews }: UserReviewsProps) {
  const [helpfulClicks, setHelpfulClicks] = useState<Record<string, boolean>>({});

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicks((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-card p-8 rounded-3xl animate-fade-in-up delay-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-playfair text-3xl font-bold text-white">
          User Reviews
        </h2>
        <button className="glass-card px-5 py-2.5 rounded-full hover:glow-gold transition-all flex items-center gap-2">
          <Icon name="PencilIcon" size={18} className="text-primary" />
          <span className="text-white text-sm font-medium">Write Review</span>
        </button>
      </div>

      <div className="space-y-6">
        {reviews?.map((review) => (
          <div
            key={review.id}
            className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all"
          >
            {/* Review Header */}
            <div className="flex items-start gap-4 mb-4">
              <AppImage
                src={review.avatar}
                alt={review.avatarAlt}
                width={50}
                height={50}
                className="rounded-full w-[50px] h-[50px] object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold">{review.author}</h3>
                  <span className="text-neutral-400 text-sm">
                    {formatDate(review.date)}
                  </span>
                </div>
                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon
                      key={index}
                      name="StarIcon"
                      variant={index < review.rating ? 'solid' : 'outline'}
                      size={16}
                      className={
                        index < review.rating ? 'text-primary' : 'text-neutral-600'
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Review Content */}
            <p className="text-neutral-300 leading-relaxed mb-4">
              {review.content}
            </p>

            {/* Review Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleHelpful(review.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  helpfulClicks[review.id]
                    ? 'bg-primary/20 text-primary' :'glass-card text-neutral-400 hover:text-white'
                }`}
              >
                <Icon
                  name="HandThumbUpIcon"
                  variant={helpfulClicks[review.id] ? 'solid' : 'outline'}
                  size={16}
                />
                <span className="text-sm font-medium">
                  Helpful ({review.helpful + (helpfulClicks[review.id] ? 1 : 0)})
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}