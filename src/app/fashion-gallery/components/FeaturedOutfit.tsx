"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { OutfitDoc } from './FashionGalleryInteractive';

function celebName(c: OutfitDoc['celebrity']): string {
  if (!c) return 'Unknown Celebrity';
  if (typeof c === 'string') return c;
  return c.name || 'Celebrity';
}

interface Props { outfit: OutfitDoc; }

export default function FeaturedOutfit({ outfit }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = outfit.images?.filter(Boolean) || [];
  const img    = images[imgIdx] || '';

  const occasionLabel = outfit.event ? outfit.event.toUpperCase() : outfit.category?.toUpperCase() || 'FEATURED';

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-montserrat text-xs uppercase tracking-wider text-secondary mb-4 block">
            Featured This Week
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Outfit of the Week
          </h2>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

            {/* Main Image */}
            <div className="lg:col-span-3 relative aspect-[3/4] lg:aspect-auto min-h-[400px]">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={outfit.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Icon name="PhotoIcon" size={48} className="text-neutral-700" />
                </div>
              )}

              {/* Occasion badge */}
              <div className="absolute top-6 left-6">
                <span className="bg-secondary/20 text-secondary border border-secondary/30 font-montserrat text-xs uppercase tracking-wider px-4 py-2 rounded-full">
                  {occasionLabel}
                </span>
              </div>

              {/* Image thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIdx ? 'border-yellow-500' : 'border-white/20'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-1">
                  {celebName(outfit.celebrity)}
                </h3>
                <p className="text-lg text-neutral-400">{outfit.title}</p>
              </div>

              {/* Details grid */}
              <div className="space-y-3 mb-6">
                {outfit.designer && (
                  <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">Designer</span>
                      <p className="text-sm text-neutral-400 mt-0.5">{outfit.designer}</p>
                    </div>
                  </div>
                )}
                {outfit.brand && (
                  <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">Brand</span>
                      <p className="text-sm text-neutral-400 mt-0.5">{outfit.brand}</p>
                    </div>
                    {outfit.price && <span className="text-primary font-semibold">{outfit.price}</span>}
                  </div>
                )}
                {outfit.color && (
                  <div className="glass-card rounded-xl p-4">
                    <span className="font-medium text-white">Colour</span>
                    <p className="text-sm text-neutral-400 mt-0.5">{outfit.color}</p>
                  </div>
                )}
                {outfit.description && (
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-neutral-300 leading-relaxed line-clamp-4">{outfit.description}</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
                {outfit.price && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium text-white">Price</span>
                    <span className="text-2xl font-bold text-primary">{outfit.price}</span>
                  </div>
                )}
                {outfit.purchaseLink ? (
                  <a href={outfit.purchaseLink} target="_blank" rel="noopener noreferrer"
                    className="w-full glass-card px-6 py-4 rounded-full bg-secondary hover:bg-secondary/90 transition-all flex items-center justify-center gap-2">
                    <Icon name="ShoppingBagIcon" size={20} className="text-black" />
                    <span className="text-base font-medium text-black">Shop This Look</span>
                  </a>
                ) : (
                  <button className="w-full glass-card px-6 py-4 rounded-full bg-secondary/30 text-secondary/80 flex items-center justify-center gap-2 cursor-default">
                    <Icon name="ShoppingBagIcon" size={20} />
                    <span className="text-base font-medium">Shop This Look</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}