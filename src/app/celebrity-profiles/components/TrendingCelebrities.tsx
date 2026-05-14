"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import type { CelebrityDoc } from './CelebrityGrid';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function TrendingCelebrities({
  initialCelebrities = [],
  initialLoaded = false,
}: {
  initialCelebrities?: CelebrityDoc[];
  initialLoaded?: boolean;
}) {
  const [celebrities, setCelebrities] = useState<CelebrityDoc[]>(initialCelebrities);
  const [loading, setLoading] = useState(!initialLoaded && initialCelebrities.length === 0);

  useEffect(() => {
    if (initialLoaded) return;
    const fetchTrending = async () => {
      try {
        const res = await fetch(`/api/user/celebrities?limit=6&page=1`, {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.celebrities)) {
          // sort by popularityScore desc, take top 6
          const sorted = [...data.celebrities].sort(
            (a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0)
          );
          setCelebrities(sorted.slice(0, 6));
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [initialLoaded]);

  if (loading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-white/5 rounded-full animate-pulse mb-10" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!celebrities.length) return null;

  const rankColors = ['#fbbf24', '#e5e7eb', '#cd7f32'];

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section heading */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary text-sm font-semibold tracking-widest uppercase">
                🔥 Trending
              </span>
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">
              Most Popular Right Now
            </h2>
          </div>
          <Link
            href="/celebrity-profiles"
            className="hidden md:flex items-center gap-1.5 text-sm text-neutral-400 hover:text-primary transition-colors"
          >
            View all <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>

        {/* Horizontal scrollable strip */}
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
          {celebrities.map((celeb, idx) => {
            const img = celeb.profileImage || celeb.coverImage;
            const rankColor = rankColors[idx] ?? 'transparent';
            const showRank = idx < 3;

            return (
              <Link
                key={celeb.id}
                href={`/celebrity-profiles/${celeb.slug}`}
                className="group relative flex-shrink-0 w-44 rounded-2xl overflow-hidden snap-start cursor-pointer"
                style={{
                  height: '260px',
                  background: '#1c1c1e',
                  boxShadow: showRank
                    ? `0 0 0 2px ${rankColor}40, 0 8px 24px rgba(0,0,0,0.6)`
                    : '0 4px 16px rgba(0,0,0,0.5)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {/* Photo */}
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={celeb.name}
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)',
                  }}
                />

                {/* Rank badge */}
                {showRank && (
                  <div
                    className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: rankColor, color: '#000' }}
                  >
                    #{idx + 1}
                  </div>
                )}

                {/* Verified */}
                {celeb.isVerified && (
                  <div
                    className="absolute top-3 right-3 rounded-full p-0.5"
                    style={{ background: '#22c55e' }}
                  >
                    <Icon name="CheckIcon" size={11} className="text-white" />
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <p className="text-white font-semibold text-sm leading-tight line-clamp-1 font-playfair">
                    {celeb.name}
                  </p>
                  {celeb.profession && (
                    <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{celeb.profession}</p>
                  )}
                  {celeb.viewCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Icon name="EyeIcon" size={11} className="text-primary" />
                      <span className="text-primary text-xs font-medium">
                        {celeb.viewCount.toLocaleString()} views
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
