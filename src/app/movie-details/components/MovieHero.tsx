"use client";

import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface MovieHeroProps {
  movie: {
    title: string;
    year: number;
    genre: string[];
    director: string;
    runtime: string;
    poster: string;
    posterAlt: string;
    backdrop: string;
    backdropAlt: string;
  };
}

export default function MovieHero({ movie }: MovieHeroProps) {
  return (
    <div className="relative">
      {/* Backdrop with Gradient Overlay */}
      <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden">
        <AppImage
          src={movie.backdrop}
          alt={movie.backdropAlt}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Movie Info Overlay */}
      <div className="relative -mt-32 px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="glass-card p-3 rounded-2xl glow-gold animate-fade-in-up">
            <AppImage
              src={movie.poster}
              alt={movie.posterAlt}
              width={280}
              height={420}
              className="rounded-xl w-[200px] md:w-[280px] h-auto"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-6 animate-fade-in-up delay-200">
            <div>
              <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-2">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-neutral-400">
                <span className="text-lg">{movie.year}</span>
                <span>•</span>
                <span>{movie.runtime}</span>
                <span>•</span>
                <span className="text-primary">{movie.genre.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-neutral-300">
              <Icon name="UserIcon" size={20} className="text-secondary" />
              <span className="text-sm">
                Directed by <span className="text-white font-medium">{movie.director}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="glass-card px-6 py-3 rounded-full hover:glow-gold transition-all flex items-center gap-2">
                <Icon name="PlayIcon" size={20} className="text-primary" />
                <span className="text-white font-medium">Watch Trailer</span>
              </button>
              <button className="glass-card px-6 py-3 rounded-full hover:glow-rose transition-all flex items-center gap-2">
                <Icon name="BookmarkIcon" size={20} className="text-secondary" />
                <span className="text-white font-medium">Add to Watchlist</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}