"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface OutfitItem {
  type: string;
  brand: string;
  price: string;
  buyingUrl: string;
}

export default function FeaturedOutfit() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const featuredOutfit = {
    celebrityName: 'Zendaya',
    occasion: 'RED CARPET',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d27cd415-1765586725547.png",
    alt: 'Breathtaking emerald green gown with crystal embellishments',
    totalPrice: '$12,450',
    items: [
    { type: 'Gown', brand: 'Valentino', price: '$8,900', buyingUrl: '#' },
    { type: 'Heels', brand: 'Jimmy Choo', price: '$1,250', buyingUrl: '#' },
    { type: 'Earrings', brand: 'Cartier', price: '$1,800', buyingUrl: '#' },
    { type: 'Clutch', brand: 'Bottega Veneta', price: '$500', buyingUrl: '#' }]

  };

  return (
    <section className="py-24 px-6" style={{ opacity: isHydrated ? 1 : 0 }}>
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

        {/* Featured Outfit Card */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Main Image */}
            <div className="lg:col-span-3 relative aspect-[3/4] lg:aspect-auto">
              <AppImage
                src={featuredOutfit.image}
                alt={featuredOutfit.alt}
                className="w-full h-full object-cover" />
              
              <div className="absolute top-6 left-6">
                <span className="bg-secondary/20 text-secondary border border-secondary/30 font-montserrat text-xs uppercase tracking-wider px-4 py-2 rounded-full">
                  {featuredOutfit.occasion}
                </span>
              </div>
            </div>

            {/* Outfit Breakdown */}
            <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <h3 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                  {featuredOutfit.celebrityName}
                </h3>
                <p className="text-lg text-neutral-400">
                  Oscars 2026 Red Carpet Look
                </p>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-4 mb-8">
                {featuredOutfit.items.map((item, index) =>
                <div
                  key={`item_${index}`}
                  className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all">
                  
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{item.type}</span>
                      <span className="text-primary font-semibold">{item.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">{item.brand}</span>
                      <a
                      href={item.buyingUrl}
                      className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors">
                      
                        <span>Shop Now</span>
                        <Icon name="ArrowRightIcon" size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Total & CTA */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {featuredOutfit.totalPrice}
                  </span>
                </div>
                <button className="w-full glass-card px-6 py-4 rounded-full bg-secondary hover:bg-secondary/90 transition-all flex items-center justify-center gap-2">
                  <Icon name="ShoppingBagIcon" size={20} className="text-black" />
                  <span className="text-base font-medium text-black">
                    Shop Complete Look
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}