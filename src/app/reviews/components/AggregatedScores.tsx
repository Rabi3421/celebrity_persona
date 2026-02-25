"use client";

import Icon from '@/components/ui/AppIcon';

interface AggregatedScoresProps {
  totalReviews: number;
  avgRating: number;
  avgImdb: number;
  avgCritics: number;
  avgAudience: number;
  loading?: boolean;
}

function Skeleton({ w = 'w-20', h = 'h-8' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded-lg bg-white/5 animate-pulse`} />;
}

function StatCard({
  icon, iconBg, iconColor, title, subtitle, children, loading,
}: {
  icon: string; iconBg: string; iconColor: string;
  title: string; subtitle: string;
  children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-yellow-500/[0.04] to-transparent" />
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon name={icon} variant="solid" size={20} className={iconColor} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm font-montserrat">{title}</p>
          <p className="text-neutral-500 text-xs font-montserrat">{subtitle}</p>
        </div>
      </div>
      {loading ? <Skeleton w="w-28" h="h-9" /> : children}
    </div>
  );
}

export default function AggregatedScores({
  totalReviews, avgRating, avgImdb, avgCritics, avgAudience, loading,
}: AggregatedScoresProps) {
  const fmt1   = (n: number) => n ? n.toFixed(1) : '–';
  const fmtPct = (n: number) => n ? `${Math.round(n)}%` : '–';
  const ratingPct = avgRating ? (avgRating / 10) * 100 : 0;

  return (
    <div className="mb-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard icon="StarIcon" iconBg="bg-yellow-500/15" iconColor="text-yellow-400"
          title="Our Rating" subtitle={`${totalReviews} reviews`} loading={loading}>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-4xl font-bold font-playfair text-yellow-400">{fmt1(avgRating)}</span>
            <span className="text-neutral-500 text-base font-montserrat">/10</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-700"
              style={{ width: `${ratingPct}%` }} />
          </div>
        </StatCard>

        <StatCard icon="FilmIcon" iconBg="bg-amber-500/15" iconColor="text-amber-400"
          title="Avg IMDb" subtitle="From review data" loading={loading}>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold font-playfair text-amber-400">{fmt1(avgImdb)}</span>
            <span className="text-neutral-500 text-base font-montserrat">/10</span>
          </div>
        </StatCard>

        <StatCard icon="FireIcon" iconBg="bg-rose-500/15" iconColor="text-rose-400"
          title="Critics / Audience" subtitle="Aggregated scores" loading={loading}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-montserrat">Critics</span>
              <span className="text-2xl font-bold font-playfair text-rose-400">{fmtPct(avgCritics)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-montserrat">Audience</span>
              <span className="text-2xl font-bold font-playfair text-rose-300">{fmtPct(avgAudience)}</span>
            </div>
          </div>
        </StatCard>

        <StatCard icon="DocumentTextIcon" iconBg="bg-violet-500/15" iconColor="text-violet-400"
          title="Total Reviews" subtitle="In our database" loading={loading}>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold font-playfair text-white">
              {loading ? '–' : totalReviews.toLocaleString()}
            </span>
          </div>
          <p className="text-neutral-600 text-xs font-montserrat mt-1">reviews published</p>
        </StatCard>

      </div>
    </div>
  );
}
