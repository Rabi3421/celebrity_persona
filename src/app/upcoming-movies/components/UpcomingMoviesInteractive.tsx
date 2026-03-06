'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ── Types matching the real API payload ───────────────────────────────────────
interface CastMember {
  _id: string;
  name: string;
  role?: string;
  character?: string;
  image?: string;
  celebrityId?: string;
}

interface TicketLink {
  _id: string;
  platform: string;
  url: string;
  available: boolean;
}

interface Movie {
  _id: string;
  title: string;
  slug: string;
  releaseDate?: string;
  poster?: string;
  backdrop?: string;
  language?: string | string[];
  originalLanguage?: string;
  worldwide?: boolean;
  genre?: string[];
  director?: string;
  writers?: string[];
  producers?: string[];
  cast?: CastMember[];
  synopsis?: string;
  plotSummary?: string;
  productionNotes?: string;
  status?: string;
  anticipationScore?: number;
  duration?: number;
  mpaaRating?: string;
  regions?: string[];
  subtitles?: string[];
  budget?: number;
  boxOfficeProjection?: number;
  featured?: boolean;
  images?: string[];
  studio?: string;
  trailer?: string;
  ticketLinks?: TicketLink[];
  preOrderAvailable?: boolean;
  seoData?: { metaTitle?: string; metaDescription?: string; keywords?: string[] };
  createdAt?: string;
  updatedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCountdown(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'TBA';
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Released';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'TBA';
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatBudget(n?: number): string {
  if (!n || n === 0) return 'N/A';
  if (n >= 1_00_00_00_000) return `₹${(n / 1_00_00_00_000).toFixed(1)}B`;
  if (n >= 1_00_00_000)    return `₹${(n / 1_00_00_000).toFixed(0)}Cr`;
  if (n >= 1_00_00_000_000) return `$${(n / 1_00_00_000_000).toFixed(1)}B`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function normalizeLanguages(lang?: string | string[]): string[] {
  if (!lang) return [];
  if (Array.isArray(lang)) return lang;
  return [lang];
}

function scoreColor(score?: number): string {
  if (!score) return 'text-neutral-400';
  if (score >= 9)  return 'text-emerald-400';
  if (score >= 7)  return 'text-yellow-400';
  if (score >= 5)  return 'text-orange-400';
  return 'text-red-400';
}

function scoreBar(score?: number): number {
  return Math.round(((score ?? 0) / 10) * 100);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UpcomingMoviesInteractive() {
  const [movies, setMovies]           = useState<Movie[]>([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const router = useRouter();
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [sortBy, setSortBy]           = useState('anticipation');

  // Collect all genres from loaded movies for the filter dropdown
  const allGenres = Array.from(
    new Set(movies.flatMap(m => m.genre ?? []))
  ).sort();

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchMovies = useCallback(async (
    p = 1, q = searchTerm, genre = filterGenre, sort = sortBy
  ) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page:  String(p),
        limit: '12',
        sort,
      });
      if (q.trim())               params.set('q', q.trim());
      if (genre && genre !== 'all') params.set('genre', genre);

      const res = await fetch(`/api/user/movies/upcoming?${params}`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY ?? '' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setMovies(data.data ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterGenre, sortBy]);

  useEffect(() => { fetchMovies(1); }, [fetchMovies]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchMovies(1, searchTerm, filterGenre, sortBy), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const highlyAnticipated = movies.filter(m => (m.anticipationScore ?? 0) >= 8).length;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading && movies.length === 0) {
    return (
      <>
        {/* Hero skeleton */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
          <div className="absolute inset-0 bg-black/30" />
          <div className="container mx-auto px-4 py-20 relative z-10 text-center max-w-4xl mx-auto animate-pulse">
            <div className="h-16 bg-white/20 rounded-2xl w-2/3 mx-auto mb-6" />
            <div className="h-6  bg-white/15 rounded w-3/4 mx-auto mb-4" />
            <div className="h-6  bg-white/15 rounded w-1/2 mx-auto" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white/5 animate-pulse">
              <div className="h-72 bg-white/10" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-6 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Upcoming Movies 2026
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Discover the most anticipated films of the year. From blockbuster spectacles to indie masterpieces.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🎬 {total} Movie{total !== 1 ? 's' : ''}
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🏆 {highlyAnticipated} Highly Anticipated
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🎭 {allGenres.length} Genres
              </span>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Filters ── */}
      <section className="container mx-auto px-4 py-6 sticky top-24 bg-background/95 backdrop-blur-sm z-20 border-b border-white/10">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search movies, directors, actors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 text-sm w-64"
              />
            </div>

            {/* Genre */}
            <select
              value={filterGenre}
              onChange={e => { setFilterGenre(e.target.value); fetchMovies(1, searchTerm, e.target.value, sortBy); }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
            >
              <option value="all">All Genres</option>
              {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); fetchMovies(1, searchTerm, filterGenre, e.target.value); }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
            >
              <option value="anticipation">Most Anticipated</option>
              <option value="release">Release Date</option>
            </select>
          </div>

          <p className="text-sm text-neutral-500">
            Showing {movies.length} of {total} movies
          </p>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
            <span>⚠️</span> {error}
            <button onClick={() => fetchMovies(1)} className="ml-auto text-yellow-400 hover:underline text-xs">Retry</button>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <section className="container mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterGenre + sortBy + page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {movies.length === 0 && !loading && (
              <div className="col-span-3 py-20 text-center text-neutral-500">
                <div className="text-5xl mb-4">🎬</div>
                <p className="text-lg">No movies found. Try a different search or filter.</p>
              </div>
            )}

            {movies.map((movie, index) => (
              <motion.article
                key={movie._id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/upcoming-movies/${movie.slug || movie._id}`)}
              >
                {/* Poster */}
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
                  {movie.poster ? (
                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl text-neutral-600">🎬</div>
                  )}

                  {/* Backdrop gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                    {formatCountdown(movie.releaseDate)}
                  </div>
                  {movie.anticipationScore !== undefined && (
                    <div className={`absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${scoreColor(movie.anticipationScore)}`}>
                      ★ {movie.anticipationScore.toFixed(1)}
                    </div>
                  )}

                  {/* Featured badge */}
                  {movie.featured && (
                    <div className="absolute top-10 right-3 mt-1 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}

                  {/* Bottom info strip */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {movie.mpaaRating && (
                      <span className="inline-block bg-black/60 border border-white/20 text-white text-xs px-2 py-0.5 rounded mr-2">
                        {movie.mpaaRating}
                      </span>
                    )}
                    {movie.duration && (
                      <span className="inline-block bg-black/60 border border-white/20 text-white text-xs px-2 py-0.5 rounded">
                        ⏱ {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                      </span>
                    )}
                  </div>

                  {/* Hover overlay — trailer button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    {movie.trailer ? (
                      <a
                        href={movie.trailer}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors"
                      >
                        ▶ Watch Trailer
                      </a>
                    ) : (
                      <span className="bg-white/20 text-white px-5 py-2.5 rounded-full text-sm">View Details →</span>
                    )}
                  </motion.div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(movie.genre ?? []).slice(0, 3).map(g => (
                      <span key={g} className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full capitalize">
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {movie.title}
                  </h2>

                  {/* Synopsis */}
                  <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2 mb-4">
                    {movie.synopsis || movie.plotSummary || 'No synopsis available.'}
                  </p>

                  {/* Meta grid */}
                  <div className="space-y-1.5 text-xs text-neutral-400 mb-4">
                    {movie.director && (
                      <div className="flex gap-2">
                        <span className="text-neutral-500 w-14 shrink-0">Director</span>
                        <span className="text-neutral-200 truncate">{movie.director}</span>
                      </div>
                    )}
                    {(movie.cast ?? []).length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-neutral-500 w-14 shrink-0">Cast</span>
                        <span className="text-neutral-200 truncate">
                          {(movie.cast ?? []).slice(0, 3).map(c => c.name).join(', ')}
                          {(movie.cast ?? []).length > 3 ? ` +${(movie.cast ?? []).length - 3}` : ''}
                        </span>
                      </div>
                    )}
                    {movie.studio && (
                      <div className="flex gap-2">
                        <span className="text-neutral-500 w-14 shrink-0">Studio</span>
                        <span className="text-neutral-200 truncate">{movie.studio}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-14 shrink-0">Release</span>
                      <span className="text-neutral-200">{formatFullDate(movie.releaseDate)}</span>
                    </div>
                  </div>

                  {/* Anticipation bar */}
                  {movie.anticipationScore !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-500">Anticipation</span>
                        <span className={`font-bold ${scoreColor(movie.anticipationScore)}`}>
                          {movie.anticipationScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scoreBar(movie.anticipationScore)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className={`h-full rounded-full ${
                            (movie.anticipationScore ?? 0) >= 9 ? 'bg-emerald-500' :
                            (movie.anticipationScore ?? 0) >= 7 ? 'bg-yellow-500' :
                            (movie.anticipationScore ?? 0) >= 5 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ticket links or pre-order */}
                  {(movie.ticketLinks ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(movie.ticketLinks ?? []).filter(t => t.available).slice(0, 2).map(t => (
                        <a
                          key={t._id}
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 text-center text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg transition-colors"
                        >
                          🎟 {t.platform}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <button
                      className="w-full text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 py-2 rounded-lg transition-colors"
                      onClick={e => { e.stopPropagation(); router.push(`/upcoming-movies/${movie.slug || movie._id}`); }}
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <button
              onClick={() => fetchMovies(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all text-sm"
            >
              ← Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchMovies(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  p === page
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchMovies(page + 1)}
              disabled={page >= pages || loading}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all text-sm"
            >
              Next →
            </button>
          </div>
        )}
      </section>

    </>
  );
}
