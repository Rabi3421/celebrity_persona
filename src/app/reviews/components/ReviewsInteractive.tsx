"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import AggregatedScores from './AggregatedScores';
import FilterBar from './FilterBar';
import ReviewsList from './ReviewsList';
import Icon from '@/components/ui/AppIcon';

export interface ReviewItem {
  _id: string;
  title: string;
  slug: string;
  movieTitle: string;
  poster?: string;
  backdropImage?: string;
  rating: number;
  excerpt?: string;
  content?: string;
  verdict?: string;
  featured: boolean;
  publishDate?: string;
  createdAt?: string;
  pros?: string[];
  cons?: string[];
  author?: {
    name: string;
    avatar?: string;
    credentials?: string;
  };
  scores?: {
    criticsScore?: number;
    audienceScore?: number;
    imdbRating?: number;
    rottenTomatoesScore?: number;
  };
  movieDetails?: {
    releaseYear?: number;
    director?: string;
    genre?: string[];
    runtime?: number;
    mpaaRating?: string;
  };
}

export interface ReviewMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type SortOption = 'recent' | 'rating' | 'title';

interface ReviewsInteractiveProps {
  initialReviews?: ReviewItem[];
  initialMeta?: ReviewMeta;
  initialLoaded?: boolean;
}

export default function ReviewsInteractive({
  initialReviews = [],
  initialMeta,
  initialLoaded = false,
}: ReviewsInteractiveProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [meta, setMeta] = useState<ReviewMeta>(
    initialMeta || { total: initialReviews.length, page: 1, limit: 12, pages: 1 }
  );
  const [loading, setLoading] = useState(!initialLoaded && initialReviews.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>('recent');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [queryRevision, setQueryRevision] = useState(0);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '12',
          sort: sort === 'recent' ? 'latest' : sort === 'rating' ? 'rating_high' : 'title',
        });
        if (search.trim()) params.set('search', search.trim());
        if (minRating !== null) params.set('minRating', String(minRating));
        if (featuredOnly) params.set('featured', 'true');

        const res = await fetch(`/api/public/reviews?${params}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);

        const incoming: ReviewItem[] = json.data ?? [];
        setReviews((prev) => (append ? [...prev, ...incoming] : incoming));
        setMeta(json.pagination ?? { total: incoming.length, page, limit: 12, pages: 1 });
      } catch {
        if (!append) {
          setReviews([]);
          setMeta({ total: 0, page: 1, limit: 12, pages: 1 });
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, minRating, sort, featuredOnly]
  );

  useEffect(() => {
    if (queryRevision === 0) return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchReviews(1), 320);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [queryRevision, fetchReviews]);

  const queueFetch = () => setQueryRevision((value) => value + 1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    queueFetch();
  };

  const handleMinRatingChange = (value: number | null) => {
    setMinRating(value);
    queueFetch();
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    queueFetch();
  };

  const handleFeaturedChange = (value: boolean) => {
    setFeaturedOnly(value);
    queueFetch();
  };

  const loadMore = () => fetchReviews(meta.page + 1, true);

  const avg = (values: (number | undefined)[]) => {
    const clean = values.filter((value): value is number => value !== undefined && value !== null);
    return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
  };

  const avgRating = avg(reviews.map((review) => review.rating));
  const avgImdb = avg(reviews.map((review) => review.scores?.imdbRating));
  const avgCritics = avg(reviews.map((review) => review.scores?.criticsScore));
  const avgAudience = avg(reviews.map((review) => review.scores?.audienceScore));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="mb-14">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
          <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-yellow-500">
            Movie Reviews
          </span>
        </div>
        <h1 className="mb-5 font-playfair text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          Reviews &amp;{' '}
          <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Ratings
          </span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-neutral-400">
          Comprehensive critic and audience reviews, aggregated scores, and everything you need
          to decide your next watch.
        </p>
      </div>

      <AggregatedScores
        totalReviews={meta.total}
        avgRating={avgRating}
        avgImdb={avgImdb}
        avgCritics={avgCritics}
        avgAudience={avgAudience}
        loading={loading}
      />

      <div className="relative mb-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center">
          <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-background px-4 py-1.5">
            <Icon name="StarIcon" size={13} className="text-yellow-400" variant="solid" />
            <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Latest Movie Reviews
            </span>
            {!loading && meta.total > 0 && (
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2 py-0.5 font-montserrat text-[10px] font-semibold text-yellow-500">
                {meta.total}
              </span>
            )}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={handleSearchChange}
        minRating={minRating}
        onMinRatingChange={handleMinRatingChange}
        sort={sort}
        onSortChange={handleSortChange}
        featuredOnly={featuredOnly}
        onFeaturedChange={handleFeaturedChange}
        total={meta.total}
        loading={loading}
      />

      <ReviewsList reviews={reviews} loading={loading} />

      {!loading && meta.page < meta.pages && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="font-montserrat text-xs text-neutral-500">
            Showing {reviews.length} of {meta.total} reviews
          </p>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-3 font-montserrat text-sm font-semibold text-white transition-all hover:border-yellow-500/40 hover:bg-white/10 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Icon name="ChevronDownIcon" size={16} />
                Load more reviews
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
