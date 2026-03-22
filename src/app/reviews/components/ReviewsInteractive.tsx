"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

export interface AvailableMovie {
  _id: string;
  title: string;
  slug: string;
  releaseDate?: string;
  poster?: string;
  backdrop?: string;
  genre?: string[];
  director?: string;
  status?: string;
  anticipationScore?: number;
  duration?: number;
  mpaaRating?: string;
  language?: string | string[];
  featured?: boolean;
  studio?: string;
  createdAt?: string;
}

export interface ReviewMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type SortOption = 'recent' | 'rating' | 'title';

/* ── Available-for-Review Card ─────────────────────────────────────────────── */

function AvailableMovieCard({ movie }: { movie: AvailableMovie }) {
  const langs = Array.isArray(movie.language)
    ? movie.language
    : movie.language
    ? [movie.language]
    : [];

  const releasedOn = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/upcoming-movies/${movie.slug}`}
      className="group flex gap-4 p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20
        hover:bg-emerald-500/[0.08] hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-emerald-500/[0.06] to-transparent pointer-events-none" />

      {/* Poster */}
      <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-white/[0.06]">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="FilmIcon" size={24} className="text-neutral-600" />
          </div>
        )}
        {/* "No Review Yet" badge */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center px-1">
            <Icon name="PencilSquareIcon" size={18} className="text-emerald-400 mx-auto mb-0.5" />
            <span className="text-[8px] text-emerald-300 font-montserrat font-semibold leading-tight block">
              View Movie
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 self-start mb-2">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[9px] font-semibold font-montserrat uppercase tracking-wider">
            Available for Review
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-sm font-playfair leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-300 transition-colors">
          {movie.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px] font-montserrat text-neutral-500">
          {movie.director && (
            <span className="flex items-center gap-1">
              <Icon name="UserIcon" size={9} />
              {movie.director}
            </span>
          )}
          {releasedOn && (
            <span className="flex items-center gap-1">
              <Icon name="CalendarIcon" size={9} />
              Released {releasedOn}
            </span>
          )}
          {langs.length > 0 && (
            <span className="text-neutral-600">
              {langs.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>

        {/* Genre pills */}
        {(movie.genre?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {movie.genre!.slice(0, 3).map(g => (
              <span key={g}
                className="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-medium
                  bg-white/[0.06] text-neutral-400 border border-white/[0.08]">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function AvailableMoviesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse">
          <div className="w-20 h-28 rounded-xl bg-white/[0.06] shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-3 bg-white/[0.06] rounded-full w-24" />
            <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
            <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
            <div className="flex gap-1 pt-1">
              <div className="h-4 w-12 rounded-full bg-white/[0.06]" />
              <div className="h-4 w-16 rounded-full bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ReviewsInteractive() {
  const [reviews, setReviews]                       = useState<ReviewItem[]>([]);
  const [meta, setMeta]                             = useState<ReviewMeta>({ total: 0, page: 1, limit: 12, pages: 1 });
  const [loading, setLoading]                       = useState(true);
  const [loadingMore, setLoadingMore]               = useState(false);
  const [error, setError]                           = useState<string | null>(null);

  const [availableMovies, setAvailableMovies]       = useState<AvailableMovie[]>([]);
  const [availableLoading, setAvailableLoading]     = useState(true);
  const [availableError, setAvailableError]         = useState<string | null>(null);
  const [showAllAvailable, setShowAllAvailable]     = useState(false);

  const [search, setSearch]             = useState('');
  const [minRating, setMinRating]       = useState<number | null>(null);
  const [sort, setSort]                 = useState<SortOption>('recent');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch published reviews ──────────────────────────────────────────────── */
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

  /* ── Fetch movies available for review (released, no review yet) ─────────── */
  const fetchAvailableMovies = useCallback(async () => {
    setAvailableLoading(true);
    setAvailableError(null);
    try {
      const res = await fetch('/api/user/movies/available-for-review?limit=20&sort=release', {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY ?? '' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load');
      setAvailableMovies(json.data ?? []);
    } catch (e: unknown) {
      setAvailableError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setAvailableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableMovies();
  }, [fetchAvailableMovies]);

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

  const displayedAvailable = showAllAvailable ? availableMovies : availableMovies.slice(0, 4);

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

      {/* ── Available for Review Section ─────────────────────────────────────── */}
      {(availableLoading || availableMovies.length > 0) && (
        <div className="mb-14">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Icon name="ClockIcon" size={16} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg font-playfair">
                  Available for Review
                </h2>
                <p className="text-neutral-500 text-xs font-montserrat">
                  Recently released movies waiting to be reviewed
                </p>
              </div>
              {!availableLoading && availableMovies.length > 0 && (
                <span className="ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-montserrat bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {availableMovies.length}
                </span>
              )}
            </div>

            {!availableLoading && availableMovies.length > 4 && (
              <button
                onClick={() => setShowAllAvailable(v => !v)}
                className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold font-montserrat hover:text-emerald-300 transition-colors"
              >
                {showAllAvailable ? (
                  <><Icon name="ChevronUpIcon" size={13} /> Show less</>
                ) : (
                  <><Icon name="ChevronDownIcon" size={13} /> See all {availableMovies.length}</>
                )}
              </button>
            )}
          </div>

          {availableError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-red-300 text-sm font-montserrat">{availableError}</p>
              <button
                onClick={fetchAvailableMovies}
                className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-montserrat hover:bg-red-500/20 transition-all"
              >
                Retry
              </button>
            </div>
          ) : availableLoading ? (
            <AvailableMoviesSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedAvailable.map(movie => (
                  <AvailableMovieCard key={movie._id} movie={movie} />
                ))}
              </div>
              {!showAllAvailable && availableMovies.length > 4 && (
                <p className="text-center text-neutral-600 text-xs font-montserrat mt-4">
                  + {availableMovies.length - 4} more movies waiting for a review
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      {(availableLoading || availableMovies.length > 0) && (
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-background border border-white/[0.08]">
              <Icon name="StarIcon" size={13} className="text-yellow-400" variant="solid" />
              <span className="text-neutral-400 text-xs font-semibold font-montserrat uppercase tracking-widest">
                Published Reviews
              </span>
              {!loading && meta.total > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                  {meta.total}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
