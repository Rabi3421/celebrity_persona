"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface UserOutfit {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  brand?: string;
  color?: string;
  size?: string;
  purchaseLink?: string;
  purchasePrice?: number;
  store?: string;
  tags: string[];
  views: number;
  likes: string[];
  clicks: any[];
  isPublished: boolean;
  slug: string;
  createdAt: string;
  userId?: { name: string; avatar?: string };
}

export default function UserOutfitDetail({ slug }: { slug: string }) {
  const [outfit, setOutfit]       = useState<UserOutfit | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox]   = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/user-outfits/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOutfit(json.outfit);
        else setError(json.message || 'Not found');
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-[480px] bg-white/5 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-white/5 rounded-xl" />
            <div className="h-4 w-1/2 bg-white/5 rounded-xl" />
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <Icon name="ExclamationCircleIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
        <h2 className="font-playfair text-2xl text-white mb-2">Outfit Not Found</h2>
        <p className="text-neutral-400 mb-6">{error}</p>
        <Link href="/fashion-gallery" className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all">
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
        <Link href="/homepage" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/fashion-gallery" className="hover:text-white transition-colors">Fashion Gallery</Link>
        <span>/</span>
        <span className="text-neutral-300 truncate max-w-xs">{outfit.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Image gallery ─────────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div
            className="relative rounded-3xl overflow-hidden h-[420px] md:h-[520px] cursor-zoom-in glass-card"
            onClick={() => setLightbox(true)}
          >
            <AppImage
              src={outfit.images[activeImg] || ''}
              alt={outfit.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 glass-card px-2 py-1 rounded-full text-xs text-neutral-300 flex items-center gap-1">
              <Icon name="MagnifyingGlassPlusIcon" size={12} />
              Zoom
            </div>
          </div>

          {/* Thumbnails */}
          {outfit.images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {outfit.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary' : 'border-transparent hover:border-white/30'}`}
                >
                  <AppImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ───────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title + uploader */}
          <div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              {outfit.title}
            </h1>
            {outfit.userId && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <span className="text-black font-bold text-xs">{outfit.userId.name.charAt(0).toUpperCase()}</span>
                </div>
                <span>by <span className="text-white">{outfit.userId.name}</span></span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Icon name="EyeIcon" size={16} className="text-primary" />
              {outfit.views.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="HeartIcon" size={16} className="text-primary" />
              {outfit.likes.length} likes
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="CursorArrowRaysIcon" size={16} className="text-primary" />
              {outfit.clicks.length} clicks
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs capitalize border border-primary/20">
              {outfit.category}
            </span>
            {outfit.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 text-xs border border-white/10">
                #{tag}
              </span>
            ))}
          </div>

          {/* Details card */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            {outfit.brand && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Brand</span>
                <span className="text-white font-medium">{outfit.brand}</span>
              </div>
            )}
            {outfit.color && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Color</span>
                <span className="text-white font-medium">{outfit.color}</span>
              </div>
            )}
            {outfit.size && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Size</span>
                <span className="text-white font-medium">{outfit.size}</span>
              </div>
            )}
            {outfit.store && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Store</span>
                <span className="text-white font-medium">{outfit.store}</span>
              </div>
            )}
            {outfit.purchasePrice && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Price</span>
                <span className="text-primary font-bold text-base">₹{outfit.purchasePrice.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Posted on</span>
              <span className="text-white">{new Date(outfit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Description */}
          {outfit.description && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-2">Description</h3>
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">{outfit.description}</p>
            </div>
          )}

          {/* CTA */}
          {outfit.purchaseLink && (
            <a
              href={outfit.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-black py-4 rounded-full font-semibold hover:glow-gold transition-all"
            >
              <Icon name="ShoppingBagIcon" size={20} />
              Buy Now {outfit.store ? `on ${outfit.store}` : ''}
            </a>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 glass-card p-2 rounded-full" onClick={() => setLightbox(false)}>
            <Icon name="XMarkIcon" size={24} className="text-white" />
          </button>
          {outfit.images.length > 1 && (
            <>
              <button
                className="absolute left-4 glass-card p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + outfit.images.length) % outfit.images.length); }}
              >
                <Icon name="ChevronLeftIcon" size={24} className="text-white" />
              </button>
              <button
                className="absolute right-14 glass-card p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % outfit.images.length); }}
              >
                <Icon name="ChevronRightIcon" size={24} className="text-white" />
              </button>
            </>
          )}
          <img
            src={outfit.images[activeImg]}
            alt={outfit.title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
