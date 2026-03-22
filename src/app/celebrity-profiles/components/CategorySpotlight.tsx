"use client";

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const categories = [
  {
    id: 'movie',
    label: 'Movie Stars',
    description: 'Bollywood, Hollywood & beyond — explore actors shaping the silver screen.',
    icon: 'FilmIcon',
    accent: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.04) 100%)',
    border: 'rgba(251,191,36,0.2)',
    emoji: '🎬',
  },
  {
    id: 'fashion',
    label: 'Fashion Icons',
    description: 'Runway royalty, style trendsetters and the faces behind the biggest brands.',
    icon: 'SparklesIcon',
    accent: '#f4a6b8',
    gradient: 'linear-gradient(135deg, rgba(244,166,184,0.15) 0%, rgba(244,166,184,0.04) 100%)',
    border: 'rgba(244,166,184,0.2)',
    emoji: '👗',
  },
  {
    id: 'music',
    label: 'Music Artists',
    description: 'Chart-toppers, indie legends and global superstars who define the sound.',
    icon: 'MusicalNoteIcon',
    accent: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.04) 100%)',
    border: 'rgba(52,211,153,0.2)',
    emoji: '🎵',
  },
  {
    id: 'sports',
    label: 'Sports Stars',
    description: 'Olympic champions, sporting legends and record-breakers from every arena.',
    icon: 'TrophyIcon',
    accent: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(96,165,250,0.04) 100%)',
    border: 'rgba(96,165,250,0.2)',
    emoji: '🏆',
  },
];

export default function CategorySpotlight() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Subtle section divider glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold tracking-widest uppercase block mb-3">
            Browse by Category
          </span>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
            Find Your Favourite World
          </h2>
          <p className="text-neutral-400 text-base md:text-lg max-w-xl mx-auto">
            Dive deep into the universe that fascinates you most — every category is packed
            with exclusive profiles, stories and style.
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/celebrity-profiles?category=${cat.id}`}
              className="group relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                background: cat.gradient,
                border: `1px solid ${cat.border}`,
              }}
            >
              {/* Icon bubble */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${cat.accent}18`, border: `1px solid ${cat.accent}30` }}
              >
                {cat.emoji}
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3
                  className="font-playfair text-xl font-bold mb-1.5"
                  style={{ color: cat.accent }}
                >
                  {cat.label}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{cat.description}</p>
              </div>

              {/* Arrow CTA */}
              <div className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                style={{ color: cat.accent }}>
                Explore
                <Icon
                  name="ArrowRightIcon"
                  size={15}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </div>

              {/* Hover shimmer line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)` }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
