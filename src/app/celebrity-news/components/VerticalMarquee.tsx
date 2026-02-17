"use client";

import AppImage from '@/components/ui/AppImage';
import Link from 'next/link';

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

interface VerticalMarqueeProps {
  articles: NewsArticle[];
}

export default function VerticalMarquee({ articles }: VerticalMarqueeProps) {
  return (
    <div className="hidden lg:block relative h-[800px] overflow-hidden rounded-2xl glass-card">
      <div className="animate-marquee-up space-y-6 p-6">
        {[...articles, ...articles].map((item, index) => (
          <Link key={`${item.id}_${index}`} href={`/celebrity-news/${item.id}`}>
            <div className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <AppImage
                    src={item.thumbnail}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                  />
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
          </Link>
        ))}
      </div>
    </div>
  );
}