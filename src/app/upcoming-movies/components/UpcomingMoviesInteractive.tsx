'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

type PersonCredit = {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
  roleName?: string;
};

type Movie = {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  releaseDate?: string;
  releaseDateText?: string;
  releaseYear?: number;
  posterImage?: string;
  posterImageAlt?: string;
  backdropImage?: string;
  genres?: string[];
  languages?: string[];
  ottPlatform?: string;
  streamingPlatform?: string;
  availabilityStatus?: string;
  status?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isEditorPick?: boolean;
  leadCast?: PersonCredit[];
  director?: PersonCredit[];
  trailerUrl?: string;
  whereToWatchText?: string;
};

type Props = {
  initialMovies?: Movie[];
  initialTotal?: number;
  initialPages?: number;
  initialPage?: number;
  initialLoaded?: boolean;
};

function formatDate(movie: Movie) {
  if (movie.releaseDateText) return movie.releaseDateText;
  if (!movie.releaseDate) return 'Release date TBA';
  const date = new Date(movie.releaseDate);
  if (Number.isNaN(date.getTime())) return 'Release date TBA';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function labelize(value?: string) {
  return value ? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';
}

export default function UpcomingMoviesInteractive({
  initialMovies = [],
  initialTotal = 0,
  initialPages = 1,
  initialPage = 1,
}: Props) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(initialPages);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    genre: 'all',
    language: 'all',
    releaseYear: 'all',
    ottPlatform: 'all',
    availabilityStatus: 'all',
    sort: 'latest',
  });

  const featuredMovie = movies.find((movie) => movie.isFeatured) || movies[0];
  const trendingMovies = movies.filter((movie) => movie.isTrending).slice(0, 6);

  const options = useMemo(
    () => ({
      genres: Array.from(new Set(movies.flatMap((movie) => movie.genres || []))).sort(),
      languages: Array.from(new Set(movies.flatMap((movie) => movie.languages || []))).sort(),
      years: Array.from(new Set(movies.map((movie) => movie.releaseYear).filter(Boolean))).sort(),
      platforms: Array.from(
        new Set(
          movies
            .map((movie) => movie.ottPlatform || movie.streamingPlatform)
            .filter(Boolean) as string[]
        )
      ).sort(),
    }),
    [movies]
  );

  const fetchMovies = useCallback(
    async (nextPage = 1, nextFilters = filters) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: '12',
          sort: nextFilters.sort,
        });
        for (const [key, value] of Object.entries(nextFilters)) {
          if (value && value !== 'all' && key !== 'sort') params.set(key, value);
        }
        const response = await fetch(`/api/user/movies/upcoming?${params}`, {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '' },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load movies');
        setMovies(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setPage(data.page || nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const setFilter = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key !== 'q') fetchMovies(1, next);
  };

  return (
    <>
      {featuredMovie && (
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            {featuredMovie.backdropImage || featuredMovie.posterImage ? (
              <Image
                src={featuredMovie.backdropImage || featuredMovie.posterImage!}
                alt={featuredMovie.posterImageAlt || featuredMovie.title}
                fill
                priority
                className="object-cover opacity-40"
                sizes="100vw"
              />
            ) : (
              <div className="h-full bg-neutral-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/85 to-background" />
          </div>
          <div className="container relative mx-auto grid min-h-[520px] items-end gap-8 px-4 pb-12 pt-24 md:grid-cols-[240px_1fr]">
            {featuredMovie.posterImage && (
              <div className="relative hidden aspect-[2/3] overflow-hidden rounded-lg border border-white/15 shadow-2xl md:block">
                <Image
                  src={featuredMovie.posterImage}
                  alt={featuredMovie.posterImageAlt || `${featuredMovie.title} poster`}
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </div>
            )}
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                  Featured Upcoming Movie
                </span>
                {featuredMovie.availabilityStatus && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                    {labelize(featuredMovie.availabilityStatus)}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black text-white md:text-6xl">{featuredMovie.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-200">
                {featuredMovie.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-neutral-300">
                <span>{formatDate(featuredMovie)}</span>
                {(featuredMovie.genres || []).slice(0, 3).map((genre) => (
                  <span key={genre}>/ {genre}</span>
                ))}
                {(featuredMovie.languages || []).slice(0, 2).map((language) => (
                  <span key={language}>/ {language}</span>
                ))}
                {(featuredMovie.ottPlatform || featuredMovie.streamingPlatform) && (
                  <span>/ {featuredMovie.ottPlatform || featuredMovie.streamingPlatform}</span>
                )}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/upcoming-movies/${featuredMovie.slug}`}
                  className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400"
                >
                  View Details
                </Link>
                {featuredMovie.trailerUrl && (
                  <a
                    href={featuredMovie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sticky top-16 z-20 border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="container mx-auto grid gap-3 px-4 py-4 md:grid-cols-[1.6fr_repeat(5,1fr)_auto]">
          <input
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') fetchMovies(1);
            }}
            placeholder="Search by title, actor, director"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/60"
          />
          <select
            value={filters.genre}
            onChange={(event) => setFilter('genre', event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Genres</option>
            {options.genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filters.language}
            onChange={(event) => setFilter('language', event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Languages</option>
            {options.languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filters.releaseYear}
            onChange={(event) => setFilter('releaseYear', event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Years</option>
            {options.years.map((item) => (
              <option key={item} value={String(item)}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filters.ottPlatform}
            onChange={(event) => setFilter('ottPlatform', event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Platforms</option>
            {options.platforms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filters.availabilityStatus}
            onChange={(event) => setFilter('availabilityStatus', event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">Availability</option>
            {[
              'coming_soon',
              'in_cinemas',
              'streaming_soon',
              'now_streaming',
              'tickets_open',
              'watchlist_available',
              'release_date_not_confirmed',
              'postponed',
            ].map((item) => (
              <option key={item} value={item}>
                {labelize(item)}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchMovies(1)}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
          >
            Search
          </button>
        </div>
      </section>

      {trendingMovies.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <h2 className="mb-4 text-2xl font-bold text-white">Trending Upcoming Movies</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {trendingMovies.map((movie) => (
              <Link key={movie._id} href={`/upcoming-movies/${movie.slug}`} className="group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                  {movie.posterImage && (
                    <Image
                      src={movie.posterImage}
                      alt={movie.posterImageAlt || `${movie.title} poster`}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="16vw"
                    />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold text-white group-hover:text-yellow-300">
                  {movie.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Latest Upcoming Movies</h2>
          <p className="text-sm text-neutral-500">
            Showing {movies.length} of {total}
          </p>
        </div>
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        {loading && <div className="py-12 text-center text-neutral-400">Loading movies...</div>}
        {!loading && movies.length === 0 && (
          <div className="py-12 text-center text-neutral-400">No upcoming movies found.</div>
        )}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {movies.map((movie) => (
            <article
              key={movie._id}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
            >
              <Link
                href={`/upcoming-movies/${movie.slug}`}
                className="relative block aspect-[16/10] bg-white/5"
              >
                {movie.posterImage || movie.backdropImage ? (
                  <Image
                    src={movie.backdropImage || movie.posterImage!}
                    alt={movie.posterImageAlt || `${movie.title} movie image`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : null}
              </Link>
              <div className="p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  {(movie.genres || []).slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-200"
                    >
                      {genre}
                    </span>
                  ))}
                  {movie.availabilityStatus && (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-neutral-200">
                      {labelize(movie.availabilityStatus)}
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-2 text-xl font-bold text-white">
                  <Link href={`/upcoming-movies/${movie.slug}`}>{movie.title}</Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-400">
                  {movie.excerpt}
                </p>
                <dl className="mt-4 space-y-1 text-xs text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Release:</span> {formatDate(movie)}
                  </div>
                  {(movie.languages || []).length > 0 && (
                    <div>
                      <span className="text-neutral-500">Language:</span>{' '}
                      {(movie.languages || []).slice(0, 3).join(', ')}
                    </div>
                  )}
                  {(movie.ottPlatform || movie.streamingPlatform) && (
                    <div>
                      <span className="text-neutral-500">Platform:</span>{' '}
                      {movie.ottPlatform || movie.streamingPlatform}
                    </div>
                  )}
                  {(movie.leadCast || []).length > 0 && (
                    <div>
                      <span className="text-neutral-500">Cast:</span>{' '}
                      {(movie.leadCast || [])
                        .slice(0, 3)
                        .map((item) => item.name)
                        .join(', ')}
                    </div>
                  )}
                </dl>
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/upcoming-movies/${movie.slug}`}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-white/15"
                  >
                    View Details
                  </Link>
                  {movie.trailerUrl && (
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10"
                    >
                      Trailer
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => fetchMovies(page - 1)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-4 py-2 text-sm text-neutral-500">
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages || loading}
              onClick={() => fetchMovies(page + 1)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </>
  );
}
