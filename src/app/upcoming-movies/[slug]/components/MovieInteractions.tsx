"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

interface Props {
  slug: string;
  movieTitle: string;
}

export default function MovieInteractions({ slug, movieTitle }: Props) {
  const { user, isAuthenticated, authHeaders, accessToken } = useAuth();

  const [liked,         setLiked]         = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [likeCount,     setLikeCount]     = useState(0);
  const [saveCount,     setSaveCount]     = useState(0);
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [commentText,   setCommentText]   = useState('');
  const [showComments,  setShowComments]  = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── fetch initial status ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    setLoadingStatus(true);
    fetch(`/api/user/movies/${slug}/status`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLiked(d.liked);
          setSaved(d.saved);
          setLikeCount(d.likeCount);
          setSaveCount(d.saveCount);
          setComments(d.comments ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [isAuthenticated, accessToken, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── like / save ───────────────────────────────────────────────────────── */
  async function doInteract(action: string) {
    if (!isAuthenticated || actionLoading) return;
    setActionLoading(action);
    try {
      const res  = await fetch(`/api/user/movies/${slug}/interact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) return;
      if (action === 'like')   { setLiked(true);  setLikeCount(data.count); }
      if (action === 'unlike') { setLiked(false); setLikeCount(data.count); }
      if (action === 'save')   { setSaved(true);  setSaveCount(data.count); }
      if (action === 'unsave') { setSaved(false); setSaveCount(data.count); }
    } finally {
      setActionLoading(null);
    }
  }

  /* ── submit comment ────────────────────────────────────────────────────── */
  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/user/movies/${slug}/interact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ action: 'comment', text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
        setShowComments(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ── delete comment ────────────────────────────────────────────────────── */
  async function deleteComment(commentId: string) {
    try {
      const res  = await fetch(`/api/user/movies/${slug}/interact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ action: 'delete-comment', commentId }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {}
  }

  function timeAgo(raw: string) {
    const diff = Date.now() - new Date(raw).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-5 mt-6">

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Like */}
        <button
          onClick={() => isAuthenticated ? doInteract(liked ? 'unlike' : 'like') : null}
          disabled={!!actionLoading}
          title={isAuthenticated ? (liked ? 'Unlike' : 'Like this movie') : 'Sign in to like'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${
            liked
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
              : 'glass-card text-neutral-400 border-white/10 hover:text-rose-400 hover:border-rose-500/30'
          } ${!isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {actionLoading === 'like' || actionLoading === 'unlike'
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Icon name="HeartIcon" size={16} className={liked ? 'fill-rose-400' : ''} />
          }
          <span>{loadingStatus ? '…' : likeCount}</span>
          {liked ? 'Liked' : 'Like'}
        </button>

        {/* Save / Wishlist */}
        <button
          onClick={() => isAuthenticated ? doInteract(saved ? 'unsave' : 'save') : null}
          disabled={!!actionLoading}
          title={isAuthenticated ? (saved ? 'Remove from wishlist' : 'Add to wishlist') : 'Sign in to save'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${
            saved
              ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30'
              : 'glass-card text-neutral-400 border-white/10 hover:text-primary hover:border-primary/30'
          } ${!isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {actionLoading === 'save' || actionLoading === 'unsave'
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Icon name="BookmarkIcon" size={16} className={saved ? 'fill-primary' : ''} />
          }
          <span>{loadingStatus ? '…' : saveCount}</span>
          {saved ? 'Wishlisted' : 'Wishlist'}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm glass-card text-neutral-400 border border-white/10 hover:text-white hover:border-white/20 transition-all"
        >
          <Icon name="ChatBubbleLeftIcon" size={16} />
          <span>{comments.length}</span>
          Comments
        </button>

        {!isAuthenticated && (
          <Link
            href="/login"
            className="text-xs text-primary hover:underline ml-auto"
          >
            Sign in to interact
          </Link>
        )}
      </div>

      {/* ── Comments panel ──────────────────────────────────────────────── */}
      {showComments && (
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-5">
          <h3 className="font-playfair text-lg font-bold text-white flex items-center gap-2">
            <Icon name="ChatBubbleLeftIcon" size={20} className="text-primary" />
            Comments
            <span className="ml-1 text-sm font-montserrat font-normal text-neutral-500">({comments.length})</span>
          </h3>

          {/* Comment form */}
          {isAuthenticated ? (
            <form onSubmit={submitComment} className="space-y-3">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold text-sm shrink-0 mt-1">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={`Comment on ${movieTitle}…`}
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-600">{commentText.length}/1000</span>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submitting}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                    >
                      {submitting
                        ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        : <Icon name="PaperAirplaneIcon" size={14} />
                      }
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-400 text-sm mb-3">
                <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link> to leave a comment.
              </p>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-4">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4 divide-y divide-white/5">
              {[...comments].reverse().map(c => (
                <div key={c.id} className="pt-4 first:pt-0 flex gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {c.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{c.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">{timeAgo(c.createdAt)}</span>
                        {c.isOwn && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                            title="Delete comment"
                          >
                            <Icon name="TrashIcon" size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed break-words">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
