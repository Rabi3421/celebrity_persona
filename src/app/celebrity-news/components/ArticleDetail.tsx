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

  const [article,  setArticle]  = useState<ArticleData | null>(null);
  const [related,  setRelated]  = useState<RelatedArticle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

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
    fetch(`/api/user/news/${encodeURIComponent(articleId)}`, { headers })
      .then((r) => r.json())
      .then((d) => {
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
      <article className="py-12 px-6 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-4 w-48 bg-white/10 rounded" />
          <div className="h-10 w-3/4 bg-white/10 rounded-xl" />
          <div className="h-6 w-1/3 bg-white/5 rounded" />
          <div className="aspect-video w-full bg-white/10 rounded-2xl" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-white/5 rounded" />)}
          </div>
        </div>
      </article>
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
    <article className="py-12 px-6">
      <div className="max-w-4xl mx-auto">

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
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
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
        <div className="glass-card rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center">
            <span className="text-black font-bold text-xl">{article.author.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-0.5">Written by</p>
            <p className="font-playfair text-lg font-semibold text-white">{article.author}</p>
          </div>
        </div>

        {/* Article Content */}
        <div
          className="article-content prose prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* ── Interaction Bar ────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-3 flex-wrap">

          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading || !user}
            title={user ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all disabled:opacity-60 ${
              liked
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'glass-card text-neutral-300 hover:text-rose-400 hover:border-rose-500/30 border border-white/10'
            }`}
          >
            <Icon name={liked ? 'HeartIcon' : 'HeartIcon'} size={18}
              className={liked ? 'text-rose-400 fill-rose-400' : ''} />
            <span>{likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveLoading || !user}
            title={user ? (saved ? 'Unsave' : 'Save article') : 'Sign in to save'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all disabled:opacity-60 ${
              saved
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'glass-card text-neutral-300 hover:text-primary hover:border-primary/30 border border-white/10'
            }`}
          >
            <Icon name="BookmarkIcon" size={18} className={saved ? 'text-primary fill-primary' : ''} />
            <span>{saveCount > 0 ? saveCount : ''} {saved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Comments toggle */}
          <button
            onClick={() => { setShowComments(!showComments); setTimeout(() => commentInputRef.current?.focus(), 100); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all border ${
              showComments
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'glass-card text-neutral-300 hover:text-accent hover:border-accent/30 border-white/10'
            }`}
          >
            <Icon name="ChatBubbleLeftIcon" size={18} />
            <span>{commentCount > 0 ? commentCount : ''} Comment{commentCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Share */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy link"
              className="glass-card flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-neutral-300 hover:text-white border border-white/10 transition-all"
            >
              <Icon name={copied ? 'CheckIcon' : 'LinkIcon'} size={16} className={copied ? 'text-emerald-400' : ''} />
              <span className={copied ? 'text-emerald-400' : ''}>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              className="glass-card p-2.5 rounded-full text-neutral-300 hover:text-white border border-white/10 transition-all"
            >
              <Icon name="ShareIcon" size={16} />
            </a>
          </div>
        </div>

        {/* ── Comments Section ────────────────────────────────────────────── */}
        {showComments && (
          <div className="glass-card rounded-2xl p-8 mb-12">
            <h3 className="font-playfair text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Icon name="ChatBubbleLeftIcon" size={22} className="text-accent" />
              Comments
              {commentCount > 0 && (
                <span className="text-base font-normal text-neutral-400">({commentCount})</span>
              )}
            </h3>

            {/* Comment input */}
            {user ? (
              <form onSubmit={handleComment} className="mb-8">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center mt-1">
                    <span className="text-black font-bold text-sm">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 space-y-3">
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
                        {commentError && (
                          <span className="text-xs text-red-400">{commentError}</span>
                        )}
                        <button
                          type="submit"
                          disabled={commentPosting || !commentText.trim()}
                          className="bg-primary text-black px-5 py-2 rounded-full text-sm font-semibold hover:glow-gold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {commentPosting && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                          {commentPosting ? 'Posting…' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-neutral-400 text-sm">
                  <Link href="/login" className="text-accent hover:underline">Sign in</Link> to leave a comment.
                </p>
              </div>
            )}

            {/* Comment list */}
            {comments.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div className="space-y-5">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                      {c.userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">{c.userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-white">{c.userName}</span>
                        {c.isOwn && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>
                        )}
                        <span className="text-xs text-neutral-500">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed break-words">{c.text}</p>
                    </div>
                    {c.isOwn && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                        className="text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0 self-start mt-1"
                      >
                        <Icon name="TrashIcon" size={15} />
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
          <div className="glass-card rounded-2xl p-8 mb-12">
            <h3 className="font-playfair text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Icon name="UserGroupIcon" size={24} className="text-accent" />
              Featured Celebrities
            </h3>
            <div className="flex flex-wrap gap-3">
              {article.tags.map((tag) => (
                <Link key={tag} href={`/celebrity-profiles?search=${encodeURIComponent(tag)}`}>
                  <span className="glass-card px-4 py-2 rounded-full text-sm font-medium text-white hover:glow-gold transition-all cursor-pointer">
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div>
            <h3 className="font-playfair text-3xl font-bold text-white mb-8">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link key={rel.id} href={`/celebrity-news/${rel.slug || rel.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer">
                    {rel.thumbnail ? (
                      <div className="relative aspect-video">
                        <AppImage src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                            {rel.category}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Icon name="NewspaperIcon" size={40} className="text-white/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-playfair text-base font-semibold text-white line-clamp-2">{rel.title}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

    </article>
  );
}
