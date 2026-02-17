"use client";

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Review {
  id: string;
  movieTitle: string;
  moviePoster: string;
  moviePosterAlt: string;
  author: string;
  avatar: string;
  avatarAlt: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
  verified: boolean;
}

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const [helpfulClicks, setHelpfulClicks] = useState<Record<string, boolean>>({});

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicks((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {reviews?.map((review, index) => (
        <div
          key={review.id}
          className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Movie Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <AppImage
              src={review.moviePoster}
              alt={review.moviePosterAlt}
              width={60}
              height={90}
              className="rounded-lg w-[60px] h-[90px] object-cover"
            />
            <div>
              <h3 className="text-white font-bold text-lg">{review.movieTitle}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Icon
                      key={starIndex}
                      name="StarIcon"
                      variant={starIndex < review.rating ? 'solid' : 'outline'}
                      size={16}
                      className={
                        starIndex < review.rating ? 'text-primary' : 'text-neutral-600'
                      }
                    />
                  ))}
                </div>
                <span className="text-primary font-bold text-sm">
                  {review.rating}.0
                </span>
              </div>
            </div>
          </div>

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
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-bold">{review.author}</h4>
                  {review.verified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20">
                      <Icon
                        name="CheckBadgeIcon"
                        variant="solid"
                        size={14}
                        className="text-accent"
                      />
                      <span className="text-accent text-xs font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <span className="text-neutral-400 text-sm">
                  {formatDate(review.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <p className="text-neutral-300 leading-relaxed mb-4">{review.content}</p>

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
            <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-full text-neutral-400 hover:text-white transition-all">
              <Icon name="ChatBubbleLeftIcon" variant="outline" size={16} />
              <span className="text-sm font-medium">Reply</span>
            </button>
            <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-full text-neutral-400 hover:text-white transition-all">
              <Icon name="ShareIcon" variant="outline" size={16} />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {reviews.length === 0 && (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Icon
            name="FaceFrownIcon"
            variant="outline"
            size={48}
            className="text-neutral-600 mx-auto mb-4"
          />
          <h3 className="text-white font-bold text-xl mb-2">No Reviews Found</h3>
          <p className="text-neutral-400">
            Try adjusting your filters to see more reviews.
          </p>
        </div>
      )}
    </div>
  );
}