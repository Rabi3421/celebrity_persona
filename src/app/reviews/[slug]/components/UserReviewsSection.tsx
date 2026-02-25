"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface UserReviewItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body: string;
  helpfulCount: number;
  createdAt: string;
  isOwn?: boolean;
}

interface Props {
  slug: string;
}

const STARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {STARS.map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Icon name="StarIcon" variant={(hover || value) >= s ? 'solid' : 'outline'} size={20}
            className={(hover || value) >= s ? 'text-yellow-400' : 'text-neutral-600'} />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-yellow-400 font-bold font-playfair text-lg">{value}<span className="text-neutral-500 text-sm font-montserrat font-normal">/10</span></span>
      )}
    </div>
  );
}

function RatingBadge({ r }: { r: number }) {
  const cls = r >= 8 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
            : r >= 6 ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
            : 'text-rose-400 bg-rose-500/15 border-rose-500/30';
  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border text-sm font-bold font-playfair shrink-0 ${cls}`}>
      {r}
    </div>
  );
}

export default function UserReviewsSection({ slug }: Props) {
  const { user, isAuthenticated, authHeaders, accessToken } = useAuth();

  const [reviews,     setReviews]     = useState<UserReviewItem[]>([]);
  const [avgRating,   setAvgRating]   = useState<number | null>(null);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [ownReview,   setOwnReview]   = useState<UserReviewItem | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [formRating,  setFormRating]  = useState(0);
  const [formTitle,   setFormTitle]   = useState('');
  const [formBody,    setFormBody]    = useState('');
  const [formError,   setFormError]   = useState('');
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);

  const apiKey = process.env.NEXT_PUBLIC_X_API_KEY ?? '';

  /* ── fetch user reviews ─────────────────────────────────────────────── */
  async function fetchReviews(p = 1) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/user/reviews/${slug}/user-reviews?page=${p}&limit=5`, {
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      if (data.success) {
        const items: UserReviewItem[] = data.data.map((r: UserReviewItem) => ({
          ...r,
          isOwn: isAuthenticated && user && r.userId === user.id,
        }));
        setReviews(items);
        setAvgRating(data.avgRating);
        setTotal(data.pagination.total);
        setPage(data.pagination.page);
        setPages(data.pagination.pages);

        // Pre-fill form if user already has a review
        if (isAuthenticated && user) {
          const own = items.find(r => r.userId === user.id);
          if (own) { setOwnReview(own); setFormRating(own.rating); setFormTitle(own.title ?? ''); setFormBody(own.body); }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Also check status endpoint for ownReview when authenticated
  useEffect(() => {
    fetchReviews(1);
  }, [slug, isAuthenticated, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── submit review ──────────────────────────────────────────────────── */
  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (formRating === 0)          return setFormError('Please select a rating');
    if (!formBody.trim())          return setFormError('Review body is required');
    if (formBody.trim().length < 20) return setFormError('Write at least 20 characters');

    setSubmitting(true);
    try {
      const res  = await fetch(`/api/user/reviews/${slug}/user-reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ rating: formRating, title: formTitle, body: formBody }),
      });
      const data = await res.json();
      if (!data.success) return setFormError(data.message || 'Failed to submit');
      setShowForm(false);
      setEditing(false);
      await fetchReviews(1);
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── delete review ──────────────────────────────────────────────────── */
  async function deleteReview() {
    setDeleting(true);
    try {
      await fetch(`/api/user/reviews/${slug}/user-reviews`, {
        method:  'DELETE',
        headers: authHeaders(),
      });
      setOwnReview(null);
      setFormRating(0); setFormTitle(''); setFormBody('');
      await fetchReviews(1);
    } finally {
      setDeleting(false);
    }
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <div>
          <h2 className="text-white font-bold font-playfair text-lg flex items-center gap-2">
            <Icon name="UsersIcon" size={18} className="text-yellow-400" />
            Audience Reviews
            {total > 0 && <span className="text-neutral-500 text-sm font-montserrat font-normal">({total})</span>}
          </h2>
          {avgRating && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Icon key={s} name="StarIcon" variant={avgRating / 2 >= s ? 'solid' : 'outline'} size={12}
                    className={avgRating / 2 >= s ? 'text-yellow-400' : 'text-neutral-600'} />
                ))}
              </div>
              <span className="text-yellow-400 text-sm font-bold font-playfair">{avgRating}</span>
              <span className="text-neutral-500 text-xs font-montserrat">/10 avg</span>
            </div>
          )}
        </div>

        {isAuthenticated && !ownReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black text-sm font-bold font-montserrat hover:bg-yellow-400 transition-all"
          >
            <Icon name="PencilSquareIcon" size={14} />
            Write a Review
          </button>
        )}
        {!isAuthenticated && (
          <Link href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10] text-neutral-300 text-sm font-montserrat hover:bg-white/[0.10] hover:text-white transition-all">
            <Icon name="PencilSquareIcon" size={14} />
            Sign in to review
          </Link>
        )}
      </div>

      {/* Review form */}
      {(showForm || editing) && (
        <form onSubmit={submitReview} className="p-6 border-b border-white/[0.06] space-y-4 bg-white/[0.02]">
          <h3 className="text-white font-semibold font-playfair text-sm mb-3">
            {editing ? 'Edit your review' : 'Share your thoughts'}
          </h3>

          {/* Star rating */}
          <div>
            <label className="text-neutral-400 text-xs font-montserrat mb-2 block">Your Rating *</label>
            <StarRating value={formRating} onChange={setFormRating} />
          </div>

          {/* Title */}
          <div>
            <label className="text-neutral-400 text-xs font-montserrat mb-1.5 block">Review Title</label>
            <input
              type="text" value={formTitle} maxLength={200}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Summarise your review in a headline…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5
                text-white placeholder-neutral-600 text-sm font-montserrat
                focus:outline-none focus:border-yellow-500/60 transition-all"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-neutral-400 text-xs font-montserrat mb-1.5 block">Your Review *</label>
            <textarea
              value={formBody} maxLength={2000} rows={5}
              onChange={e => setFormBody(e.target.value)}
              placeholder="What did you think? Was it worth watching? (min 20 characters)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                text-white placeholder-neutral-600 text-sm font-montserrat
                focus:outline-none focus:border-yellow-500/60 transition-all resize-none"
            />
            <div className="text-right text-neutral-600 text-xs font-montserrat mt-1">{formBody.length}/2000</div>
          </div>

          {formError && (
            <p className="text-rose-400 text-xs font-montserrat flex items-center gap-1.5">
              <Icon name="ExclamationCircleIcon" size={13} />
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-5 py-2 rounded-xl bg-yellow-500 text-black text-sm font-bold font-montserrat
                hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : editing ? 'Update Review' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(false); setFormError(''); }}
              className="px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400
                text-sm font-montserrat hover:bg-white/[0.08] hover:text-white transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Own review banner */}
      {ownReview && !editing && (
        <div className="mx-5 mt-5 p-4 rounded-xl bg-yellow-500/[0.07] border border-yellow-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="CheckCircleIcon" variant="solid" size={14} className="text-yellow-400" />
              <span className="text-yellow-400 text-xs font-bold font-montserrat">Your Review</span>
              <RatingBadge r={ownReview.rating} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditing(true); setShowForm(false); }}
                className="text-neutral-500 hover:text-white transition-colors">
                <Icon name="PencilSquareIcon" size={14} />
              </button>
              <button onClick={deleteReview} disabled={deleting}
                className="text-neutral-500 hover:text-rose-400 transition-colors disabled:opacity-50">
                <Icon name="TrashIcon" size={14} />
              </button>
            </div>
          </div>
          {ownReview.title && <p className="text-white text-sm font-semibold font-playfair mb-1">{ownReview.title}</p>}
          <p className="text-neutral-300 text-sm font-montserrat leading-relaxed">{ownReview.body}</p>
        </div>
      )}

      {/* Reviews list */}
      <div className="p-5 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/[0.06] rounded w-1/3" />
                <div className="h-3 bg-white/[0.04] rounded w-full" />
                <div className="h-3 bg-white/[0.04] rounded w-4/5" />
              </div>
            </div>
          ))
        ) : reviews.filter(r => !r.isOwn).length === 0 && !ownReview ? (
          <p className="text-neutral-600 text-sm font-montserrat text-center py-8">
            No audience reviews yet. {isAuthenticated ? 'Be the first!' : <><Link href="/login" className="text-yellow-400 hover:underline">Sign in</Link> to be the first!</>}
          </p>
        ) : (
          reviews.filter(r => !r.isOwn).map(r => (
            <div key={r.id} className="flex gap-3 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0">
              <RatingBadge r={r.rating} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white text-sm font-semibold font-montserrat">{r.userName}</span>
                  <span className="text-neutral-600 text-[10px] font-montserrat">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {r.title && <p className="text-white text-sm font-semibold font-playfair mb-1">{r.title}</p>}
                <p className="text-neutral-400 text-sm font-montserrat leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => { setPage(p => { const n = p - 1; fetchReviews(n); return n; })} }
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-montserrat
                hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              ← Prev
            </button>
            <span className="text-neutral-500 text-xs font-montserrat">{page} / {pages}</span>
            <button onClick={() => { setPage(p => { const n = p + 1; fetchReviews(n); return n; })} }
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-montserrat
                hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
