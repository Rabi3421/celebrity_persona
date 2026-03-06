"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export interface CelebrityDoc {
  id: string;
  name: string;
  slug: string;
  profession: string;
  category: string;
  profileImage: string;
  coverImage: string;
  isFeatured: boolean;
  isVerified: boolean;
  popularityScore: number;
  viewCount: number;
  netWorth: string;
  nationality: string;
  yearsActive: string;
  movieCount: number;
  socialMedia: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  introduction: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CelebrityGridProps {
  searchQuery: string;
  activeFilter: string;
}

const LIMIT = 12;

/** Strip HTML tags and decode common entities to plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')          // remove tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')            // collapse whitespace
    .trim();
}

export default function CelebrityGrid({ searchQuery, activeFilter }: CelebrityGridProps) {
  const [celebrities, setCelebrities] = useState<CelebrityDoc[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCelebrities = useCallback(async (page: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (activeFilter && activeFilter !== 'all') params.set('category', activeFilter);

      const res = await fetch(`/api/user/celebrities?${params.toString()}`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch celebrities');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'API error');
      setCelebrities(data.celebrities);
      setPagination(data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    fetchCelebrities(1);
  }, [fetchCelebrities]);

  const handlePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchCelebrities(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/5] bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Icon name="ExclamationTriangleIcon" size={40} className="text-secondary" />
        <p className="text-neutral-400">{error}</p>
        <button
          onClick={() => fetchCelebrities(pagination.page)}
          className="px-6 py-2.5 rounded-full glass-card text-white hover:text-primary transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────────
  if (!celebrities.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Icon name="MagnifyingGlassIcon" size={40} className="text-neutral-600" />
        <p className="text-neutral-400 text-lg">No celebrities found</p>
        <p className="text-neutral-600 text-sm">Try a different search or filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Results count */}
      <p className="text-sm text-neutral-500">
        Showing{' '}
        <span className="text-neutral-300 font-medium">
          {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)}
        </span>{' '}
        of <span className="text-neutral-300 font-medium">{pagination.total}</span> celebrities
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {celebrities.map((celebrity) => {
          const img = celebrity.profileImage || celebrity.coverImage;
          const catMeta: Record<string, { accent: string; verifiedBg: string }> = {
            movie:   { accent: '#fbbf24', verifiedBg: '#22c55e' },
            fashion: { accent: '#f4a6b8', verifiedBg: '#22c55e' },
            music:   { accent: '#34d399', verifiedBg: '#22c55e' },
            sports:  { accent: '#60a5fa', verifiedBg: '#22c55e' },
          };
          const cat = catMeta[celebrity.category] || { accent: '#fbbf24', verifiedBg: '#22c55e' };
          const socials = [
            { url: celebrity.socialMedia?.instagram, icon: 'CameraIcon' },
            { url: celebrity.socialMedia?.twitter,   icon: 'ChatBubbleLeftEllipsisIcon' },
            { url: celebrity.socialMedia?.youtube,   icon: 'PlayCircleIcon' },
          ].filter(s => s.url);

          return (
            <Link
              key={celebrity.id}
              href={`/celebrity-profiles/${celebrity.slug}`}
              className="group relative rounded-[28px] overflow-hidden block cursor-pointer"
              style={{
                background: '#1c1c1e',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                transition: 'box-shadow 0.4s ease, transform 0.4s ease',
              }}
            >
              {/* ── DEFAULT STATE (visible when not hovered) ── */}
              <div className="group-hover:opacity-0 group-hover:pointer-events-none transition-opacity duration-[400ms] ease-in-out">
                {/* Photo — rounded inside card, not full bleed */}
                <div className="relative mx-3 mt-3 rounded-[20px] overflow-hidden" style={{ height: '260px' }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={celebrity.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#2d1b4e,#1a0f2e)' }} />
                  )}
                  {/* Featured badge */}
                  {celebrity.isFeatured && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-black uppercase"
                      style={{ background: cat.accent }}>
                      <Icon name="StarIcon" size={9} />
                      Featured
                    </span>
                  )}
                </div>

                {/* Info section */}
                <div className="px-4 pt-4 pb-5">
                  {/* Name + verified */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-white text-xl leading-tight"
                      style={{ fontFamily: 'Playfair Display, serif' }}>
                      {celebrity.name}
                    </h3>
                    {celebrity.isVerified && (
                      <span className="flex-shrink-0 rounded-full p-0.5" style={{ background: cat.verifiedBg }}>
                        <Icon name="CheckIcon" size={12} className="text-white" />
                      </span>
                    )}
                  </div>

                  {/* Introduction */}
                  {celebrity.introduction ? (
                    <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: '#8e8e93' }}>
                      {stripHtml(celebrity.introduction)}
                    </p>
                  ) : (
                    celebrity.yearsActive && (
                      <p className="text-sm mb-4" style={{ color: '#8e8e93' }}>{celebrity.yearsActive}</p>
                    )
                  )}

                  {/* Bottom row — stats + follow CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {celebrity.movieCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="FilmIcon" size={15} className="text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-300">{celebrity.movieCount}</span>
                        </div>
                      )}
                      {socials.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="CameraIcon" size={15} className="text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-300">{socials.length}</span>
                        </div>
                      )}
                      {celebrity.nationality && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="GlobeAltIcon" size={15} className="text-neutral-500" />
                          <span className="text-sm text-neutral-400">{celebrity.nationality}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ background: '#2c2c2e' }}
                    >
                      Read more
                    </span>
                  </div>
                </div>
              </div>

              {/* ── HOVER STATE (full-bleed immersive) ── */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-[400ms] ease-in-out flex flex-col justify-end"
                style={{ minHeight: '420px' }}>
                {/* Full-bleed photo */}
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={celebrity.name}
                    className="absolute inset-0 w-full h-full object-cover object-top scale-105 transition-transform duration-700"
                  />
                )}
                {/* Dark gradient overlay */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)' }} />

                {/* Content over image */}
                <div className="relative z-10 px-5 pb-6 pt-4">
                  {/* Name + verified */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-white text-xl leading-tight"
                      style={{ fontFamily: 'Playfair Display, serif' }}>
                      {celebrity.name}
                    </h3>
                    {celebrity.isVerified && (
                      <span className="flex-shrink-0 rounded-full p-0.5" style={{ background: cat.verifiedBg }}>
                        <Icon name="CheckIcon" size={12} className="text-white" />
                      </span>
                    )}
                  </div>

                  {/* Introduction */}
                  {celebrity.introduction ? (
                    <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {stripHtml(celebrity.introduction)}
                    </p>
                  ) : (
                    celebrity.yearsActive && (
                      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>{celebrity.yearsActive}</p>
                    )
                  )}

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {celebrity.movieCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="FilmIcon" size={15} className="text-white/60" />
                          <span className="text-sm font-medium text-white/80">{celebrity.movieCount}</span>
                        </div>
                      )}
                      {socials.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="CameraIcon" size={15} className="text-white/60" />
                          <span className="text-sm font-medium text-white/80">{socials.length}</span>
                        </div>
                      )}
                      {celebrity.nationality && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="GlobeAltIcon" size={15} className="text-white/60" />
                          <span className="text-sm text-white/70">{celebrity.nationality}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className="px-4 py-2 rounded-full text-sm font-semibold text-black"
                      style={{ background: 'rgba(255,255,255,0.92)' }}
                    >
                      Read more
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2.5 rounded-full glass-card text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <Icon name="ChevronLeftIcon" size={18} />
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                acc.push('...');
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-neutral-600 select-none">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => handlePage(item as number)}
                  className={`min-w-[40px] h-10 rounded-full text-sm font-medium transition-all ${
                    item === pagination.page
                      ? 'bg-primary text-black'
                      : 'glass-card text-neutral-400 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => handlePage(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="p-2.5 rounded-full glass-card text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <Icon name="ChevronRightIcon" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
