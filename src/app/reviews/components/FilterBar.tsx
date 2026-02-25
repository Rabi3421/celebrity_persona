"use client";

import { useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { SortOption } from './ReviewsInteractive';

interface FilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  minRating: number | null;
  onMinRatingChange: (r: number | null) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  featuredOnly: boolean;
  onFeaturedChange: (v: boolean) => void;
  total: number;
  loading?: boolean;
}

const RATING_PILLS: { label: string; value: number | null }[] = [
  { label: 'All', value: null },
  { label: '9+', value: 9 },
  { label: '8+', value: 8 },
  { label: '7+', value: 7 },
  { label: '6+', value: 6 },
];

const SORT_OPTS: { label: string; value: SortOption; icon: string }[] = [
  { label: 'Most Recent', value: 'recent', icon: 'ClockIcon' },
  { label: 'Highest Rated', value: 'rating', icon: 'StarIcon' },
  { label: 'A – Z', value: 'title', icon: 'Bars3BottomLeftIcon' },
];

export default function FilterBar({
  search, onSearchChange,
  minRating, onMinRatingChange,
  sort, onSortChange,
  featuredOnly, onFeaturedChange,
  total, loading,
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-8 space-y-4">

      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Icon name="MagnifyingGlassIcon" size={18} className="text-neutral-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search reviews by movie title…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-11 pr-11 py-3.5
            text-white placeholder-neutral-600 font-montserrat text-sm
            focus:outline-none focus:border-yellow-500/60 focus:bg-white/[0.06] transition-all"
        />
        {search && (
          <button
            onClick={() => { onSearchChange(''); inputRef.current?.focus(); }}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500 hover:text-white transition-colors"
          >
            <Icon name="XMarkIcon" size={16} />
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Rating pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-neutral-500 text-xs font-montserrat mr-1">Rating:</span>
          {RATING_PILLS.map(p => (
            <button
              key={p.label}
              onClick={() => onMinRatingChange(p.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-montserrat transition-all border
                ${minRating === p.value
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/25'
                  : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

        {/* Sort buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-xs font-montserrat mr-1">Sort:</span>
          {SORT_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => onSortChange(o.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-montserrat transition-all border
                ${sort === o.value
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/25'
                  : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                }`}
            >
              <Icon name={o.icon} size={12} />
              {o.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

        {/* Featured toggle */}
        <button
          onClick={() => onFeaturedChange(!featuredOnly)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-montserrat transition-all border
            ${featuredOnly
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
            }`}
        >
          <Icon name="StarIcon" variant="solid" size={12}
            className={featuredOnly ? 'text-amber-400' : 'text-neutral-500'} />
          Featured only
        </button>

        {/* Spacer + counter */}
        <div className="flex-1 hidden sm:block" />
        {!loading && (
          <span className="text-neutral-500 text-xs font-montserrat ml-auto">
            <span className="text-white font-semibold">{total.toLocaleString()}</span> review{total !== 1 ? 's' : ''} found
          </span>
        )}

      </div>
    </div>
  );
}
