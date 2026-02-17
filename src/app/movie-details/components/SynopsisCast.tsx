"use client";

import AppImage from '@/components/ui/AppImage';

interface SynopsisCastProps {
  synopsis: string;
  cast: Array<{
    id: string;
    name: string;
    character: string;
    image: string;
    imageAlt: string;
  }>;
}

export default function SynopsisCast({ synopsis, cast }: SynopsisCastProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Synopsis */}
      <div className="lg:col-span-2 glass-card p-8 rounded-3xl animate-fade-in-up">
        <h2 className="font-playfair text-3xl font-bold text-gradient-gold mb-6">
          Synopsis
        </h2>
        <p className="text-neutral-300 leading-relaxed text-lg">{synopsis}</p>
      </div>

      {/* Cast */}
      <div className="glass-card p-8 rounded-3xl animate-fade-in-up delay-200">
        <h2 className="font-playfair text-3xl font-bold text-gradient-rose mb-6">
          Cast
        </h2>
        <div className="space-y-4">
          {cast?.map((actor) => (
            <div
              key={actor.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <AppImage
                src={actor.image}
                alt={actor.imageAlt}
                width={60}
                height={60}
                className="rounded-full w-[60px] h-[60px] object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-medium">{actor.name}</h3>
                <p className="text-neutral-400 text-sm">{actor.character}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}