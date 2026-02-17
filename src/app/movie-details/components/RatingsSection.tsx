"use client";

import Icon from '@/components/ui/AppIcon';

interface RatingsSectionProps {
  ratings: {
    imdb: { score: number; votes: string };
    rottenTomatoes: { critics: number; audience: number };
    aggregated: number;
  };
}

export default function RatingsSection({ ratings }: RatingsSectionProps) {
  return (
    <div className="glass-card p-8 rounded-3xl animate-fade-in-up">
      <h2 className="font-playfair text-3xl font-bold text-white mb-8">
        Ratings & Reviews
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IMDb Rating */}
        <div className="glass-card p-6 rounded-2xl hover:glow-gold transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon name="StarIcon" variant="solid" size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">IMDb</h3>
              <p className="text-neutral-400 text-xs">{ratings.imdb.votes} votes</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gradient-gold">
              {ratings.imdb.score}
            </span>
            <span className="text-neutral-400 text-xl">/10</span>
          </div>
        </div>

        {/* Rotten Tomatoes */}
        <div className="glass-card p-6 rounded-2xl hover:glow-rose transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Icon name="FireIcon" variant="solid" size={24} className="text-secondary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Rotten Tomatoes</h3>
              <p className="text-neutral-400 text-xs">Critics & Audience</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-sm">Critics</span>
              <span className="text-2xl font-bold text-gradient-rose">
                {ratings.rottenTomatoes.critics}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-sm">Audience</span>
              <span className="text-2xl font-bold text-gradient-rose">
                {ratings.rottenTomatoes.audience}%
              </span>
            </div>
          </div>
        </div>

        {/* Aggregated Score */}
        <div className="glass-card p-6 rounded-2xl hover:glow-emerald transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Icon name="ChartBarIcon" variant="solid" size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Aggregated Score</h3>
              <p className="text-neutral-400 text-xs">All sources combined</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-accent">
              {ratings.aggregated}
            </span>
            <span className="text-neutral-400 text-xl">/100</span>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all"
              style={{ width: `${ratings.aggregated}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}