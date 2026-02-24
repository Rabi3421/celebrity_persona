"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

interface UserOutfit {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  brand?: string;
  color?: string;
  size?: string;
  purchaseLink?: string;
  purchasePrice?: number;
  store?: string;
  tags: string[];
  views: number;
  likes: string[];
  clicks: any[];
  comments: Comment[];
  favourites: string[];
  isPublished: boolean;
  slug: string;
  createdAt: string;
  userId?: { _id?: string; name: string; avatar?: string };
}

export default function UserOutfitDetail({ slug }: { slug: string }) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();

  const [outfit, setOutfit]         = useState<UserOutfit | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeImg, setActiveImg]   = useState(0);
  const [lightbox, setLightbox]     = useState(false);

  // interaction state
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(0);
  const [faved, setFaved]           = useState(false);
  const [favCount, setFavCount]     = useState(0);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [actioning, setActioning]   = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/user-outfits/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const o = json.outfit as UserOutfit;
          setOutfit(o);
          setLikeCount(o.likes.length);
          setFavCount(o.favourites?.length ?? 0);
          setComments(o.comments ?? []);
        } else {
          setError(json.message || 'Not found');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line

  // Recalculate liked/faved whenever user or outfit data resolves
  // (auth loads async from localStorage, often after fetch completes)
  useEffect(() => {
    if (!outfit || !user) return;
    setLiked(outfit.likes.map(String).includes(user.id));
    setFaved((outfit.favourites ?? []).map(String).includes(user.id));
  }, [user, outfit]);

  const requireAuth = (action: () => void) => {
    if (!user) {
      router.push(`/login?redirect=/user-outfits/${slug}`);
      return;
    }
    action();
  };

  const interact = async (body: object) => {
    const res  = await fetch(`/api/user-outfits/${outfit!.slug}/interact`, {
      method:  'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return res.json();
  };

  const handleLike = () => requireAuth(async () => {
    if (actioning) return;
    setActioning(true);
    const next   = !liked;
    const action = next ? 'like' : 'unlike';
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const json = await interact({ action });
      if (json.success) setLikeCount(json.count);
      else { setLiked(!next); setLikeCount((c) => c + (next ? -1 : 1)); }
    } finally {
      setActioning(false);
    }
  });

  const handleFavourite = () => requireAuth(async () => {
    if (actioning) return;
    setActioning(true);
    const next   = !faved;
    const action = next ? 'favourite' : 'unfavourite';
    setFaved(next);
    setFavCount((c) => c + (next ? 1 : -1));
    try {
      const json = await interact({ action });
      if (json.success) setFavCount(json.count);
      else { setFaved(!next); setFavCount((c) => c + (next ? -1 : 1)); }
    } finally {
      setActioning(false);
    }
  });

  const handleComment = async () => {
    if (!user) { router.push(`/login?redirect=/user-outfits/${slug}`); return; }
    const text = commentText.trim();
    if (!text || postingComment) return;
    setPostingComment(true);
    try {
      const json = await interact({ action: 'comment', text });
      if (json.success) {
        setComments((prev) => [...prev, json.comment]);
        setCommentText('');
      }
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const json = await interact({ action: 'delete-comment', commentId });
      if (json.success) setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch { /* ignore */ }
  };

  /* ─── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-[480px] bg-white/5 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-white/5 rounded-xl" />
            <div className="h-4 w-1/2 bg-white/5 rounded-xl" />
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <Icon name="ExclamationCircleIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
        <h2 className="font-playfair text-2xl text-white mb-2">Outfit Not Found</h2>
        <p className="text-neutral-400 mb-6">{error}</p>
        <Link href="/fashion-gallery" className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all">
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
        <Link href="/homepage" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/fashion-gallery" className="hover:text-white transition-colors">Fashion Gallery</Link>
        <span>/</span>
        <span className="text-neutral-300 truncate max-w-xs">{outfit.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Image gallery ─────────────────────────────────────── */}
        <div>
          <div
            className="relative rounded-3xl overflow-hidden h-[420px] md:h-[520px] cursor-zoom-in glass-card"
            onClick={() => setLightbox(true)}
          >
            <AppImage src={outfit.images[activeImg] || ''} alt={outfit.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 glass-card px-2 py-1 rounded-full text-xs text-neutral-300 flex items-center gap-1">
              <Icon name="MagnifyingGlassPlusIcon" size={12} />Zoom
            </div>
          </div>
          {outfit.images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {outfit.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary' : 'border-transparent hover:border-white/30'}`}>
                  <AppImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ───────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title + uploader */}
          <div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{outfit.title}</h1>
            {outfit.userId && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <span className="text-black font-bold text-xs">{outfit.userId.name.charAt(0).toUpperCase()}</span>
                </div>
                <span>by <span className="text-white">{outfit.userId.name}</span></span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5"><Icon name="EyeIcon" size={16} className="text-primary" />{outfit.views.toLocaleString()} views</span>
            <span className="flex items-center gap-1.5"><Icon name="HeartIcon" size={16} className="text-primary" />{likeCount} likes</span>
            <span className="flex items-center gap-1.5"><Icon name="ChatBubbleLeftIcon" size={16} className="text-primary" />{comments.length} comments</span>
          </div>

          {/* ── Interaction buttons ───────────────────────────── */}
          <div className="flex gap-3">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm transition-all ${
                liked
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'glass-card border-white/10 text-neutral-300 hover:border-red-500/40 hover:text-red-400'
              }`}
            >
              <Icon name={liked ? 'HeartIcon' : 'HeartIcon'} size={18}
                className={liked ? 'text-red-400 fill-red-400' : ''} />
              {liked ? 'Liked' : 'Like'}
              <span className="text-xs opacity-70">({likeCount})</span>
            </button>

            {/* Favourite */}
            <button
              onClick={handleFavourite}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm transition-all ${
                faved
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'glass-card border-white/10 text-neutral-300 hover:border-yellow-500/40 hover:text-yellow-400'
              }`}
            >
              <Icon name="BookmarkIcon" size={18} className={faved ? 'text-yellow-400 fill-yellow-400' : ''} />
              {faved ? 'Saved' : 'Save'}
            </button>

            {/* Share */}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="glass-card flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 text-sm transition-all"
              title="Copy link"
            >
              <Icon name="ShareIcon" size={18} />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs capitalize border border-primary/20">{outfit.category}</span>
            {outfit.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 text-xs border border-white/10">#{tag}</span>
            ))}
          </div>

          {/* Details card */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            {[
              ['Brand', outfit.brand],
              ['Color', outfit.color],
              ['Size', outfit.size],
              ['Store', outfit.store],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-neutral-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
            {outfit.purchasePrice && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Price</span>
                <span className="text-primary font-bold text-base">₹{outfit.purchasePrice.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Posted on</span>
              <span className="text-white">{new Date(outfit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Description */}
          {outfit.description && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-2">Description</h3>
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">{outfit.description}</p>
            </div>
          )}

          {/* Buy CTA */}
          {outfit.purchaseLink && (
            <a href={outfit.purchaseLink} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-black py-4 rounded-full font-semibold hover:glow-gold transition-all">
              <Icon name="ShoppingBagIcon" size={20} />
              Buy Now{outfit.store ? ` on ${outfit.store}` : ''}
            </a>
          )}
        </div>
      </div>

      {/* ── Comments section ─────────────────────────────────────────────────── */}
      <div className="mt-14">
        <h2 className="font-playfair text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="ChatBubbleLeftEllipsisIcon" size={24} className="text-primary" />
          Comments
          <span className="text-base font-normal text-neutral-500 ml-1">({comments.length})</span>
        </h2>

        {/* Comment box */}
        {user ? (
          <div className="glass-card rounded-2xl p-5 mb-8 space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-white text-sm font-medium">{user.name}</span>
            </div>
            <textarea
              ref={commentRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(); }}
              placeholder="Write a comment… (Ctrl+Enter to post)"
              rows={3}
              className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || postingComment}
                className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:glow-gold transition-all disabled:opacity-50"
              >
                {postingComment
                  ? <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  : <Icon name="PaperAirplaneIcon" size={16} />
                }
                Post
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 mb-8 text-center border border-white/10">
            <Icon name="ChatBubbleLeftIcon" size={32} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm mb-4">Sign in to like, comment and save outfits</p>
            <Link
              href={`/login?redirect=/user-outfits/${slug}`}
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="UserIcon" size={16} /> Sign In
            </Link>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-sm">
            <Icon name="ChatBubbleLeftIcon" size={36} className="mx-auto mb-3 opacity-30" />
            No comments yet. Be the first!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c._id} className="glass-card rounded-2xl p-4 flex gap-4 group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  {c.userAvatar
                    ? <img src={c.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <span className="text-white font-bold text-sm">{c.userName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{c.userName}</span>
                      <span className="text-neutral-600 text-xs">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {user && user.id === c.userId && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete comment"
                      >
                        <Icon name="TrashIcon" size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 glass-card p-2 rounded-full" onClick={() => setLightbox(false)}>
            <Icon name="XMarkIcon" size={24} className="text-white" />
          </button>
          {outfit.images.length > 1 && (
            <>
              <button className="absolute left-4 glass-card p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + outfit.images.length) % outfit.images.length); }}>
                <Icon name="ChevronLeftIcon" size={24} className="text-white" />
              </button>
              <button className="absolute right-14 glass-card p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % outfit.images.length); }}>
                <Icon name="ChevronRightIcon" size={24} className="text-white" />
              </button>
            </>
          )}
          <img src={outfit.images[activeImg]} alt={outfit.title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
