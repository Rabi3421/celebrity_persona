"use client";

import { useEffect, useState } from 'react';
import AppImage from '@/components/ui/AppImage';

interface FloatingCard {
  id: string;
  type: 'celebrity' | 'fashion' | 'news' | 'movie';
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  position: string;
}

export default function HeroSection() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const floatingCards: FloatingCard[] = [
  {
    id: 'hero_card_1',
    type: 'celebrity',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4aad93b-1770398321397.png",
    alt: 'Young woman with long brown hair in elegant black dress',
    title: 'Emma Watson',
    subtitle: 'Latest: Fashion Week 2026',
    position: 'top-[15%] left-[10%]'
  },
  {
    id: 'hero_card_2',
    type: 'fashion',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_105afe58d-1768666763976.png",
    alt: 'Elegant beige blazer with gold buttons and white shirt',
    title: 'Trending Outfit',
    subtitle: 'Shop the Look',
    position: 'top-[20%] right-[10%]'
  },
  {
    id: 'hero_card_3',
    type: 'news',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_173546b70-1770609263557.png",
    alt: 'Entertainment event with red carpet and spotlights',
    title: 'Breaking News',
    subtitle: 'Oscars 2026 Nominations',
    position: 'bottom-[20%] left-[12%]'
  },
  {
    id: 'hero_card_4',
    type: 'movie',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d7ea8e06-1766296438771.png",
    alt: 'Cinematic movie poster with dramatic lighting and city skyline',
    title: 'Upcoming Movie',
    subtitle: 'Releases March 2026',
    position: 'bottom-[15%] right-[16%]'
  }];


  const getGlowClass = (type: string) => {
    switch (type) {
      case 'celebrity':
        return 'glow-gold';
      case 'fashion':
        return 'glow-rose';
      case 'news':
        return 'glow-emerald';
      default:
        return '';
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 px-6">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8 animate-fade-in-blur">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-sm font-medium text-neutral-300">
            Trending Celebrity Fashion
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-playfair text-6xl md:text-8xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
          Discover
          <br />
          <span className="text-gradient-gold">Celebrity Style</span>
        </h1>

        {/* Subheadline */}
        <p className="font-inter text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200">
          Fashion, Profiles, Movies & More - Your one-stop destination for celebrity-inspired style
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <button className="glass-card px-8 py-4 rounded-full hover:glow-gold transition-all group">
            <span className="text-base font-medium text-white">Explore Now</span>
          </button>
          <button className="glass-card px-8 py-4 rounded-full border-2 border-white/20 hover:border-primary/50 transition-all">
            <span className="text-base font-medium text-neutral-300">View Profiles</span>
          </button>
        </div>
      </div>

      {/* Floating Cards - Hidden on Mobile */}
      <div className="hidden lg:block">
        {floatingCards.map((card, index) =>
        <div
          key={card.id}
          className={`absolute ${card.position} w-64 glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-500 ${getGlowClass(
            card.type
          )} animate-float`}
          style={{
            animationDelay: `${index * 0.5}s`,
            opacity: isHydrated ? 1 : 0
          }}>
          
            <div className="relative aspect-[4/5]">
              <AppImage
              src={card.image}
              alt={card.alt}
              className="w-full h-full object-cover" />
            
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="font-playfair text-lg font-semibold text-white mb-1">
                {card.title}
              </h3>
              <p className="text-sm text-neutral-400">{card.subtitle}</p>
            </div>
          </div>
        )}
      </div>
    </section>);

}