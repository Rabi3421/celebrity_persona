"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface ArticleData {
  id: string;
  headline: string;
  celebrity: string;
  date: string;
  readTime: string;
  thumbnail: string;
  alt: string;
  category: string;
  excerpt: string;
  content: string[];
  tags: string[];
  author: string;
  authorImage: string;
}

interface RelatedArticle {
  id: string;
  headline: string;
  thumbnail: string;
  alt: string;
  category: string;
}

interface ArticleDetailProps {
  articleId: string;
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Mock article data - in production, fetch based on articleId
  const article: ArticleData = {
    id: articleId,
    headline: 'Zendaya Makes History at the Oscars 2026',
    celebrity: 'Zendaya',
    date: 'Feb 9, 2026',
    readTime: '5 min read',
    thumbnail: 'https://images.unsplash.com/photo-1704087443363-53b5338c937c',
    alt: 'Glamorous awards ceremony with red carpet and golden stage lights',
    category: 'AWARDS',
    excerpt: 'Zendaya makes history with groundbreaking achievement at the prestigious ceremony, becoming the youngest actress to win multiple Academy Awards.',
    content: [
    'In a stunning turn of events at the 2026 Academy Awards, Zendaya has made history by becoming the youngest actress to win multiple Oscars. The 29-year-old star took home the Best Actress award for her powerful performance in "Echoes of Tomorrow," adding to her previous win for Best Supporting Actress.',
    'The emotional acceptance speech brought the audience to tears as Zendaya thanked her family, mentors, and fans who have supported her journey from Disney Channel star to Hollywood\'s most celebrated actress. "This is for every young person who dares to dream," she said, holding the golden statuette.',
    'Fashion critics are already calling her custom Valentino gown one of the most iconic red carpet moments in Oscar history. The champagne-colored silk creation featured intricate beadwork and a dramatic train that sparkled under the theater lights.',
    'Industry insiders predict this win will solidify Zendaya\'s position as one of the most influential actresses of her generation, with multiple studios already vying for her involvement in upcoming projects.',
    'The historic win comes after a year of critical acclaim for her performances across film and television, proving her versatility and dedication to her craft. As she continues to break barriers and set new standards, Zendaya\'s impact on Hollywood is undeniable.'],

    tags: ['Zendaya', 'Tom Holland', 'Timothée Chalamet', 'Florence Pugh'],
    author: 'Sarah Mitchell',
    authorImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1b60a5c86-1770609949340.png"
  };

  const relatedArticles: RelatedArticle[] = [
  {
    id: 'news_002',
    headline: 'Tom Holland Confirms Spider-Man 4 Production',
    thumbnail: 'https://images.unsplash.com/photo-1704580097493-5defcc86ea07',
    alt: 'Movie production set with cameras and dramatic lighting',
    category: 'MOVIES'
  },
  {
    id: 'news_005',
    headline: 'Timothée Chalamet Wins Critics Choice Award',
    thumbnail: 'https://img.rocket.new/generatedImages/rocket_gen_img_10ea757d7-1764677057503.png',
    alt: 'Golden award trophy on elegant pedestal',
    category: 'AWARDS'
  },
  {
    id: 'news_006',
    headline: 'Florence Pugh Signs Multi-Picture Deal',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_194fe437c-1770609946314.png",
    alt: 'Movie contract signing with elegant pen',
    category: 'MOVIES'
  }];


  return (
    <article className="py-12 px-6" style={{ opacity: isHydrated ? 1 : 0 }}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-8">
          <Link href="/celebrity-news" className="hover:text-accent transition-colors">
            Celebrity News
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <span className="text-white">{article.category}</span>
        </nav>

        {/* Article Header */}
        <div className="mb-8">
          <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4">
            {article.category}
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {article.headline}
          </h1>
          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <span>{article.date}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span>{article.readTime}</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
          <AppImage
            src={article.thumbnail}
            alt={article.alt}
            className="w-full h-full object-cover" />
          
        </div>

        {/* Author Info */}
        <div className="glass-card rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <AppImage
              src={article.authorImage}
              alt={`${article.author} profile photo`}
              className="w-full h-full object-cover" />
            
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-1">Written by</p>
            <p className="font-playfair text-lg font-semibold text-white">{article.author}</p>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-invert max-w-none mb-12">
          {article.content.map((paragraph, index) =>
          <p key={index} className="font-inter text-lg text-neutral-300 mb-6 leading-relaxed">
              {paragraph}
            </p>
          )}
        </div>

        {/* Celebrity Tags */}
        <div className="glass-card rounded-2xl p-8 mb-12">
          <h3 className="font-playfair text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Icon name="UserGroupIcon" size={24} className="text-accent" />
            Featured Celebrities
          </h3>
          <div className="flex flex-wrap gap-3">
            {article.tags.map((tag) =>
            <Link key={tag} href={`/celebrity-profiles?search=${tag}`}>
                <span className="glass-card px-4 py-2 rounded-full text-sm font-medium text-white hover:glow-gold transition-all cursor-pointer">
                  {tag}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="glass-card rounded-2xl p-6 mb-12 flex items-center justify-between">
          <p className="font-playfair text-lg font-semibold text-white">Share this article</p>
          <div className="flex items-center gap-4">
            <button className="glass-card p-3 rounded-full hover:glow-gold transition-all">
              <Icon name="ShareIcon" size={20} className="text-white" />
            </button>
            <button className="glass-card p-3 rounded-full hover:glow-rose transition-all">
              <Icon name="HeartIcon" size={20} className="text-white" />
            </button>
            <button className="glass-card p-3 rounded-full hover:glow-emerald transition-all">
              <Icon name="BookmarkIcon" size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Related Articles */}
        <div>
          <h3 className="font-playfair text-3xl font-bold text-white mb-8">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) =>
            <Link key={related.id} href={`/celebrity-news/${related.id}`}>
                <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-emerald transition-all duration-500 cursor-pointer">
                  <div className="relative aspect-video">
                    <AppImage
                    src={related.thumbnail}
                    alt={related.alt}
                    className="w-full h-full object-cover" />
                  
                    <div className="absolute top-4 left-4">
                      <span className="bg-accent/20 text-accent border border-accent/30 font-montserrat text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
                        {related.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-playfair text-base font-semibold text-white line-clamp-2">
                      {related.headline}
                    </h4>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>);

}