"use client";

import Link from 'next/link';

const features = [
  {
    emoji: '📖',
    title: 'Wikipedia-Level Bios',
    description:
      "Read full career timelines, early life stories, personal milestones and trivia you won\u2019t find anywhere else.",
    accent: '#fbbf24',
  },
  {
    emoji: '👗',
    title: 'Fashion Deep-Dives',
    description:
      'Explore iconic outfit breakdowns with brand credits, styling tips and the story behind each look.',
    accent: '#f4a6b8',
  },
  {
    emoji: '🎬',
    title: 'Complete Filmography',
    description:
      'Every movie, show and collaboration neatly catalogued — sortable by year, genre and role type.',
    accent: '#34d399',
  },
  {
    emoji: '📊',
    title: 'Popularity Insights',
    description:
      'See real-time popularity scores, trending tags and view counts that tell you who the internet loves right now.',
    accent: '#60a5fa',
  },
  {
    emoji: '🌐',
    title: 'Social Media Hub',
    description:
      'Direct links to every verified social account — Instagram, Twitter, YouTube and more all in one card.',
    accent: '#a78bfa',
  },
  {
    emoji: '✅',
    title: 'Verified Profiles',
    description:
      'Every profile is manually reviewed and verified so you always get accurate, trustworthy information.',
    accent: '#fbbf24',
  },
];

export default function WhyExplore() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Top divider */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold tracking-widest uppercase block mb-3">
            Why CelebrityPersona
          </span>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-neutral-400 text-base md:text-lg max-w-xl mx-auto">
            We go beyond basic bios. Our profiles give you a full, rich picture of the stars
            you love.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: '#1c1c1e',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              {/* Emoji */}
              <div className="text-4xl mb-4">{feat.emoji}</div>

              {/* Title */}
              <h3
                className="font-playfair text-xl font-bold mb-2"
                style={{ color: feat.accent }}
              >
                {feat.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-400 text-sm leading-relaxed">{feat.description}</p>

              {/* Hover accent corner */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${feat.accent}20 0%, transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div
          className="mt-16 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(251,191,36,0.08) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 text-center md:text-left">
            <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2">
              Ready to Explore?
            </h3>
            <p className="text-neutral-400 text-base">
              Browse thousands of celebrity profiles updated daily.
            </p>
          </div>

          <div className="relative z-10 flex gap-3 flex-wrap justify-center">
            <Link
              href="/celebrity-profiles"
              className="px-7 py-3.5 rounded-full font-semibold text-sm text-black transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ background: '#fbbf24' }}
            >
              Browse All Celebrities
            </Link>
            <Link
              href="/fashion-gallery"
              className="px-7 py-3.5 rounded-full font-semibold text-sm text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
            >
              Fashion Gallery →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
