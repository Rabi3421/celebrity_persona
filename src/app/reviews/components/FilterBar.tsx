"use client";

import Icon from '@/components/ui/AppIcon';

interface FilterBarProps {
  selectedRating: number | null;
  onRatingChange: (rating: number | null) => void;
  sortBy: 'recent' | 'helpful' | 'rating';
  onSortChange: (sort: 'recent' | 'helpful' | 'rating') => void;
  totalReviews: number;
}

export default function FilterBar({
  selectedRating,
  onRatingChange,
  sortBy,
  onSortChange,
  totalReviews,
}: FilterBarProps) {
  const ratingOptions = [5, 4, 3, 2, 1];

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 animate-fade-in-up delay-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Filter by Rating */}
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="FunnelIcon" size={16} className="text-primary" />
            Filter by Rating
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onRatingChange(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedRating === null
                  ? 'bg-primary text-black' :'glass-card text-neutral-300 hover:text-white'
              }`}
            >
              All
            </button>
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                onClick={() => onRatingChange(rating)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedRating === rating
                    ? 'bg-primary text-black' :'glass-card text-neutral-300 hover:text-white'
                }`}
              >
                <Icon
                  name="StarIcon"
                  variant="solid"
                  size={14}
                  className={selectedRating === rating ? 'text-black' : 'text-primary'}
                />
                {rating}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="ArrowsUpDownIcon" size={16} className="text-primary" />
            Sort By
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSortChange('recent')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'recent' ?'bg-primary text-black' :'glass-card text-neutral-300 hover:text-white'
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => onSortChange('helpful')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'helpful' ?'bg-primary text-black' :'glass-card text-neutral-300 hover:text-white'
              }`}
            >
              Most Helpful
            </button>
            <button
              onClick={() => onSortChange('rating')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'rating' ?'bg-primary text-black' :'glass-card text-neutral-300 hover:text-white'
              }`}
            >
              Highest Rated
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-neutral-400 text-sm">
          Showing <span className="text-white font-bold">{totalReviews}</span> reviews
        </p>
      </div>
    </div>
  );
}