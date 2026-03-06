"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/context/AuthContext';

type WishlistTab = 'celebrities' | 'outfits' | 'news' | 'reviews' | 'movies';
type NewsSubTab  = 'liked' | 'saved';

interface FollowedCelebrity {
  id: string;
  name: string;
  slug: string;
  profileImage: string;
  occupation: string[];
  categories: string[];
  isVerified: boolean;
}

// Merged saved outfit (user-uploaded OR celebrity outfit)
interface SavedOutfit {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  brand?: string;
  price?: string;
  purchasePrice?: number;
  category?: string;
  event?: string;
  likes: string[];
  comments: any[];
  createdAt: string;
  // user outfit extras
  views?: number;
  userId?: { name: string; avatar?: string };
  // celebrity outfit extras
  celebrity?: { name: string; slug?: string } | string;
  _source: 'user' | 'celebrity';
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  excerpt: string;
  publishDate: string;
  tags: string[];
  celebrity: { name: string; slug: string } | null;
  likeCount: number;
  saveCount: number;
  liked: boolean;
  saved: boolean;
}

interface SavedReview {
  id: string;
  title: string;
  slug: string;
  movieTitle: string;
  poster: string | null;
  rating: number | null;
  excerpt: string;
  publishDate: string | null;
  featured: boolean;
  likeCount: number;
  saveCount: number;
  commentCount: number;
}

interface SavedMovie {
  id: string;
  title: string;
  slug: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate: string | null;
  genre: string[];
  status: string;
  anticipationScore: number | null;
  featured: boolean;
  likeCount: number;
  saveCount: number;
  commentCount: number;
}

function isReleased(movie: SavedMovie): boolean {
  const releasedStatuses = ['released', 'now showing', 'now playing', 'in theatres', 'in theaters'];
  if (releasedStatuses.includes((movie.status ?? '').toLowerCase())) return true;
  if (movie.releaseDate && new Date(movie.releaseDate) <= new Date()) return true;
  return false;
}

function movieHref(movie: SavedMovie): string {
  return isReleased(movie) ? `/movie-details/${movie.slug}` : `/upcoming-movies/${movie.slug}`;
}

function timeAgo(raw: string) {
  const diff = Date.now() - new Date(raw).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WishlistSection() {
  const { authHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState<WishlistTab>('celebrities');

  // Celebrities state
  const [celebrities, setCelebrities] = useState<FollowedCelebrity[]>([]);
  const [celebLoading, setCelebLoading] = useState(true);
  const [unfollowing, setUnfollowing]   = useState<string | null>(null);

  // Outfits state
  const [outfits, setOutfits]       = useState<SavedOutfit[]>([]);
  const [outfitLoading, setOutfitLoading] = useState(true);
  const [removing, setRemoving]     = useState<string | null>(null);

  // News state
  const [newsSubTab,    setNewsSubTab]    = useState<NewsSubTab>('liked');
  const [likedNews,     setLikedNews]     = useState<NewsArticle[]>([]);
  const [savedNews,     setSavedNews]     = useState<NewsArticle[]>([]);
  const [newsLoading,   setNewsLoading]   = useState(true);
  const [newsActing,    setNewsActing]    = useState<string | null>(null);

  // Reviews state
  const [savedReviews,      setSavedReviews]      = useState<SavedReview[]>([]);
  const [reviewsLoading,    setReviewsLoading]    = useState(true);
  const [unsavingReview,    setUnsavingReview]    = useState<string | null>(null);

  // Movies state
  const [savedMovies,     setSavedMovies]     = useState<SavedMovie[]>([]);
  const [moviesLoading,   setMoviesLoading]   = useState(true);
  const [unsavingMovie,   setUnsavingMovie]   = useState<string | null>(null);

  const fetchCelebrities = useCallback(async () => {
    setCelebLoading(true);
    try {
      const res  = await fetch('/api/user/celebrities/following', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setCelebrities(json.celebrities);
    } catch { /* ignore */ }
    finally { setCelebLoading(false); }
  }, [authHeaders]);

  const fetchOutfits = useCallback(async () => {
    setOutfitLoading(true);
    try {
      const headers = authHeaders();
      const [userRes, celebRes] = await Promise.all([
        fetch('/api/user-outfits/favourites',      { headers }),
        fetch('/api/celebrity-outfits/favourites', { headers }),
      ]);
      const [userJson, celebJson] = await Promise.all([userRes.json(), celebRes.json()]);

      const userOutfits: SavedOutfit[] = (userJson.success  ? userJson.outfits  : []).map((o: any) => ({ ...o, _source: 'user'      as const }));
      const celebOutfits: SavedOutfit[] = (celebJson.success ? celebJson.outfits : []).map((o: any) => ({ ...o, _source: 'celebrity' as const }));

      setOutfits(
        [...userOutfits, ...celebOutfits].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch { /* ignore */ }
    finally { setOutfitLoading(false); }
  }, [authHeaders]);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res  = await fetch('/api/user/news/liked-saved?type=all&limit=50', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setLikedNews(json.items.filter((a: NewsArticle) => a.liked));
        setSavedNews(json.items.filter((a: NewsArticle) => a.saved));
      }
    } catch { /* ignore */ }
    finally { setNewsLoading(false); }
  }, [authHeaders]);

  const fetchSavedReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res  = await fetch('/api/user/reviews/saved', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setSavedReviews(json.reviews);
    } catch { /* ignore */ }
    finally { setReviewsLoading(false); }
  }, [authHeaders]);

  const fetchSavedMovies = useCallback(async () => {
    setMoviesLoading(true);
    try {
      const res  = await fetch('/api/user/movies/saved', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setSavedMovies(json.movies);
    } catch { /* ignore */ }
    finally { setMoviesLoading(false); }
  }, [authHeaders]);

  useEffect(() => {
    fetchCelebrities();
    fetchOutfits();
    fetchNews();
    fetchSavedReviews();
    fetchSavedMovies();
  }, []); // eslint-disable-line

  const handleUnfollow = async (celeb: FollowedCelebrity) => {
    setUnfollowing(celeb.id);
    try {
      const res  = await fetch('/api/user/celebrities/follow', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ celebrityId: celeb.id }),
      });
      const json = await res.json();
      if (json.success && !json.following) {
        setCelebrities((prev) => prev.filter((c) => c.id !== celeb.id));
      }
    } finally { setUnfollowing(null); }
  };

  const handleRemoveOutfit = async (outfit: SavedOutfit) => {
    setRemoving(outfit._id);
    try {
      const apiBase = outfit._source === 'celebrity' ? '/api/celebrity-outfits' : '/api/user-outfits';
      const res  = await fetch(`${apiBase}/${outfit.slug}/interact`, {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'unfavourite' }),
      });
      const json = await res.json();
      if (json.success) setOutfits((prev) => prev.filter((o) => o._id !== outfit._id));
    } finally { setRemoving(null); }
  };

  const handleNewsInteract = async (article: NewsArticle, action: 'unlike' | 'unsave') => {
    setNewsActing(article.id);
    try {
      const res  = await fetch(`/api/user/news/${encodeURIComponent(article.slug)}/interact`, {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        if (action === 'unlike') setLikedNews((prev) => prev.filter((a) => a.id !== article.id));
        if (action === 'unsave') setSavedNews((prev) => prev.filter((a) => a.id !== article.id));
      }
    } finally { setNewsActing(null); }
  };

  return (
    <div className="space-y-8">

      {/* Tab selector */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab('celebrities')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'celebrities' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="UserGroupIcon" size={18} />
          Following
          {!celebLoading && <span className="ml-1 opacity-70">({celebrities.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('outfits')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'outfits' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="SparklesIcon" size={18} />
          Saved Outfits
          {!outfitLoading && <span className="ml-1 opacity-70">({outfits.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'news' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="NewspaperIcon" size={18} />
          News
          {!newsLoading && <span className="ml-1 opacity-70">({likedNews.length + savedNews.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'reviews' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="FilmIcon" size={18} />
          Saved Reviews
          {!reviewsLoading && <span className="ml-1 opacity-70">({savedReviews.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'movies' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="VideoCameraIcon" size={18} />
          Saved Movies
          {!moviesLoading && <span className="ml-1 opacity-70">({savedMovies.length})</span>}
        </button>
      </div>

      {/* ── Following celebrities ────────────────────────────────────────── */}
      {activeTab === 'celebrities' && (
        celebLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        ) : celebrities.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="UserGroupIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">Not following anyone yet</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Visit a celebrity profile and tap <strong className="text-white">Follow</strong> to add them here.
            </p>
            <Link
              href="/celebrity-profiles"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="SparklesIcon" size={16} /> Explore Celebrities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {celebrities.map((celeb) => (
              <div key={celeb.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all group">
                {/* Image */}
                <Link href={`/celebrity-profiles/${celeb.slug}`} className="block relative h-56 overflow-hidden">
                  {celeb.profileImage ? (
                    <AppImage
                      src={celeb.profileImage}
                      alt={celeb.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                      <Icon name="UserCircleIcon" size={56} className="text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Following badge */}
                  <div className="absolute top-3 right-3 bg-primary/20 border border-primary/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Icon name="HeartIcon" size={11} className="text-primary fill-primary" />
                    <span className="text-[10px] text-primary font-bold">Following</span>
                  </div>
                  {celeb.isVerified && (
                    <div className="absolute top-3 left-3 bg-blue-500/80 rounded-full p-1 backdrop-blur-sm">
                      <Icon name="CheckBadgeIcon" size={13} className="text-white" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <Link href={`/celebrity-profiles/${celeb.slug}`}>
                      <h3 className="font-playfair text-lg font-bold text-white hover:text-primary transition-colors leading-tight">
                        {celeb.name}
                      </h3>
                    </Link>
                    {celeb.occupation.length > 0 && (
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {celeb.occupation.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/celebrity-profiles/${celeb.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <Icon name="UserIcon" size={13} /> View Profile
                    </Link>
                    <button
                      onClick={() => handleUnfollow(celeb)}
                      disabled={unfollowing === celeb.id}
                      className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      title="Unfollow"
                    >
                      {unfollowing === celeb.id
                        ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Icon name="HeartIcon" size={13} className="fill-red-400" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Saved outfits ────────────────────────────────────────────────── */}
      {activeTab === 'outfits' && (
        outfitLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        ) : outfits.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="BookmarkIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No saved outfits yet</h3>
            <p className="text-neutral-400 text-sm mb-6">Tap the Save button on any outfit to bookmark it here.</p>
            <Link
              href="/fashion-gallery"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="SparklesIcon" size={16} /> Browse Fashion Gallery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {outfits.map((outfit) => {
              const isCeleb  = outfit._source === 'celebrity';
              const href     = isCeleb ? `/celebrity-outfits/${outfit.slug}` : `/user-outfits/${outfit.slug}`;
              const celebCredit = isCeleb
                ? (typeof outfit.celebrity === 'object' ? (outfit.celebrity as any)?.name : outfit.celebrity)
                : outfit.userId?.name;

              return (
                <div key={outfit._id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/30 transition-all group">
                  <Link href={href} className="block relative h-52 overflow-hidden">
                    <AppImage
                      src={outfit.images[0] || ''}
                      alt={outfit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Source badge */}
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                      isCeleb ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-white/70 border border-white/20'
                    }`}>
                      {isCeleb ? '⭐ Celebrity' : 'Community'}
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1"><Icon name="HeartIcon" size={12} />{outfit.likes.length}</span>
                      <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftIcon" size={12} />{outfit.comments.length}</span>
                    </div>
                  </Link>
                  <div className="p-4 space-y-3">
                    <div>
                      <Link href={href}>
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors mb-1">{outfit.title}</h3>
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {[outfit.event || outfit.category, outfit.brand, isCeleb ? outfit.price : outfit.purchasePrice ? `₹${outfit.purchasePrice.toLocaleString()}` : null]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {celebCredit && (
                      <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs text-neutral-500">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                          {isCeleb
                            ? <Icon name="StarIcon" size={10} className="text-black" />
                            : <span className="text-black font-bold text-[10px]">{String(celebCredit).charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <span className="truncate">{celebCredit}</span>
                        <span className="ml-auto">{new Date(outfit.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link href={href}
                        className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all">
                        <Icon name="EyeIcon" size={13} /> View
                      </Link>
                      <button
                        onClick={() => handleRemoveOutfit(outfit)}
                        disabled={removing === outfit._id}
                        className="flex items-center justify-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                        title="Remove from saved"
                      >
                        {removing === outfit._id
                          ? <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          : <Icon name="BookmarkSlashIcon" size={13} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── News ────────────────────────────────────────────────────────── */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          {/* Sub-tabs: Liked / Saved */}
          <div className="flex gap-2">
            <button
              onClick={() => setNewsSubTab('liked')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                newsSubTab === 'liked'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'glass-card text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <Icon name="HeartIcon" size={15} className={newsSubTab === 'liked' ? 'fill-rose-400' : ''} />
              Liked
              {!newsLoading && <span className="opacity-70">({likedNews.length})</span>}
            </button>
            <button
              onClick={() => setNewsSubTab('saved')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                newsSubTab === 'saved'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'glass-card text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <Icon name="BookmarkIcon" size={15} className={newsSubTab === 'saved' ? 'fill-primary' : ''} />
              Saved
              {!newsLoading && <span className="opacity-70">({savedNews.length})</span>}
            </button>
          </div>

          {newsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 glass-card rounded-2xl p-4">
                  <div className="w-24 h-20 bg-white/5 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (newsSubTab === 'liked' ? likedNews : savedNews).length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <Icon
                name={newsSubTab === 'liked' ? 'HeartIcon' : 'BookmarkIcon'}
                size={56}
                className="text-neutral-600 mx-auto mb-4"
              />
              <h3 className="font-playfair text-xl text-white mb-2">
                No {newsSubTab === 'liked' ? 'liked' : 'saved'} articles yet
              </h3>
              <p className="text-neutral-400 text-sm mb-6">
                {newsSubTab === 'liked'
                  ? 'Tap the heart on any article to like it.'
                  : 'Tap the bookmark on any article to save it for later.'}
              </p>
              <Link
                href="/celebrity-news"
                className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
              >
                <Icon name="NewspaperIcon" size={16} /> Browse News
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(newsSubTab === 'liked' ? likedNews : savedNews).map((article) => (
                <div
                  key={article.id}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex gap-0"
                >
                  {/* Thumbnail */}
                  <Link href={`/celebrity-news/${article.slug}`} className="block relative w-32 sm:w-40 flex-shrink-0 overflow-hidden">
                    {article.thumbnail ? (
                      <AppImage
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[100px] bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Icon name="NewspaperIcon" size={28} className="text-white/30" />
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-2 left-2 bg-accent/20 text-accent border border-accent/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {article.category}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/celebrity-news/${article.slug}`}>
                        <h4 className="font-playfair text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-primary transition-colors mb-1.5">
                          {article.title}
                        </h4>
                      </Link>
                      {article.excerpt && (
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                        {article.celebrity && (
                          <span className="text-accent flex items-center gap-1">
                            <Icon name="StarIcon" size={10} className="fill-accent" />
                            {article.celebrity.name}
                          </span>
                        )}
                        <span>{timeAgo(article.publishDate)}</span>
                        <span className="flex items-center gap-1"><Icon name="HeartIcon" size={10} />{article.likeCount}</span>
                        <span className="flex items-center gap-1"><Icon name="BookmarkIcon" size={10} />{article.saveCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        href={`/celebrity-news/${article.slug}`}
                        className="flex items-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        <Icon name="EyeIcon" size={12} /> Read
                      </Link>
                      {newsSubTab === 'liked' && (
                        <button
                          onClick={() => handleNewsInteract(article, 'unlike')}
                          disabled={newsActing === article.id}
                          className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          title="Unlike"
                        >
                          {newsActing === article.id
                            ? <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                            : <Icon name="HeartIcon" size={12} className="fill-rose-400" />
                          }
                          Unlike
                        </button>
                      )}
                      {newsSubTab === 'saved' && (
                        <button
                          onClick={() => handleNewsInteract(article, 'unsave')}
                          disabled={newsActing === article.id}
                          className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          title="Remove from saved"
                        >
                          {newsActing === article.id
                            ? <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            : <Icon name="BookmarkSlashIcon" size={12} />
                          }
                          Unsave
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Saved Reviews ─────────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        reviewsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 glass-card rounded-2xl p-4">
                <div className="w-24 h-20 bg-white/5 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : savedReviews.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="BookmarkIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No saved reviews yet</h3>
            <p className="text-neutral-400 text-sm mb-6">Tap the bookmark on any movie review to save it here.</p>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="FilmIcon" size={16} /> Browse Reviews
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedReviews.map((review) => (
              <div
                key={review.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex gap-0"
              >
                {/* Poster */}
                <Link href={`/reviews/${review.slug}`} className="block relative w-24 sm:w-32 flex-shrink-0 overflow-hidden">
                  {review.poster ? (
                    <AppImage
                      src={review.poster}
                      alt={review.movieTitle}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[100px] bg-gradient-to-br from-zinc-800 to-neutral-900 flex items-center justify-center">
                      <Icon name="FilmIcon" size={28} className="text-white/20" />
                    </div>
                  )}
                  {review.rating !== null && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs font-bold font-playfair text-yellow-400">
                      {review.rating}<span className="text-white/40 text-[10px]">/10</span>
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <Link href={`/reviews/${review.slug}`}>
                      <h4 className="font-playfair text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-primary transition-colors mb-1">
                        {review.title}
                      </h4>
                    </Link>
                    {review.movieTitle !== review.title && (
                      <p className="text-xs text-primary/80 font-medium mb-1">{review.movieTitle}</p>
                    )}
                    {review.excerpt && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{review.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                      {review.publishDate && <span>{timeAgo(review.publishDate)}</span>}
                      <span className="flex items-center gap-1"><Icon name="HeartIcon" size={10} />{review.likeCount}</span>
                      <span className="flex items-center gap-1"><Icon name="BookmarkIcon" size={10} />{review.saveCount}</span>
                      <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftIcon" size={10} />{review.commentCount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/reviews/${review.slug}`}
                      className="flex items-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    >
                      <Icon name="EyeIcon" size={12} /> Read Review
                    </Link>
                    <button
                      onClick={async () => {
                        setUnsavingReview(review.id);
                        try {
                          const res  = await fetch(`/api/user/reviews/${review.slug}/interact`, {
                            method:  'POST',
                            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                            body:    JSON.stringify({ action: 'unsave' }),
                          });
                          const json = await res.json();
                          if (json.success) setSavedReviews((prev) => prev.filter((r) => r.id !== review.id));
                        } finally { setUnsavingReview(null); }
                      }}
                      disabled={unsavingReview === review.id}
                      className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      title="Remove from saved"
                    >
                      {unsavingReview === review.id
                        ? <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        : <Icon name="BookmarkSlashIcon" size={12} />
                      }
                      Unsave
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Saved Movies (upcoming + released) ────────────────────────────── */}
      {activeTab === 'movies' && (
        moviesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        ) : savedMovies.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="VideoCameraIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No saved movies yet</h3>
            <p className="text-neutral-400 text-sm mb-6">Tap the Wishlist button on any movie — upcoming or released — to save it here.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/upcoming-movies"
                className="inline-flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:glow-gold transition-all"
              >
                <Icon name="FilmIcon" size={16} /> Browse Upcoming
              </Link>
              <Link
                href="/movie-details"
                className="inline-flex items-center gap-2 glass-card text-white border border-white/20 px-5 py-2.5 rounded-full font-semibold text-sm hover:border-primary/40 transition-all"
              >
                <Icon name="FilmIcon" size={16} /> Browse Released
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedMovies.map((movie) => {
              const releaseLabel = movie.releaseDate
                ? new Date(movie.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';
              const scoreColor = !movie.anticipationScore ? 'text-neutral-400'
                : movie.anticipationScore >= 9 ? 'text-emerald-400'
                : movie.anticipationScore >= 7 ? 'text-yellow-400'
                : 'text-orange-400';
              const href = movieHref(movie);
              const released = isReleased(movie);

              return (
                <div key={movie.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all group">
                  {/* Poster / Backdrop */}
                  <Link href={href} className="block relative h-48 overflow-hidden">
                    {movie.poster || movie.backdrop ? (
                      <AppImage
                        src={movie.poster || movie.backdrop!}
                        alt={movie.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-blue-900 flex items-center justify-center">
                        <Icon name="FilmIcon" size={40} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {/* Anticipation score badge */}
                    {movie.anticipationScore !== null && (
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-bold font-playfair">
                        <span className={scoreColor}>{movie.anticipationScore.toFixed(1)}</span>
                        <span className="text-white/30 text-[10px]">/10</span>
                      </div>
                    )}
                    {movie.featured && (
                      <div className="absolute top-3 left-3 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ⭐ Featured
                      </div>
                    )}
                    {/* Status badge */}
                    <div className={`absolute bottom-3 left-3 backdrop-blur-sm text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                      released
                        ? 'bg-emerald-500/80 text-white border-emerald-400/30'
                        : 'bg-black/60 text-white/80 border-white/10'
                    }`}>
                      {released ? '🎬 Now Showing' : movie.status}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <Link href={href}>
                        <h3 className="font-playfair text-base font-bold text-white hover:text-primary transition-colors leading-tight line-clamp-2">
                          {movie.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          📅 {releaseLabel}
                        </span>
                        {movie.genre.length > 0 && (
                          <span className="text-xs text-blue-400/70">{movie.genre.slice(0, 2).join(' · ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1"><Icon name="HeartIcon" size={10} />{movie.likeCount}</span>
                      <span className="flex items-center gap-1"><Icon name="BookmarkIcon" size={10} />{movie.saveCount}</span>
                      <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftIcon" size={10} />{movie.commentCount}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={href}
                        className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all"
                      >
                        <Icon name="EyeIcon" size={13} /> View
                      </Link>
                      <button
                        onClick={async () => {
                          setUnsavingMovie(movie.id);
                          try {
                            const res  = await fetch(`/api/user/movies/${movie.slug}/interact`, {
                              method:  'POST',
                              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                              body:    JSON.stringify({ action: 'unsave' }),
                            });
                            const json = await res.json();
                            if (json.success) setSavedMovies((prev) => prev.filter((m) => m.id !== movie.id));
                          } finally { setUnsavingMovie(null); }
                        }}
                        disabled={unsavingMovie === movie.id}
                        className="flex items-center justify-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        {unsavingMovie === movie.id
                          ? <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          : <Icon name="BookmarkSlashIcon" size={13} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}



