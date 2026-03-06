"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import AggregatedScores from './AggregatedScores';
import FilterBar from './FilterBar';
import ReviewsList from './ReviewsList';
import Icon from '@/components/ui/AppIcon';

/* ── Types ─────────────────────────────────────────────────────────────────── */

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

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ReviewsInteractive() {
  const [reviews, setReviews]           = useState<ReviewItem[]>([]);
  const [meta, setMeta]                 = useState<ReviewMeta>({ total: 0, page: 1, limit: 12, pages: 1 });
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [search, setSearch]             = useState('');
  const [minRating, setMinRating]       = useState<number | null>(null);
  const [sort, setSort]                 = useState<SortOption>('recent');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page:  String(page),
          limit: '12',
          sort:  sort === 'recent' ? 'latest' : sort === 'rating' ? 'rating_high' : 'title',
        });
        if (search.trim())      params.set('search', search.trim());
        if (minRating !== null) params.set('minRating', String(minRating));
        if (featuredOnly)       params.set('featured', 'true');

        const res = await fetch(`/api/v1/reviews?${params}`, {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY ?? '' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load');

        const incoming: ReviewItem[] = json.data ?? [];
        setReviews((prev) => append ? [...prev, ...incoming] : incoming);
        setMeta(json.pagination ?? { total: incoming.length, page, limit: 12, pages: 1 });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, minRating, sort, featuredOnly],
  );

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchReviews(1), 380);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReviews(1); }, [minRating, sort, featuredOnly]);

  const loadMore = () => fetchReviews(meta.page + 1, true);

  const avg = (vals: (number | undefined)[]) => {
    const clean = vals.filter((v): v is number => v !== undefined && v !== null);
    return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : 0;
  };

  const avgRating   = avg(reviews.map(r => r.rating));
  const avgImdb     = avg(reviews.map(r => r.scores?.imdbRating));
  const avgCritics  = avg(reviews.map(r => r.scores?.criticsScore));
  const avgAudience = avg(reviews.map(r => r.scores?.audienceScore));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">

      {/* Hero */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 text-xs font-semibold font-montserrat uppercase tracking-widest">Movie Reviews</span>
        </div>
        <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-5 leading-tight">
          Reviews &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Ratings</span>
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
          Comprehensive critic &amp; audience reviews, aggregated scores, and everything you need to decide your next watch.
        </p>
      </div>

      {/* Aggregated Scores */}
      <AggregatedScores
        totalReviews={meta.total}
        avgRating={avgRating}
        avgImdb={avgImdb}
        avgCritics={avgCritics}
        avgAudience={avgAudience}
        loading={loading}
      />

      {/* Filter bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        sort={sort}
        onSortChange={setSort}
        featuredOnly={featuredOnly}
        onFeaturedChange={setFeaturedOnly}
        total={meta.total}
        loading={loading}
      />

      {/* Reviews */}
      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
          <Icon name="ExclamationCircleIcon" size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-300 font-semibold text-lg mb-1">Failed to load reviews</p>
          <p className="text-neutral-500 text-sm mb-5">{error}</p>
          <button
            onClick={() => fetchReviews(1)}
            className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold font-montserrat hover:bg-yellow-400 transition-all"
          >
            Try again
          </button>
        </div>
      ) : (
        <ReviewsList reviews={reviews} loading={loading} />
      )}

      {/* Load more */}
      {!loading && !error && meta.page < meta.pages && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-neutral-500 text-xs font-montserrat">
            Showing {reviews.length} of {meta.total} reviews
          </p>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-1 inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold font-montserrat text-sm hover:bg-white/10 hover:border-yellow-500/40 transition-all disabled:opacity-50"
          >
            {loadingMore
              ? <><Icon name="ArrowPathIcon" size={16} className="animate-spin" /> Loading…</>
              : <><Icon name="ChevronDownIcon" size={16} /> Load more reviews</>}
          </button>
        </div>
      )}
    </div>
  );
}
