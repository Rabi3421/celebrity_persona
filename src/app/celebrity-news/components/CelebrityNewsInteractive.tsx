"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import VerticalMarquee from './VerticalMarquee';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NewsArticleDB {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  author?: string;
  category?: string;
  celebrity?: { name?: string; slug?: string; profileImage?: string } | null;
  tags?: string[];
  publishDate?: string;
  createdAt?: string;
  featured: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

// Very rough reading-time estimate (1 word ≈ 0.004 min)
function readTime(excerpt?: string) {
  const words = (excerpt || '').split(/\s+/).filter(Boolean).length;
  const mins  = Math.max(1, Math.round(words * 0.04)); // excerpt only → floor to min
  return `${mins} min read`;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-5 w-full rounded bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/4 rounded bg-white/10" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CelebrityNewsInteractive() {
  const [articles,    setArticles]    = useState<NewsArticleDB[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('all');
  const [sort,        setSort]        = useState('latest');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  const LIMIT = 12;

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p), limit: String(LIMIT), sort,
      });
      if (search)                  params.set('q',        search);
      if (category && category !== 'all') params.set('category', category);

      const res = await fetch(`/api/user/news?${params}`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load news');

      setArticles(data.data || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total  || 0);
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => { fetchNews(1); }, [fetchNews]);

  // ── derived ────────────────────────────────────────────────────────────────
  const featured  = articles.find((a) => a.featured) || articles[0];
  const trending  = articles.filter((a) => a._id !== featured?._id).slice(0, 8);
  const remaining = articles.filter((a) => a._id !== featured?._id);

  // Gather unique categories from current page for filter pills
  const categories = ['all', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[]];

  const articleHref = (a: NewsArticleDB) => `/celebrity-news/${a.slug || a._id}`;

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <span className="font-montserrat text-xs uppercase tracking-wider text-accent mb-4 block">
            Latest Updates
          </span>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-4">
            Celebrity News
          </h1>
          <p className="font-inter text-lg text-neutral-400 max-w-2xl mx-auto">
            Stay updated with the latest entertainment news and celebrity updates
          </p>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col md:flex-row gap-3 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchNews(1)}
              placeholder="Search news, celebrity, tags…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="featured">Featured First</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchNews(1)}
            disabled={loading}
            className="px-3 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <Icon name="ArrowPathIcon" size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Category pills */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); }}
                className={`px-4 py-1.5 rounded-full font-montserrat text-xs uppercase tracking-wider transition-all border ${
                  category === c
                    ? 'bg-accent text-black border-accent'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:border-white/30'
                }`}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="glass-card rounded-2xl p-6 border border-red-500/20 bg-red-500/10 flex items-center gap-3 mb-10">
            <Icon name="ExclamationCircleIcon" size={20} className="text-red-400 shrink-0" />
            <p className="text-red-400 font-montserrat text-sm flex-1">{error}</p>
            <button onClick={() => fetchNews(1)} className="text-xs text-yellow-400 hover:underline font-montserrat">Retry</button>
          </div>
        )}

        {/* ── Featured Article ── */}
        {loading ? (
          <div className="glass-card rounded-3xl overflow-hidden mb-12 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="aspect-[16/9] lg:aspect-auto bg-white/10" />
              <div className="p-10 space-y-4">
                <div className="h-4 w-1/4 bg-white/10 rounded" />
                <div className="h-8 w-3/4 bg-white/10 rounded" />
                <div className="h-8 w-1/2 bg-white/10 rounded" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ) : featured ? (
          <Link href={articleHref(featured)}>
            <div className="glass-card rounded-3xl overflow-hidden mb-12 hover:glow-emerald transition-all duration-500 cursor-pointer">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative aspect-[16/9] lg:aspect-auto min-h-[280px]">
                  {featured.thumbnail ? (
                    <AppImage
                      src={featured.thumbnail}
                      alt={featured.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-purple-500/10 flex items-center justify-center">
                      <Icon name="NewspaperIcon" size={64} className="text-white/20" />
                    </div>
                  )}
                  {featured.category && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                        {featured.category}
                      </span>
                    </div>
                  )}
                  {featured.featured && (
                    <div className="absolute top-6 right-6">
                      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Icon name="SparklesIcon" size={10} /> Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-neutral-400">{formatDate(featured.publishDate || featured.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-600" />
                    <span className="text-sm text-neutral-400">{readTime(featured.excerpt)}</span>
                  </div>
                  <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-base text-neutral-400 mb-6 line-clamp-3">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-accent hover:gap-4 transition-all">
                      <span className="text-sm font-medium">Read Full Story</span>
                      <Icon name="ArrowRightIcon" size={16} />
                    </div>
                    {featured.author && (
                      <span className="text-xs text-neutral-500 font-montserrat">by {featured.author}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : !error && (
          <div className="glass-card rounded-3xl p-12 text-center mb-12">
            <Icon name="NewspaperIcon" size={48} className="mx-auto mb-4 text-neutral-700" />
            <p className="text-neutral-500 font-montserrat">No news articles yet. Check back soon!</p>
          </div>
        )}

        {/* ── Trending + Marquee ── */}
        {(loading || remaining.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vertical Marquee */}
            <VerticalMarquee articles={trending.length > 0 ? trending : articles} loading={loading} />

            {/* Trending Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-playfair text-2xl font-bold text-white">Trending Headlines</h3>
                {!loading && (
                  <span className="text-neutral-500 text-xs font-montserrat">{totalCount} articles</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  : remaining.slice(0, 6).map((article) => (
                    <Link key={article._id} href={articleHref(article)}>
                      <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer h-full">
                        <div className="relative aspect-video">
                          {article.thumbnail ? (
                            <AppImage
                              src={article.thumbnail}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-yellow-500/10 flex items-center justify-center">
                              <Icon name="NewspaperIcon" size={32} className="text-white/20" />
                            </div>
                          )}
                          {article.category && (
                            <div className="absolute top-4 left-4">
                              <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                                {article.category}
                              </span>
                            </div>
                          )}
                          {article.featured && (
                            <div className="absolute top-4 right-4">
                              <Icon name="SparklesIcon" size={14} className="text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                            <span>{formatDate(article.publishDate || article.createdAt)}</span>
                            <span>•</span>
                            <span>{readTime(article.excerpt)}</span>
                          </div>
                          <h4 className="font-playfair text-lg font-semibold text-white mb-2 line-clamp-2">
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{article.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="UserIcon" size={14} className="text-neutral-500" />
                              <span className="text-sm text-neutral-400">
                                {article.celebrity?.name || article.author || 'Staff Writer'}
                              </span>
                            </div>
                            {(article.tags || []).length > 0 && (
                              <span className="text-xs text-neutral-600 font-montserrat">
                                #{article.tags![0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => fetchNews(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <Icon name="ChevronLeftIcon" size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => fetchNews(n)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium font-montserrat transition-all ${
                        n === page ? 'bg-yellow-500 text-black' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchNews(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <Icon name="ChevronRightIcon" size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}