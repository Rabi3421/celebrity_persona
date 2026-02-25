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
}

export default function ReviewInteractions({ slug }: Props) {
  const { user, isAuthenticated, authHeaders, accessToken } = useAuth();

  const [liked,        setLiked]        = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(0);
  const [saveCount,    setSaveCount]    = useState(0);
  const [comments,     setComments]     = useState<Comment[]>([]);
  const [commentText,  setCommentText]  = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── fetch initial status ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingStatus(true);
    fetch(`/api/user/reviews/${slug}/status`, { headers: authHeaders() })
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
  }, [isAuthenticated, accessToken, slug]); // eslint-disable-line react-hooks/exhaustive-depss

  /* ── like / save ──────────────────────────────────────────────────────── */
  async function doInteract(action: string) {
    if (!isAuthenticated || actionLoading) return;
    setActionLoading(action);
    try {
      const res  = await fetch(`/api/user/reviews/${slug}/interact`, {
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

  /* ── submit comment ───────────────────────────────────────────────────── */
  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/user/reviews/${slug}/interact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ action: 'comment', text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setCommentText('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ── delete comment ───────────────────────────────────────────────────── */
  async function deleteComment(commentId: string) {
    const res  = await fetch(`/api/user/reviews/${slug}/interact`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body:    JSON.stringify({ action: 'delete-comment', commentId }),
    });
    const data = await res.json();
    if (data.success) setComments(prev => prev.filter(c => c.id !== commentId));
  }

  const commentCount = comments.length;

  /* ── not-authenticated prompt ─────────────────────────────────────────── */
  function AuthNudge({ action }: { action: string }) {
    return (
      <Link href="/login"
        className="flex items-center gap-1.5 text-neutral-500 text-xs font-montserrat hover:text-yellow-400 transition-colors">
        Login to {action}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 py-4 border-b border-white/[0.06]">

        {/* Like */}
        {isAuthenticated ? (
          <button
            onClick={() => doInteract(liked ? 'unlike' : 'like')}
            disabled={!!actionLoading || loadingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-montserrat transition-all border
              ${liked
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
              } ${actionLoading === 'like' || actionLoading === 'unlike' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Icon name={liked ? 'HeartIcon' : 'HeartIcon'} variant={liked ? 'solid' : 'outline'} size={16}
              className={liked ? 'text-rose-400' : ''} />
            {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
          </button>
        ) : <AuthNudge action="like" />}

        {/* Save */}
        {isAuthenticated ? (
          <button
            onClick={() => doInteract(saved ? 'unsave' : 'save')}
            disabled={!!actionLoading || loadingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-montserrat transition-all border
              ${saved
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30'
                : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
              } ${actionLoading === 'save' || actionLoading === 'unsave' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Icon name="BookmarkIcon" variant={saved ? 'solid' : 'outline'} size={16}
              className={saved ? 'text-yellow-400' : ''} />
            {saveCount > 0 ? saveCount : ''} {saved ? 'Saved' : 'Save'}
          </button>
        ) : <AuthNudge action="save" />}

        {/* Comment toggle */}
        <button
          onClick={() => { setShowComments(v => !v); setTimeout(() => textareaRef.current?.focus(), 100); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-montserrat transition-all border
            ${showComments
              ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
              : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
            }`}
        >
          <Icon name="ChatBubbleOvalLeftIcon" variant="outline" size={16} />
          {commentCount > 0 ? commentCount : ''} Comment{commentCount !== 1 ? 's' : ''}
        </button>

        {/* Share */}
        <button
          onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-montserrat text-neutral-400
            bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all"
        >
          <Icon name="ShareIcon" size={16} />
          Share
        </button>
      </div>

      {/* ── Comments panel ──────────────────────────────────────────────── */}
      {showComments && (
        <div className="p-5 space-y-5">

          {/* Input */}
          {isAuthenticated ? (
            <form onSubmit={submitComment} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0 mt-1">
                <span className="text-yellow-400 text-xs font-bold font-playfair">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  ref={textareaRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this review…"
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                    text-white placeholder-neutral-600 text-sm font-montserrat
                    focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 text-xs font-montserrat">{commentText.length}/1000</span>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="px-4 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-bold font-montserrat
                      hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Icon name="LockClosedIcon" size={16} className="text-neutral-500" />
              <p className="text-neutral-500 text-sm font-montserrat">
                <Link href="/login" className="text-yellow-400 hover:underline">Sign in</Link> to join the conversation
              </p>
            </div>
          )}

          {/* Comment list */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-neutral-400 text-xs font-bold font-playfair">
                      {c.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-xs font-semibold font-montserrat">{c.userName}</span>
                      <span className="text-neutral-600 text-[10px] font-montserrat">
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {c.isOwn && (
                        <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[9px] font-montserrat font-bold">You</span>
                      )}
                    </div>
                    <p className="text-neutral-300 text-sm font-montserrat leading-relaxed">{c.text}</p>
                  </div>
                  {c.isOwn && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 text-neutral-600 hover:text-rose-400"
                    >
                      <Icon name="TrashIcon" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 text-sm font-montserrat text-center py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
