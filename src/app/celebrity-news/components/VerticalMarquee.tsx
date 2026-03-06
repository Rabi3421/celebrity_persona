"use client";

import AppImage from '@/components/ui/AppImage';
import Link from 'next/link';
import type { NewsArticleDB } from './CelebrityNewsInteractive';

interface VerticalMarqueeProps {
  articles: NewsArticleDB[];
  loading?: boolean;
}

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

export default function VerticalMarquee({ articles, loading }: VerticalMarqueeProps) {
  if (loading) {
    return (
      <div className="hidden lg:block relative h-[800px] overflow-hidden rounded-2xl glass-card animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 m-4 glass-card rounded-xl">
            <div className="w-20 h-20 rounded-lg bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2.5 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-2.5 bg-white/10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles.length) return null;

  const href = (a: NewsArticleDB) => `/celebrity-news/${a.slug || a._id}`;

  return (
    <div className="hidden lg:block relative h-[800px] overflow-hidden rounded-2xl glass-card">
      <div className="animate-marquee-up space-y-6 p-6">
        {[...articles, ...articles].map((item, index) => (
          <Link key={`${item._id}_${index}`} href={href(item)}>
            <div className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                  {item.thumbnail ? (
                    <AppImage
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-purple-500/10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.category && (
                    <span className="text-[10px] font-montserrat uppercase tracking-wider text-neutral-500 mb-1 block">
                      {item.category}
                    </span>
                  )}
                  <h4 className="font-playfair text-sm font-semibold text-white mb-2 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>{formatDate(item.publishDate || item.createdAt)}</span>
                    {item.author && <><span>•</span><span>{item.author}</span></>}
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