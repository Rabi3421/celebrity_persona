"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface FashionOutfit {
  id: string;
  celebrityName: string;
  occasion: string;
  priceRange: string;
  image: string;
  alt: string;
  views: string;
  similarItemsCount: number;
}

export default function FashionBentoGrid() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const outfits: FashionOutfit[] = [
  {
    id: 'outfit_1',
    celebrityName: 'Emma Watson',
    occasion: 'RED CARPET',
    priceRange: '$$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_105afe58d-1768666763976.png",
    alt: 'Elegant beige blazer with gold buttons over white silk shirt',
    views: '12.4K',
    similarItemsCount: 8
  },
  {
    id: 'outfit_2',
    celebrityName: 'Zendaya',
    occasion: 'AIRPORT',
    priceRange: '$$',
    image: "https://images.unsplash.com/photo-1545333756-bf0d13df146e",
    alt: 'Casual denim jacket with white t-shirt and black jeans',
    views: '8.2K',
    similarItemsCount: 12
  },
  {
    id: 'outfit_3',
    celebrityName: 'Margot Robbie',
    occasion: 'PARTY',
    priceRange: '$$$',
    image: "https://images.unsplash.com/photo-1700064817900-6c16021b304e",
    alt: 'Glamorous pink satin dress with silver heels',
    views: '15.8K',
    similarItemsCount: 6
  },
  {
    id: 'outfit_4',
    celebrityName: 'Chris Hemsworth',
    occasion: 'CASUAL',
    priceRange: '$',
    image: "https://images.unsplash.com/photo-1611785208554-300be9ca2eea",
    alt: 'Relaxed gray hoodie with dark blue jeans and white sneakers',
    views: '6.5K',
    similarItemsCount: 15
  },
  {
    id: 'outfit_5',
    celebrityName: 'Scarlett Johansson',
    occasion: 'RED CARPET',
    priceRange: '$$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_149794400-1765050044265.png",
    alt: 'Stunning black evening gown with sequin detailing',
    views: '18.3K',
    similarItemsCount: 5
  },
  {
    id: 'outfit_6',
    celebrityName: 'Tom Holland',
    occasion: 'AIRPORT',
    priceRange: '$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1308d5eaf-1770609261808.png",
    alt: 'Sporty bomber jacket with navy joggers and running shoes',
    views: '9.7K',
    similarItemsCount: 10
  },
  {
    id: 'outfit_7',
    celebrityName: 'Ryan Reynolds',
    occasion: 'CASUAL',
    priceRange: '$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_145c0c654-1767637889808.png",
    alt: 'Classic navy suit with white dress shirt and brown leather shoes', views: '11.2K',
    similarItemsCount: 9
  },
  {
    id: 'outfit_8',
    celebrityName: 'Timothée Chalamet',
    occasion: 'PARTY',
    priceRange: '$$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_116e4fac8-1767445180508.png",
    alt: 'Stylish burgundy velvet blazer with black turtleneck',
    views: '14.6K',
    similarItemsCount: 7
  },
  {
    id: 'outfit_9',
    celebrityName: 'Emma Watson',
    occasion: 'CASUAL',
    priceRange: '$',
    image: "https://images.unsplash.com/photo-1594750863984-8be99377ce41",
    alt: 'Comfortable beige sweater with light blue jeans and canvas shoes',
    views: '7.9K',
    similarItemsCount: 14
  },
  {
    id: 'outfit_10',
    celebrityName: 'Zendaya',
    occasion: 'RED CARPET',
    priceRange: '$$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d27cd415-1765586725547.png",
    alt: 'Breathtaking emerald green gown with crystal embellishments',
    views: '22.1K',
    similarItemsCount: 4
  },
  {
    id: 'outfit_11',
    celebrityName: 'Chris Hemsworth',
    occasion: 'PARTY',
    priceRange: '$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_15c9f5e64-1767785425456.png",
    alt: 'Smart black blazer with gray trousers and leather loafers',
    views: '10.3K',
    similarItemsCount: 11
  },
  {
    id: 'outfit_12',
    celebrityName: 'Margot Robbie',
    occasion: 'AIRPORT',
    priceRange: '$$',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1377e8a3d-1770609260633.png",
    alt: 'Chic cream trench coat with black leggings and ankle boots',
    views: '13.5K',
    similarItemsCount: 8
  }];


  const getOccasionColor = (occasion: string) => {
    switch (occasion) {
      case 'RED CARPET':
        return 'bg-secondary/20 text-secondary border-secondary/30';
      case 'AIRPORT':
        return 'bg-neutral-800/50 text-neutral-300 border-neutral-700';
      case 'CASUAL':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'PARTY':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-neutral-800/50 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-montserrat text-xs uppercase tracking-wider text-secondary mb-4 block">
            Fashion Gallery
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Trending Outfits
          </h2>
          <p className="font-inter text-lg text-neutral-400 max-w-2xl mx-auto">
            Shop celebrity-inspired looks with direct buying links
          </p>
        </div>

        {/* Bento Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]"
          style={{ opacity: isHydrated ? 1 : 0 }}>
          
          {outfits.map((outfit, index) => {
            const isLarge = index % 7 === 0 || index % 7 === 4;
            const isMedium = index % 7 === 2 || index % 7 === 5;

            return (
              <div
                key={outfit.id}
                className={`group relative glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-rose transition-all duration-500 cursor-pointer ${
                isLarge ? 'md:col-span-2 md:row-span-2' : isMedium ? 'md:row-span-2' : ''}`
                }>
                
                <div className="relative w-full h-full">
                  <AppImage
                    src={outfit.image}
                    alt={outfit.alt}
                    className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Occasion Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border ${getOccasionColor(
                        outfit.occasion
                      )}`}>
                      
                      {outfit.occasion}
                    </span>
                  </div>

                  {/* Price Range Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="glass-card px-3 py-1.5 rounded-full text-xs font-medium text-white">
                      {outfit.priceRange}
                    </span>
                  </div>

                  {/* Overlay Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <h3 className="font-playfair text-xl font-bold text-white mb-2">
                      {outfit.celebrityName}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="EyeIcon" size={16} className="text-neutral-400" />
                        <span className="text-sm text-neutral-400">{outfit.views}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="ShoppingBagIcon" size={16} className="text-secondary" />
                        <span className="text-sm text-neutral-400">
                          {outfit.similarItemsCount} items
                        </span>
                      </div>
                    </div>
                    <button className="w-full glass-card px-4 py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-white">View Details</span>
                      <Icon name="ArrowRightIcon" size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>);

          })}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <button className="glass-card px-8 py-4 rounded-full hover:glow-rose transition-all">
            <span className="text-base font-medium text-white">Load More Outfits</span>
          </button>
        </div>
      </div>
    </section>);

}