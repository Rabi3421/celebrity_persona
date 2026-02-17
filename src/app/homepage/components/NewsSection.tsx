"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface NewsArticle {
  id: string;
  headline: string;
  celebrity: string;
  date: string;
  readTime: string;
  thumbnail: string;
  alt: string;
  category: string;
}

export default function NewsSection() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const featuredArticle: NewsArticle = {
    id: 'news_featured',
    headline: 'Zendaya Makes History at the Oscars 2026',
    celebrity: 'Zendaya',
    date: 'Feb 9, 2026',
    readTime: '5 min read',
    thumbnail: "https://images.unsplash.com/photo-1704087443363-53b5338c937c",
    alt: 'Glamorous awards ceremony with red carpet and golden stage lights',
    category: 'AWARDS'
  };

  const newsItems: NewsArticle[] = [
  {
    id: 'news_1',
    headline: 'Emma Watson Launches Sustainable Fashion Line',
    celebrity: 'Emma Watson',
    date: 'Feb 8, 2026',
    readTime: '3 min read',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1107d2191-1766599828252.png",
    alt: 'Eco-friendly fashion display with natural fabrics and plants',
    category: 'FASHION'
  },
  {
    id: 'news_2',
    headline: 'Tom Holland Confirms Spider-Man 4 Production',
    celebrity: 'Tom Holland',
    date: 'Feb 7, 2026',
    readTime: '4 min read',
    thumbnail: "https://images.unsplash.com/photo-1704580097493-5defcc86ea07",
    alt: 'Movie production set with cameras and dramatic lighting',
    category: 'MOVIES'
  },
  {
    id: 'news_3',
    headline: 'Margot Robbie to Star in New Tarantino Film',
    celebrity: 'Margot Robbie',
    date: 'Feb 6, 2026',
    readTime: '3 min read',
    thumbnail: "https://images.unsplash.com/photo-1654457268317-e1584c394417",
    alt: 'Vintage cinema film reels and movie projector',
    category: 'MOVIES'
  },
  {
    id: 'news_4',
    headline: 'Chris Hemsworth Reveals Fitness Routine',
    celebrity: 'Chris Hemsworth',
    date: 'Feb 5, 2026',
    readTime: '6 min read',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_113754fcf-1769698868562.png",
    alt: 'Modern gym with workout equipment and fitness gear',
    category: 'LIFESTYLE'
  },
  {
    id: 'news_5',
    headline: 'Timothée Chalamet Wins Critics Choice Award',
    celebrity: 'Timothée Chalamet',
    date: 'Feb 4, 2026',
    readTime: '4 min read',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_10ea757d7-1764677057503.png",
    alt: 'Golden award trophy on elegant pedestal',
    category: 'AWARDS'
  }];


  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-montserrat text-xs uppercase tracking-wider text-accent mb-4 block">
            Latest Updates
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Celebrity News
          </h2>
          <p className="font-inter text-lg text-neutral-400 max-w-2xl mx-auto">
            Stay updated with the latest entertainment news and celebrity updates
          </p>
        </div>

        {/* Featured Article */}
        <div
          className="glass-card rounded-3xl overflow-hidden mb-12 hover:glow-emerald transition-all duration-500 cursor-pointer"
          style={{ opacity: isHydrated ? 1 : 0 }}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative aspect-[16/9] lg:aspect-auto">
              <AppImage
                src={featuredArticle.thumbnail}
                alt={featuredArticle.alt}
                className="w-full h-full object-cover" />
              
              <div className="absolute top-6 left-6">
                <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {featuredArticle.category}
                </span>
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-neutral-400">{featuredArticle.date}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <span className="text-sm text-neutral-400">{featuredArticle.readTime}</span>
              </div>
              <h3 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {featuredArticle.headline}
              </h3>
              <p className="text-base text-neutral-400 mb-6">
                {featuredArticle.celebrity} makes history with groundbreaking achievement at
                the prestigious ceremony.
              </p>
              <button className="flex items-center gap-2 text-accent hover:gap-4 transition-all">
                <span className="text-sm font-medium">Read Full Story</span>
                <Icon name="ArrowRightIcon" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* News Grid with Marquee */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vertical Marquee - Hidden on Mobile */}
          <div className="hidden lg:block relative h-[600px] overflow-hidden rounded-2xl glass-card">
            <div className="animate-marquee-up space-y-6 p-6">
              {[...newsItems, ...newsItems].map((item, index) =>
              <div
                key={`${item.id}_${index}`}
                className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer">
                
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <AppImage
                      src={item.thumbnail}
                      alt={item.alt}
                      className="w-full h-full object-cover" />
                    
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-montserrat uppercase tracking-wider text-neutral-500 mb-1 block">
                        {item.category}
                      </span>
                      <h4 className="font-playfair text-sm font-semibold text-white mb-2 line-clamp-2">
                        {item.headline}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Regular News Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsItems.slice(0, 4).map((item) =>
            <div
              key={item.id}
              className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer">
              
                <div className="relative aspect-video">
                  <AppImage
                  src={item.thumbnail}
                  alt={item.alt}
                  className="w-full h-full object-cover" />
                
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </div>
                  <h4 className="font-playfair text-lg font-semibold text-white mb-2 line-clamp-2">
                    {item.headline}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Icon name="UserIcon" size={14} className="text-neutral-500" />
                    <span className="text-sm text-neutral-400">{item.celebrity}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="glass-card px-8 py-4 rounded-full hover:glow-emerald transition-all">
            <span className="text-base font-medium text-white">View All News</span>
          </button>
        </div>
      </div>
    </section>);

}