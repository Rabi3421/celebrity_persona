"use client";

import Icon from '@/components/ui/AppIcon';
import type { OutfitDoc } from './FashionGalleryInteractive';

function celebName(c: OutfitDoc['celebrity']): string {
  if (!c) return 'Unknown';
  if (typeof c === 'string') return c;
  return c.name || 'Celebrity';
}

const OCCASION_COLORS: Record<string, string> = {
  'RED CARPET': 'bg-secondary/20 text-secondary border-secondary/30',
  AIRPORT:      'bg-neutral-800/50 text-neutral-300 border-neutral-700',
  CASUAL:       'bg-accent/20 text-accent border-accent/30',
  PARTY:        'bg-primary/20 text-primary border-primary/30',
};
const occasionColor = (s?: string) =>
  OCCASION_COLORS[(s || '').toUpperCase()] || 'bg-neutral-800/50 text-neutral-300 border-neutral-700';

interface Props {
  outfits: OutfitDoc[];
  loading: boolean;
}

export default function OutfitGallery({ outfits, loading }: Props) {
  const SKELETON_COUNT = 12;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => {
          const isLarge  = i % 7 === 0 || i % 7 === 4;
          const isMedium = i % 7 === 2 || i % 7 === 5;
          return (
            <div key={i}
              className={`rounded-2xl bg-white/5 animate-pulse ${
                isLarge ? 'md:col-span-2 md:row-span-2' : isMedium ? 'md:row-span-2' : ''
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
      {outfits.map((outfit, index) => {
        const isLarge  = index % 7 === 0 || index % 7 === 4;
        const isMedium = index % 7 === 2 || index % 7 === 5;
        const img      = outfit.images?.[0] || '';
        const label    = outfit.event ? outfit.event.toUpperCase() : outfit.category?.toUpperCase() || 'OUTFIT';

        return (
          <div key={outfit.id}
            className={`group relative glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-rose transition-all duration-500 cursor-pointer ${
              isLarge ? 'md:col-span-2 md:row-span-2' : isMedium ? 'md:row-span-2' : ''
            }`}
          >
            <div className="relative w-full h-full">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={outfit.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Icon name="PhotoIcon" size={40} className="text-neutral-700" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Occasion badge */}
              <div className="absolute top-4 left-4">
                <span className={`font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border ${occasionColor(outfit.event || outfit.category)}`}>
                  {label}
                </span>
              </div>

              {/* Price badge */}
              {outfit.price && (
                <div className="absolute top-4 right-4">
                  <span className="glass-card px-3 py-1.5 rounded-full text-xs font-medium text-white">
                    {outfit.price}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <h3 className="font-playfair text-xl font-bold text-white mb-1">
                  {celebName(outfit.celebrity)}
                </h3>
                <p className="text-neutral-300 text-sm font-montserrat mb-3 line-clamp-1">{outfit.title}</p>
                <div className="flex items-center justify-between mb-4">
                  {outfit.brand && (
                    <span className="text-xs text-neutral-400 font-montserrat">{outfit.brand}</span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Icon name="HeartIcon" size={14} className="text-secondary" />
                    <span className="text-xs text-neutral-400">{outfit.likesCount ?? 0}</span>
                  </div>
                </div>
                {outfit.purchaseLink ? (
                  <a href={outfit.purchaseLink} target="_blank" rel="noopener noreferrer"
                    className="w-full glass-card px-4 py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Icon name="ShoppingBagIcon" size={14} className="text-secondary" />
                    <span className="text-sm font-medium text-white">Shop Look</span>
                    <Icon name="ArrowRightIcon" size={14} className="text-white" />
                  </a>
                ) : (
                  <button className="w-full glass-card px-4 py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-white">View Details</span>
                    <Icon name="ArrowRightIcon" size={14} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

