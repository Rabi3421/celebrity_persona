"use client";

import { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
  color: string;
}

const stats: StatItem[] = [
  {
    value: 500,
    suffix: '+',
    label: 'Celebrity Profiles',
    description: 'Detailed, verified profiles across every industry',
    color: '#fbbf24',
  },
  {
    value: 10,
    suffix: 'K+',
    label: 'Fashion Looks',
    description: 'Outfit breakdowns & style inspirations catalogued',
    color: '#f4a6b8',
  },
  {
    value: 50,
    suffix: 'K+',
    label: 'Monthly Readers',
    description: 'Celebrity fans visiting CelebrityPersona every month',
    color: '#34d399',
  },
  {
    value: 4,
    suffix: '',
    label: 'Categories',
    description: 'Movie, Fashion, Music & Sports all in one place',
    color: '#60a5fa',
  },
];

function useCountUp(target: number, duration = 1800, trigger: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
}

function StatCard({ stat, trigger }: { stat: StatItem; trigger: boolean }) {
  const count = useCountUp(stat.value, 1600, trigger);

  return (
    <div
      className="relative rounded-2xl p-7 flex flex-col gap-3 overflow-hidden"
      style={{
        background: '#1c1c1e',
        border: `1px solid ${stat.color}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${stat.color}15`,
      }}
    >
      {/* Background number watermark */}
      <span
        className="absolute -right-3 -top-3 text-8xl font-black select-none pointer-events-none opacity-[0.04]"
        style={{ color: stat.color, fontFamily: 'Playfair Display, serif' }}
      >
        {count}
      </span>

      {/* Accent dot */}
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: stat.color }}
      />

      {/* Count */}
      <div className="flex items-end gap-0.5">
        <span
          className="font-playfair text-5xl font-bold leading-none"
          style={{ color: stat.color }}
        >
          {count.toLocaleString()}
        </span>
        <span
          className="font-playfair text-3xl font-bold leading-none mb-1"
          style={{ color: stat.color }}
        >
          {stat.suffix}
        </span>
      </div>

      {/* Label */}
      <div>
        <p className="text-white font-semibold text-lg">{stat.label}</p>
        <p className="text-neutral-500 text-sm mt-0.5 leading-relaxed">{stat.description}</p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)` }}
      />
    </div>
  );
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(251,191,36,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold tracking-widest uppercase block mb-3">
            By the Numbers
          </span>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
            The World&apos;s Largest Celebrity Database
          </h2>
          <p className="text-neutral-400 text-base max-w-lg mx-auto">
            Continuously updated with new profiles, fashion looks and exclusive celebrity data.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} trigger={triggered} />
          ))}
        </div>
      </div>
    </section>
  );
}
