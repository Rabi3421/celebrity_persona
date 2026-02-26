"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Movie {
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
  trailer?: string;
  synopsis?: string;
  likeCount: number;
  saveCount: number;
  commentCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return 'TBA';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? 'TBA' : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(min?: number) {
  if (!min) return null;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function scoreColor(s?: number) {
  if (!s) return 'text-neutral-400';
  if (s >= 8.5) return 'text-emerald-400';
  if (s >= 7)   return 'text-yellow-400';
  if (s >= 5)   return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(s?: number) {
  if (!s) return 'bg-neutral-800 border-neutral-700';
  if (s >= 8.5) return 'bg-emerald-500/20 border-emerald-500/40';
  if (s >= 7)   return 'bg-yellow-500/20 border-yellow-500/40';
  if (s >= 5)   return 'bg-orange-500/20 border-orange-500/40';
  return 'bg-red-500/20 border-red-500/40';
}

const GENRES = ['All', 'Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Adventure', 'Crime', 'Fantasy'];
const SORTS  = [
  { value: 'latest',  label: 'Latest Added' },
  { value: 'release', label: 'Release Date'  },
  { value: 'score',   label: 'Top Rated'     },
  { value: 'title',   label: 'A → Z'         },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function MovieDetailsInteractive() {
  const router = useRouter();
  const { isAuthenticated, authHeaders, accessToken } = useAuth();

  const [movies,     setMovies]     = useState<Movie[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [genre,      setGenre]      = useState('All');
  const [sort,       setSort]       = useState('latest');
  const [view,       setView]       = useState<'grid' | 'list'>('grid');
  const [featured,   setFeatured]   = useState<Movie | null>(null);
  const [interactions, setInteractions] = useState<Record<string, { liked: boolean; saved: boolean }>>({});
  const [acting, setActing] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMovies = useCallback(async (p = 1, q = '', g = 'All', s = 'latest') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p), limit: '12', sort: s,
        ...(q ? { search: q } : {}),
        ...(g && g !== 'All' ? { genre: g } : {}),
      });
      const res  = await fetch(`/api/user/movies/released?${params}`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY ?? '' },
      });
      const data = await res.json();
      if (data.success) {
        setMovies(data.data);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
        if (p === 1 && data.data.length > 0) {
          setFeatured(data.data.find((m: Movie) => m.featured) ?? data.data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMovies(1); }, []); // eslint-disable-line

  // Fetch per-user status for all visible movies
  useEffect(() => {
    if (!isAuthenticated || !accessToken || movies.length === 0) return;
    movies.forEach(async (m) => {
      try {
        const res = await fetch(`/api/user/movies/${m.slug}/status`, { headers: authHeaders() });
        const d   = await res.json();
        if (d.success) {
          setInteractions(prev => ({ ...prev, [m._id]: { liked: d.liked, saved: d.saved } }));
        }
      } catch {}
    });
  }, [isAuthenticated, accessToken, movies]); // eslint-disable-line

  function handleSearchInput(v: string) {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchMovies(1, v, genre, sort); }, 400);
  }

  function handleGenre(g: string) { setGenre(g); setPage(1); fetchMovies(1, search, g, sort); }
  function handleSort(s: string)  { setSort(s);  setPage(1); fetchMovies(1, search, genre, s); }
  function handlePage(p: number)  { setPage(p);  fetchMovies(p, search, genre, sort); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function doInteract(movie: Movie, action: 'like' | 'unlike' | 'save' | 'unsave') {
    if (!isAuthenticated || acting) return;
    setActing(`${movie._id}-${action}`);
    try {
      const res  = await fetch(`/api/user/movies/${movie.slug}/interact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) return;
      const cur = interactions[movie._id] ?? { liked: false, saved: false };
      setInteractions(prev => ({
        ...prev,
        [movie._id]: {
          liked: action === 'like'   ? true  : action === 'unlike' ? false : cur.liked,
          saved: action === 'save'   ? true  : action === 'unsave' ? false : cur.saved,
        },
      }));
      setMovies(prev => prev.map(m => m._id !== movie._id ? m : {
        ...m,
        likeCount: action === 'like'  ? m.likeCount + 1 : action === 'unlike' ? Math.max(0, m.likeCount - 1) : m.likeCount,
        saveCount: action === 'save'  ? m.saveCount + 1 : action === 'unsave' ? Math.max(0, m.saveCount - 1) : m.saveCount,
      }));
    } finally { setActing(null); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">

      {/* ── Featured Hero ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {featured && (
          <motion.section
            key={featured._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden"
          >
            {(featured.backdrop || featured.poster) && (
              <Image src={featured.backdrop || featured.poster!} alt={featured.title}
                fill priority className="object-cover object-top" sizes="100vw" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14] via-[#0a0a14]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/20 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="container mx-auto px-6 pb-12 md:pb-16 flex gap-6 items-end">
                {featured.poster && (
                  <div className="hidden md:block w-36 h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 relative">
                    <Image src={featured.poster} alt={featured.title} fill className="object-cover" sizes="144px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {featured.featured && (
                    <span className="inline-block bg-primary text-black text-xs font-bold px-3 py-1 rounded-full mb-3">⭐ Featured</span>
                  )}
                  <h1 className="font-playfair text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-2xl line-clamp-2">
                    {featured.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                    {featured.releaseDate && <span className="text-neutral-300">{formatDate(featured.releaseDate)}</span>}
                    {featured.genre?.slice(0, 3).map(g => (
                      <span key={g} className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs">{g}</span>
                    ))}
                    {featured.anticipationScore && (
                      <span className={`font-bold font-playfair text-base ${scoreColor(featured.anticipationScore)}`}>
                        ★ {featured.anticipationScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {featured.synopsis && (
                    <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2 max-w-xl mb-5">{featured.synopsis}</p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    <Link href={`/movie-details/${featured.slug}`}
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:glow-gold">
                      <Icon name="InformationCircleIcon" size={16} /> View Details
                    </Link>
                    {featured.trailer && (
                      <a href={featured.trailer} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all backdrop-blur-sm">
                        <Icon name="PlayIcon" size={16} /> Trailer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-playfair text-3xl font-bold text-white">Now Playing</h2>
            <p className="text-neutral-400 text-sm mt-1">
              {loading ? 'Loading…' : `${total} released movie${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'}`}>
              <Icon name="Squares2X2Icon" size={18} />
            </button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'}`}>
              <Icon name="ListBulletIcon" size={18} />
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input type="text" value={search} onChange={e => handleSearchInput(e.target.value)}
              placeholder="Search movies, directors, cast…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all" />
            {search && (
              <button onClick={() => { setSearch(''); fetchMovies(1, '', genre, sort); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                <Icon name="XMarkIcon" size={16} />
              </button>
            )}
          </div>
          <select value={sort} onChange={e => handleSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 min-w-[160px]">
            {SORTS.map(s => <option key={s.value} value={s.value} className="bg-[#1a1a2e]">{s.label}</option>)}
          </select>
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {GENRES.map(g => (
            <button key={g} onClick={() => handleGenre(g)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${genre === g ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white border border-white/10'}`}>
              {g}
            </button>
          ))}
        </div>

        {/* Movies */}
        {loading ? (
          <div className={view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse' : 'space-y-4 animate-pulse'}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={view === 'grid' ? 'h-80 bg-white/5 rounded-2xl' : 'h-28 bg-white/5 rounded-2xl'} />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="FilmIcon" size={56} className="text-neutral-700 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No movies found</h3>
            <p className="text-neutral-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : view === 'grid' ? (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {movies.map((movie, i) => {
              const ia = interactions[movie._id];
              return (
                <motion.div key={movie._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="group glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all hover:-translate-y-1">
                  <Link href={`/movie-details/${movie.slug}`} className="block relative aspect-[2/3] overflow-hidden">
                    {movie.poster ? (
                      <Image src={movie.poster} alt={movie.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-neutral-900 flex items-center justify-center">
                        <Icon name="FilmIcon" size={40} className="text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {movie.anticipationScore && (
                      <div className={`absolute top-2 right-2 border rounded-lg px-2 py-0.5 text-xs font-bold font-playfair backdrop-blur-sm ${scoreBg(movie.anticipationScore)} ${scoreColor(movie.anticipationScore)}`}>
                        ★ {movie.anticipationScore.toFixed(1)}
                      </div>
                    )}
                    {movie.mpaaRating && (
                      <div className="absolute top-2 left-2 bg-black/70 border border-white/20 text-white/70 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {movie.mpaaRating}
                      </div>
                    )}
                  </Link>
                  <div className="p-3 space-y-2">
                    <Link href={`/movie-details/${movie.slug}`}>
                      <h3 className="font-playfair text-sm font-bold text-white hover:text-primary transition-colors line-clamp-1">{movie.title}</h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 flex-wrap">
                      {movie.releaseDate && <span>{new Date(movie.releaseDate).getFullYear()}</span>}
                      {movie.genre?.[0] && <><span>·</span><span className="text-blue-400/70">{movie.genre[0]}</span></>}
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <button onClick={() => isAuthenticated ? doInteract(movie, ia?.liked ? 'unlike' : 'like') : router.push('/login')}
                        disabled={!!acting}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center ${ia?.liked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-neutral-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20'}`}>
                        <Icon name="HeartIcon" size={11} className={ia?.liked ? 'fill-rose-400' : ''} />{movie.likeCount}
                      </button>
                      <button onClick={() => isAuthenticated ? doInteract(movie, ia?.saved ? 'unsave' : 'save') : router.push('/login')}
                        disabled={!!acting}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center ${ia?.saved ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-neutral-500 hover:text-primary border border-white/10 hover:border-primary/20'}`}>
                        <Icon name="BookmarkIcon" size={11} className={ia?.saved ? 'fill-primary' : ''} />{movie.saveCount}
                      </button>
                      <Link href={`/movie-details/${movie.slug}#comments`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-neutral-500 hover:text-white border border-white/10 hover:border-white/20 transition-all flex-1 justify-center">
                        <Icon name="ChatBubbleLeftIcon" size={11} />{movie.commentCount}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {movies.map((movie, i) => {
              const ia = interactions[movie._id];
              return (
                <motion.div key={movie._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all flex group">
                  <Link href={`/movie-details/${movie.slug}`} className="relative w-20 sm:w-28 shrink-0 overflow-hidden">
                    {movie.poster ? (
                      <Image src={movie.poster} alt={movie.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="112px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-neutral-900 flex items-center justify-center min-h-[100px]">
                        <Icon name="FilmIcon" size={24} className="text-white/10" />
                      </div>
                    )}
                    {movie.anticipationScore && (
                      <div className={`absolute bottom-2 left-0 right-0 mx-2 bg-black/70 backdrop-blur-sm rounded px-1 py-0.5 text-center text-xs font-bold font-playfair ${scoreColor(movie.anticipationScore)}`}>
                        ★ {movie.anticipationScore.toFixed(1)}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/movie-details/${movie.slug}`}>
                        <h3 className="font-playfair font-bold text-white hover:text-primary transition-colors line-clamp-1">{movie.title}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 flex-wrap">
                        {movie.releaseDate && <span>{formatDate(movie.releaseDate)}</span>}
                        {movie.director && <><span>·</span><span>Dir. {movie.director}</span></>}
                        {movie.genre?.[0] && <span className="text-blue-400/70">{movie.genre.slice(0, 2).join(', ')}</span>}
                        {movie.duration && <span>{formatDuration(movie.duration)}</span>}
                      </div>
                      {movie.synopsis && <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5">{movie.synopsis}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Link href={`/movie-details/${movie.slug}`}
                        className="flex items-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                        <Icon name="EyeIcon" size={12} /> View
                      </Link>
                      <button onClick={() => isAuthenticated ? doInteract(movie, ia?.liked ? 'unlike' : 'like') : router.push('/login')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${ia?.liked ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'glass-card text-neutral-400 border-white/10 hover:text-rose-400'}`}>
                        <Icon name="HeartIcon" size={12} className={ia?.liked ? 'fill-rose-400' : ''} />{movie.likeCount}
                      </button>
                      <button onClick={() => isAuthenticated ? doInteract(movie, ia?.saved ? 'unsave' : 'save') : router.push('/login')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${ia?.saved ? 'bg-primary/20 text-primary border-primary/30' : 'glass-card text-neutral-400 border-white/10 hover:text-primary'}`}>
                        <Icon name="BookmarkIcon" size={12} className={ia?.saved ? 'fill-primary' : ''} />{movie.saveCount}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
              className="p-2 glass-card rounded-xl text-neutral-400 hover:text-white border border-white/10 disabled:opacity-30 transition-all">
              <Icon name="ChevronLeftIcon" size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => handlePage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${p === page ? 'bg-primary text-black font-bold' : 'glass-card text-neutral-400 hover:text-white border border-white/10'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}
              className="p-2 glass-card rounded-xl text-neutral-400 hover:text-white border border-white/10 disabled:opacity-30 transition-all">
              <Icon name="ChevronRightIcon" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
