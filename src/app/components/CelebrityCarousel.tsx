"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Celebrity {
  id: string;
  name: string;
  profession: string;
  latestProject: string;
  instagramFollowers: string;
  image: string;
  alt: string;
}

export default function CelebrityCarousel() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const celebrities: Celebrity[] = [
  {
    id: 'celeb_1',
    name: 'Emma Watson',
    profession: 'Actress & Activist',
    latestProject: 'Fashion Week 2026',
    instagramFollowers: '62.4M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4aad93b-1770398321397.png",
    alt: 'Young woman with long brown hair in elegant black dress'
  },
  {
    id: 'celeb_2',
    name: 'Chris Hemsworth',
    profession: 'Actor',
    latestProject: 'Thor: Love and Thunder',
    instagramFollowers: '55.2M',
    image: "https://images.unsplash.com/photo-1616707808904-e012afa93dba",
    alt: 'Man with short brown hair in casual denim jacket'
  },
  {
    id: 'celeb_3',
    name: 'Zendaya',
    profession: 'Actress & Singer',
    latestProject: 'Dune: Part Two',
    instagramFollowers: '184M',
    image: "https://images.unsplash.com/photo-1608216874348-f0acf1cc149e",
    alt: 'Young woman with curly hair in stylish white top'
  },
  {
    id: 'celeb_4',
    name: 'Ryan Reynolds',
    profession: 'Actor & Producer',
    latestProject: 'Deadpool 3',
    instagramFollowers: '47.8M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1cfb5fe8d-1763294577039.png",
    alt: 'Man with short hair in gray suit jacket'
  },
  {
    id: 'celeb_5',
    name: 'Margot Robbie',
    profession: 'Actress & Producer',
    latestProject: 'Barbie Movie',
    instagramFollowers: '28.5M',
    image: "https://images.unsplash.com/photo-1620154417713-aa0fa0ce78f2",
    alt: 'Young woman with blonde hair in elegant pink dress'
  },
  {
    id: 'celeb_6',
    name: 'Tom Holland',
    profession: 'Actor',
    latestProject: 'Spider-Man: Beyond',
    instagramFollowers: '67.3M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_149216793-1763296002470.png",
    alt: 'Young man with short brown hair in casual navy shirt'
  },
  {
    id: 'celeb_7',
    name: 'Scarlett Johansson',
    profession: 'Actress',
    latestProject: 'Black Widow Returns',
    instagramFollowers: '0', // Private account
    image: "https://images.unsplash.com/photo-1696575813317-201d93f3576a",
    alt: 'Young woman with red hair in elegant black dress'
  },
  {
    id: 'celeb_8',
    name: 'Timothée Chalamet',
    profession: 'Actor',
    latestProject: 'Wonka',
    instagramFollowers: '18.9M',
    image: "https://images.unsplash.com/photo-1650407121929-3f0ac60727da",
    alt: 'Young man with curly hair in stylish brown jacket'
  }];


  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(celebrities.length / 3));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
    prev === 0 ? Math.ceil(celebrities.length / 3) - 1 : prev - 1
    );
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="font-montserrat text-xs uppercase tracking-wider text-primary mb-2 block">
              Featured
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              Celebrity Spotlight
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="glass-card p-3 rounded-full hover:glow-gold transition-all">
              
              <Icon name="ChevronLeftIcon" size={20} className="text-white" />
            </button>
            <button
              onClick={handleNext}
              className="glass-card p-3 rounded-full hover:glow-gold transition-all">
              
              <Icon name="ChevronRightIcon" size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              opacity: isHydrated ? 1 : 0
            }}>
            
            {celebrities.map((celebrity) =>
            <div
              key={celebrity.id}
              className="min-w-full md:min-w-[calc(33.333%-16px)] glass-card rounded-2xl overflow-hidden hover:scale-105 hover:glow-gold transition-all duration-500 cursor-pointer">
              
                <div className="relative aspect-[4/5]">
                  <AppImage
                  src={celebrity.image}
                  alt={celebrity.alt}
                  className="w-full h-full object-cover" />
                
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-playfair text-2xl font-bold text-white mb-1">
                      {celebrity.name}
                    </h3>
                    <p className="text-sm text-neutral-300 mb-3">
                      {celebrity.profession}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FilmIcon" size={16} className="text-primary" />
                        <span className="text-xs text-neutral-400">
                          {celebrity.latestProject}
                        </span>
                      </div>
                      {celebrity.instagramFollowers !== '0' &&
                    <div className="flex items-center gap-1">
                          <Icon name="UserGroupIcon" size={16} className="text-primary" />
                          <span className="text-xs text-neutral-400">
                            {celebrity.instagramFollowers}
                          </span>
                        </div>
                    }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handlePrev}
            className="glass-card p-3 rounded-full hover:glow-gold transition-all">
            
            <Icon name="ChevronLeftIcon" size={20} className="text-white" />
          </button>
          <button
            onClick={handleNext}
            className="glass-card p-3 rounded-full hover:glow-gold transition-all">
            
            <Icon name="ChevronRightIcon" size={20} className="text-white" />
          </button>
        </div>
      </div>
    </section>);

}