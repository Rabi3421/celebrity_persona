"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import VerticalMarquee from './VerticalMarquee';

interface NewsArticle {
  id: string;
  headline: string;
  celebrity: string;
  date: string;
  readTime: string;
  thumbnail: string;
  alt: string;
  category: string;
  excerpt: string;
}

export default function CelebrityNewsInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const featuredArticle: NewsArticle = {
    id: 'news_featured_001',
    headline: 'Zendaya Makes History at the Oscars 2026',
    celebrity: 'Zendaya',
    date: 'Feb 9, 2026',
    readTime: '5 min read',
    thumbnail: 'https://images.unsplash.com/photo-1704087443363-53b5338c937c',
    alt: 'Glamorous awards ceremony with red carpet and golden stage lights',
    category: 'AWARDS',
    excerpt: 'Zendaya makes history with groundbreaking achievement at the prestigious ceremony, becoming the youngest actress to win multiple Academy Awards.'
  };

  const trendingNews: NewsArticle[] = [
  {
    id: 'news_001',
    headline: 'Emma Watson Launches Sustainable Fashion Line',
    celebrity: 'Emma Watson',
    date: 'Feb 8, 2026',
    readTime: '3 min read',
    thumbnail: 'https://img.rocket.new/generatedImages/rocket_gen_img_1107d2191-1766599828252.png',
    alt: 'Eco-friendly fashion display with natural fabrics and plants',
    category: 'FASHION',
    excerpt: 'Emma Watson unveils her eco-conscious fashion brand with a focus on sustainable materials and ethical production.'
  },
  {
    id: 'news_002',
    headline: 'Tom Holland Confirms Spider-Man 4 Production',
    celebrity: 'Tom Holland',
    date: 'Feb 7, 2026',
    readTime: '4 min read',
    thumbnail: 'https://images.unsplash.com/photo-1704580097493-5defcc86ea07',
    alt: 'Movie production set with cameras and dramatic lighting',
    category: 'MOVIES',
    excerpt: 'Tom Holland officially announces the production start date for the highly anticipated Spider-Man 4.'
  },
  {
    id: 'news_003',
    headline: 'Margot Robbie to Star in New Tarantino Film',
    celebrity: 'Margot Robbie',
    date: 'Feb 6, 2026',
    readTime: '3 min read',
    thumbnail: 'https://images.unsplash.com/photo-1654457268317-e1584c394417',
    alt: 'Vintage cinema film reels and movie projector',
    category: 'MOVIES',
    excerpt: 'Margot Robbie joins Quentin Tarantino\'s latest project, marking their second collaboration after Once Upon a Time in Hollywood.'
  },
  {
    id: 'news_004',
    headline: 'Chris Hemsworth Reveals Fitness Routine',
    celebrity: 'Chris Hemsworth',
    date: 'Feb 5, 2026',
    readTime: '6 min read',
    thumbnail: 'https://img.rocket.new/generatedImages/rocket_gen_img_113754fcf-1769698868562.png',
    alt: 'Modern gym with workout equipment and fitness gear',
    category: 'LIFESTYLE',
    excerpt: 'Chris Hemsworth shares his intense workout regimen and nutrition plan that keeps him in superhero shape.'
  },
  {
    id: 'news_005',
    headline: 'Timothée Chalamet Wins Critics Choice Award',
    celebrity: 'Timothée Chalamet',
    date: 'Feb 4, 2026',
    readTime: '4 min read',
    thumbnail: 'https://img.rocket.new/generatedImages/rocket_gen_img_10ea757d7-1764677057503.png',
    alt: 'Golden award trophy on elegant pedestal',
    category: 'AWARDS',
    excerpt: 'Timothée Chalamet takes home the Critics Choice Award for Best Actor in a Leading Role.'
  },
  {
    id: 'news_006',
    headline: 'Florence Pugh Signs Multi-Picture Deal',
    celebrity: 'Florence Pugh',
    date: 'Feb 3, 2026',
    readTime: '3 min read',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_194fe437c-1770609946314.png",
    alt: 'Movie contract signing with elegant pen',
    category: 'MOVIES',
    excerpt: 'Florence Pugh inks major deal with A24 Studios for three upcoming feature films.'
  },
  {
    id: 'news_007',
    headline: 'Ryan Gosling Launches Music Album',
    celebrity: 'Ryan Gosling',
    date: 'Feb 2, 2026',
    readTime: '5 min read',
    thumbnail: "https://images.unsplash.com/photo-1698235301688-6b5b79dac3d5",
    alt: 'Recording studio with microphone and sound equipment',
    category: 'MUSIC',
    excerpt: 'Ryan Gosling surprises fans with debut solo album featuring original compositions and collaborations.'
  },
  {
    id: 'news_008',
    headline: 'Anya Taylor-Joy Joins Broadway Production',
    celebrity: 'Anya Taylor-Joy',
    date: 'Feb 1, 2026',
    readTime: '4 min read',
    thumbnail: "https://images.unsplash.com/photo-1653314974264-a874db066653",
    alt: 'Broadway theater stage with dramatic lighting',
    category: 'THEATER',
    excerpt: 'Anya Taylor-Joy makes her Broadway debut in a revival of a classic Tennessee Williams play.'
  }];


  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-montserrat text-xs uppercase tracking-wider text-accent mb-4 block">
            Latest Updates
          </span>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-4">
            Celebrity News
          </h1>
          <p className="font-inter text-lg text-neutral-400 max-w-2xl mx-auto">
            Stay updated with the latest entertainment news and celebrity updates
          </p>
        </div>

        {/* Featured Article */}
        <Link href={`/celebrity-news/${featuredArticle.id}`}>
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
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  {featuredArticle.headline}
                </h2>
                <p className="text-base text-neutral-400 mb-6">
                  {featuredArticle.excerpt}
                </p>
                <div className="flex items-center gap-2 text-accent hover:gap-4 transition-all">
                  <span className="text-sm font-medium">Read Full Story</span>
                  <Icon name="ArrowRightIcon" size={16} />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Trending Headlines with Marquee */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vertical Marquee - Hidden on Mobile */}
          <VerticalMarquee articles={trendingNews} />

          {/* Trending News Grid */}
          <div className="lg:col-span-2">
            <h3 className="font-playfair text-2xl font-bold text-white mb-6">
              Trending Headlines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trendingNews.slice(0, 6).map((article) =>
              <Link key={article.id} href={`/celebrity-news/${article.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer">
                    <div className="relative aspect-video">
                      <AppImage
                      src={article.thumbnail}
                      alt={article.alt}
                      className="w-full h-full object-cover" />
                    
                      <div className="absolute top-4 left-4">
                        <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h4 className="font-playfair text-lg font-semibold text-white mb-2 line-clamp-2">
                        {article.headline}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Icon name="UserIcon" size={14} className="text-neutral-500" />
                        <span className="text-sm text-neutral-400">{article.celebrity}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}