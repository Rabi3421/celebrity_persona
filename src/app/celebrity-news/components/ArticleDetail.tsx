"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  publishDate: string;
  celebrity: { name: string; slug: string; profileImage?: string } | null;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  comments: NewsComment[];
}

interface NewsComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  publishDate?: string;
  excerpt?: string;
}

interface ArticleDetailProps {
  articleId: string;
}

function readTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
  return formatDate(raw);
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const { user, authHeaders } = useAuth();

  const [article,     setArticle]     = useState<ArticleData | null>(null);
  const [related,     setRelated]     = useState<RelatedArticle[]>([]);
  const [sidebarNews, setSidebarNews] = useState<RelatedArticle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // Interaction state
  const [liked,       setLiked]       = useState(false);
  const [likeCount,   setLikeCount]   = useState(0);
  const [saved,       setSaved]       = useState(false);
  const [saveCount,   setSaveCount]   = useState(0);
  const [comments,    setComments]    = useState<NewsComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [likeLoading,  setLikeLoading]  = useState(false);
  const [saveLoading,  setSaveLoading]  = useState(false);

  // Comment UI
  const [showComments,   setShowComments]   = useState(false);
  const [commentText,    setCommentText]    = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError,   setCommentError]   = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Share
  const [copied, setCopied] = useState(false);

  // ── Fetch article ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setError('');
    const headers = user ? authHeaders() : {};

    // Fetch article + sidebar news in parallel
    Promise.all([
      fetch(`/api/user/news/${encodeURIComponent(articleId)}`, { headers }).then((r) => r.json()),
      fetch(`/api/user/news?page=1&limit=8&sort=latest`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '' },
      }).then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([d, sidebarD]) => {
        if (d.success) {
          const a: ArticleData = d.article;
          setArticle(a);
          setRelated(d.related ?? []);
          setLiked(a.liked);
          setLikeCount(a.likeCount);
          setSaved(a.saved);
          setSaveCount(a.saveCount);
          setComments(a.comments ?? []);
          setCommentCount(a.commentCount);

          // Sidebar: latest news excluding current article
          if (sidebarD?.success && sidebarD.data) {
            const others = sidebarD.data
              .filter((n: any) => String(n._id) !== d.article.id && n.slug !== d.article.slug)
              .slice(0, 6)
              .map((n: any) => ({
                id:          String(n._id),
                title:       n.title,
                slug:        n.slug,
                thumbnail:   n.thumbnail || '',
                category:    n.category  || '',
                publishDate: n.publishDate || n.createdAt,
                excerpt:     n.excerpt    || '',
              }));
            setSidebarNews(others);
          }
        } else {
          setError(d.message || 'Article not found.');
        }
      })
      .catch(() => setError('Failed to load article.'))
      .finally(() => setLoading(false));
  }, [articleId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const slug = article?.slug || articleId;

  // ── Interact helper ───────────────────────────────────────────────────────
  const interact = async (action: string, extra?: Record<string, string>) => {
    const res  = await fetch(`/api/user/news/${encodeURIComponent(slug)}/interact`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body:    JSON.stringify({ action, ...extra }),
    });
    return res.json();
  };

  // ── Like ─────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user) return;
    setLikeLoading(true);
    const action = liked ? 'unlike' : 'like';
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const d = await interact(action);
      if (d.success) { setLiked(d.liked); setLikeCount(d.count); }
      else           { setLiked(liked);   setLikeCount(likeCount); }
    } catch { setLiked(liked); setLikeCount(likeCount); }
    finally  { setLikeLoading(false); }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaveLoading(true);
    const action = saved ? 'unsave' : 'save';
    setSaved(!saved);
    setSaveCount((c) => c + (saved ? -1 : 1));
    try {
      const d = await interact(action);
      if (d.success) { setSaved(d.saved); setSaveCount(d.count); }
      else           { setSaved(saved);   setSaveCount(saveCount); }
    } catch { setSaved(saved); setSaveCount(saveCount); }
    finally  { setSaveLoading(false); }
  };

  // ── Post comment ──────────────────────────────────────────────────────────
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !user) return;
    setCommentPosting(true);
    setCommentError('');
    try {
      const d = await interact('comment', { text });
      if (d.success) {
        setComments((prev) => [d.comment, ...prev]);
        setCommentCount(d.count);
        setCommentText('');
      } else {
        setCommentError(d.message || 'Failed to post comment.');
      }
    } catch { setCommentError('Network error. Please try again.'); }
    finally  { setCommentPosting(false); }
  };

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId: string) => {
    try {
      const d = await interact('delete-comment', { commentId });
      if (d.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCount(d.count);
      }
    } catch {}
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-10 animate-pulse">
            {/* Main column */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-10 w-3/4 bg-white/10 rounded-xl" />
              <div className="h-5 w-1/3 bg-white/5 rounded" />
              <div className="aspect-video w-full bg-white/10 rounded-2xl" />
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-white/5 rounded" />)}
              </div>
            </div>
            {/* Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0 space-y-4">
              <div className="h-6 w-32 bg-white/10 rounded" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !article) {
    return (
      <article className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Icon name="ExclamationCircleIcon" size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="font-playfair text-2xl text-white mb-2">Article not found</h2>
          <p className="text-neutral-400 mb-6">{error || "The article you're looking for doesn't exist."}</p>
          <Link href="/celebrity-news" className="bg-primary text-black px-6 py-3 rounded-full font-semibold hover:glow-gold transition-all">
            ← Back to News
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-10 items-start">

          {/* ════════════════ LEFT — Main Article ════════════════ */}
          <article className="flex-1 min-w-0">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-8">
              <Link href="/celebrity-news" className="hover:text-accent transition-colors">Celebrity News</Link>
              <Icon name="ChevronRightIcon" size={16} />
              <span className="text-white">{article.category}</span>
            </nav>

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
              {article.category}
            </span>
            {article.featured && (
              <span className="bg-primary/20 text-primary border border-primary/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                ★ Featured
              </span>
            )}
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-lg text-neutral-300 mb-4 leading-relaxed">{article.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-neutral-400 flex-wrap">
            <span>{formatDate(article.publishDate)}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span>{readTime(article.content)}</span>
            {article.celebrity && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <Link href={`/celebrity-profiles/${article.celebrity.slug}`} className="text-accent hover:underline">
                  {article.celebrity.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {article.thumbnail && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <AppImage src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Author Info */}
            <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{article.author.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Written by</p>
                <p className="font-playfair text-base font-semibold text-white">{article.author}</p>
              </div>
            </div>

            {/* Article Content */}
            <div
              className="article-content prose prose-invert max-w-none mb-10"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* ── Interaction Bar ── */}
            <div className="glass-card rounded-2xl p-4 mb-8 flex items-center gap-3 flex-wrap">

              {/* Like */}
              <button
                onClick={handleLike}
                disabled={likeLoading || !user}
                title={user ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all disabled:opacity-60 ${
                  liked
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'glass-card text-neutral-300 hover:text-rose-400 hover:border-rose-500/30 border border-white/10'
                }`}
              >
                <Icon name="HeartIcon" size={16} className={liked ? 'text-rose-400 fill-rose-400' : ''} />
                <span>{likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}</span>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saveLoading || !user}
                title={user ? (saved ? 'Unsave' : 'Save article') : 'Sign in to save'}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all disabled:opacity-60 ${
                  saved
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'glass-card text-neutral-300 hover:text-primary hover:border-primary/30 border border-white/10'
                }`}
              >
                <Icon name="BookmarkIcon" size={16} className={saved ? 'text-primary fill-primary' : ''} />
                <span>{saveCount > 0 ? saveCount : ''} {saved ? 'Saved' : 'Save'}</span>
              </button>

              {/* Comments toggle */}
              <button
                onClick={() => { setShowComments(!showComments); setTimeout(() => commentInputRef.current?.focus(), 100); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all border ${
                  showComments
                    ? 'bg-accent/20 text-accent border-accent/40'
                    : 'glass-card text-neutral-300 hover:text-accent hover:border-accent/30 border-white/10'
                }`}
              >
                <Icon name="ChatBubbleLeftIcon" size={16} />
                <span>{commentCount > 0 ? commentCount : ''} Comment{commentCount !== 1 ? 's' : ''}</span>
              </button>

              {/* Share */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  title="Copy link"
                  className="glass-card flex items-center gap-2 px-3 py-2 rounded-full text-sm text-neutral-300 hover:text-white border border-white/10 transition-all"
                >
                  <Icon name={copied ? 'CheckIcon' : 'LinkIcon'} size={15} className={copied ? 'text-emerald-400' : ''} />
                  <span className={copied ? 'text-emerald-400' : ''}>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on X"
                  className="glass-card p-2 rounded-full text-neutral-300 hover:text-white border border-white/10 transition-all"
                >
                  <Icon name="ShareIcon" size={15} />
                </a>
              </div>
            </div>

            {/* ── Comments Section ── */}
            {showComments && (
              <div className="glass-card rounded-2xl p-6 mb-10">
                <h3 className="font-playfair text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <Icon name="ChatBubbleLeftIcon" size={20} className="text-accent" />
                  Comments
                  {commentCount > 0 && (
                    <span className="text-sm font-normal text-neutral-400">({commentCount})</span>
                  )}
                </h3>

                {user ? (
                  <form onSubmit={handleComment} className="mb-6">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-black font-bold text-xs">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          ref={commentInputRef}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          disabled={commentPosting}
                          className="w-full glass-card px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none disabled:opacity-50"
                          placeholder="Share your thoughts…"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">{commentText.length}/1000</span>
                          <div className="flex items-center gap-3">
                            {commentError && <span className="text-xs text-red-400">{commentError}</span>}
                            <button
                              type="submit"
                              disabled={commentPosting || !commentText.trim()}
                              className="bg-primary text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:glow-gold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {commentPosting && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
                              {commentPosting ? 'Posting…' : 'Post'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="mb-6 p-4 rounded-xl border border-white/10 text-center">
                    <p className="text-neutral-400 text-sm">
                      <Link href="/login" className="text-accent hover:underline">Sign in</Link> to leave a comment.
                    </p>
                  </div>
                )}

                {comments.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                          {c.userAvatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                            : <span className="text-white text-xs font-bold">{c.userName.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-white">{c.userName}</span>
                            {c.isOwn && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                            <span className="text-xs text-neutral-500">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-neutral-300 leading-relaxed break-words">{c.text}</p>
                        </div>
                        {c.isOwn && (
                          <button onClick={() => handleDeleteComment(c.id)} title="Delete" className="text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0 self-start mt-1">
                            <Icon name="TrashIcon" size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="glass-card rounded-2xl p-6 mb-10">
                <h3 className="font-playfair text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="UserGroupIcon" size={20} className="text-accent" />
                  Featured Celebrities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link key={tag} href={`/celebrity-profiles?search=${encodeURIComponent(tag)}`}>
                      <span className="glass-card px-3 py-1.5 rounded-full text-sm font-medium text-white hover:glow-gold transition-all cursor-pointer">{tag}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {related.length > 0 && (
              <div>
                <h3 className="font-playfair text-2xl font-bold text-white mb-6">Related Articles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {related.map((rel) => (
                    <Link key={rel.id} href={`/celebrity-news/${rel.slug || rel.id}`}>
                      <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer">
                        {rel.thumbnail ? (
                          <div className="relative aspect-video">
                            <AppImage src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover" />
                            <div className="absolute top-3 left-3">
                              <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                                {rel.category}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                            <Icon name="NewspaperIcon" size={36} className="text-white/30" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-playfair text-sm font-semibold text-white line-clamp-2">{rel.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ════════════════ RIGHT — Sticky Sidebar ════════════════ */}
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-28 space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-playfair text-lg font-bold text-white">More News</h3>
                <Link href="/celebrity-news" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <Icon name="ArrowRightIcon" size={12} />
                </Link>
              </div>

              {/* News list */}
              {sidebarNews.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {sidebarNews.map((n, idx) => (
                    <Link key={n.id} href={`/celebrity-news/${n.slug || n.id}`}>
                      <div className={`flex gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group ${
                        n.slug === article.slug || n.id === article.id
                          ? 'bg-primary/10 border border-primary/20'
                          : ''
                      }`}>
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900">
                          {n.thumbnail ? (
                            <AppImage
                              src={n.thumbnail}
                              alt={n.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="NewspaperIcon" size={20} className="text-white/30" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-accent/80 mb-0.5 block">
                            {n.category}
                          </span>
                          <p className="text-xs font-semibold text-white line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                            {n.title}
                          </p>
                          {n.publishDate && (
                            <p className="text-[10px] text-neutral-500 mt-1">{formatDate(n.publishDate)}</p>
                          )}
                        </div>

                        {/* Index */}
                        <span className="text-[10px] text-neutral-700 font-bold self-start mt-0.5 flex-shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Category shortcuts */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Browse by category</p>
                <div className="flex flex-wrap gap-2">
                  {['Celebrity News', 'Fashion', 'Movies', 'Lifestyle', 'Events'].map((cat) => (
                    <Link
                      key={cat}
                      href={`/celebrity-news?category=${encodeURIComponent(cat)}`}
                      className="text-[11px] px-3 py-1.5 rounded-full glass-card text-neutral-400 hover:text-white hover:border-white/20 border border-white/10 transition-all"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}