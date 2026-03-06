"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import FilterBar from './FilterBar';
import OutfitGallery from './OutfitGallery';
import FeaturedOutfit from './FeaturedOutfit';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export interface OutfitDoc {
  id: string;
  title: string;
  slug: string;
  celebrity?: { name: string; slug?: string; profileImage?: string } | string;
  images: string[];
  event?: string;
  designer?: string;
  brand?: string;
  category?: string;
  color?: string;
  price?: string;
  purchaseLink?: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
}

interface UserOutfitDoc {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  category: string;
  brand?: string;
  color?: string;
  purchasePrice?: number;
  store?: string;
  views: number;
  likes: string[];
  createdAt: string;
  userId?: { name: string; avatar?: string };
}

const API_KEY = process.env.NEXT_PUBLIC_X_API_KEY || '';

export default function FashionGalleryInteractive() {
  const [outfits, setOutfits]       = useState<OutfitDoc[]>([]);
  const [featured, setFeatured]     = useState<OutfitDoc | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const searchInputRef              = useRef<HTMLInputElement>(null);
  const [filters, setFilters]       = useState({
    category: 'all',
    event: 'all',
    brand: 'all',
  });

  // Community outfits
  const [communityOutfits, setCommunityOutfits]   = useState<UserOutfitDoc[]>([]);
  const [communityLoading, setCommunityLoading]   = useState(true);

  const fetchOutfits = useCallback(async (p = 1, q = search, f = filters) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (q)                  params.set('q', q);
      if (f.category !== 'all') params.set('category', f.category);
      if (f.event    !== 'all') params.set('event',    f.event);
      if (f.brand    !== 'all') params.set('brand',    f.brand);

      const res  = await fetch(`/api/user/outfits?${params}`, {
        headers: { 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load outfits');

      const docs: OutfitDoc[] = json.data;
      setOutfits(docs);
      setPage(json.page);
      setPages(json.pages);
      setTotal(json.total);

      // first featured item becomes the hero on initial load (page 1, no filters)
      if (p === 1 && !q && f.category === 'all' && f.event === 'all' && f.brand === 'all') {
        const feat = docs.find((d) => d.isFeatured) || docs[0] || null;
        setFeatured(feat);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { fetchOutfits(1); }, [fetchOutfits]);

  // ── Fetch community (user) outfits ─────────────────────────────────────────
  useEffect(() => {
    setCommunityLoading(true);
    fetch('/api/user-outfits?limit=8&sort=latest', {
      headers: { 'x-api-key': API_KEY },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCommunityOutfits(json.data || []);
      })
      .catch(() => {/* silent */})
      .finally(() => setCommunityLoading(false));
  }, []);

  const handleFilterChange = (f: typeof filters) => {
    setFilters(f); fetchOutfits(1, search, f);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOutfits(1, search, filters);
  };

  return (
    <>
      {/* Featured Hero from DB */}
      {!loading && featured && <FeaturedOutfit outfit={featured} />}

      {/* Page Header */}
      <div className="text-center mb-12 px-6 mt-24">
        <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4">
          Celebrity Fashion Gallery
        </h1>
        <p className="font-inter text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
          Shop the exact outfits worn by your favourite celebrities
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-8 flex items-center gap-3 max-w-xl mx-auto">
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, brand, designer…"
            className="flex-1 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
          />
          <button type="submit"
            className="px-6 py-3 rounded-full bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all">
            Search
          </button>
        </form>
      </div>

      <div className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <FilterBar onFilterChange={handleFilterChange} />
          </div>

          {/* Outfit Gallery */}
          <div className="lg:col-span-3">
            {error && (
              <div className="text-center py-16">
                <p className="text-red-400 font-montserrat text-sm">{error}</p>
                <button onClick={() => fetchOutfits(1)}
                  className="mt-4 text-yellow-400 text-sm font-montserrat hover:underline">Retry</button>
              </div>
            )}

            {!error && (
              <OutfitGallery outfits={outfits} loading={loading} />
            )}

            {/* Pagination */}
            {!loading && !error && pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button disabled={page <= 1} onClick={() => fetchOutfits(page - 1)}
                  className="px-5 py-2.5 rounded-full glass-card text-neutral-400 hover:text-white disabled:opacity-30 text-sm font-montserrat transition-all">
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => fetchOutfits(n)}
                    className={`w-10 h-10 rounded-full text-sm font-montserrat transition-all ${
                      n === page ? 'bg-yellow-500 text-black font-bold' : 'glass-card text-neutral-400 hover:text-white'
                    }`}>
                    {n}
                  </button>
                ))}
                <button disabled={page >= pages} onClick={() => fetchOutfits(page + 1)}
                  className="px-5 py-2.5 rounded-full glass-card text-neutral-400 hover:text-white disabled:opacity-30 text-sm font-montserrat transition-all">
                  Next →
                </button>
              </div>
            )}

            {!loading && !error && outfits.length === 0 && (
              <div className="text-center py-24">
                <p className="text-neutral-500 font-montserrat text-lg">No outfits found</p>
                <p className="text-neutral-600 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Community Outfits Section ──────────────────────────────────────── */}
      {(communityLoading || communityOutfits.length > 0) && (
        <div className="px-6 pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                  Community Outfits
                </h2>
                <p className="text-neutral-400">Real styles shared by our fashion community</p>
              </div>
              <Link
                href="/dashboard?section=uploads"
                className="hidden md:flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:glow-gold transition-all"
              >
                <Icon name="ArrowUpTrayIcon" size={16} />
                Share Your Style
              </Link>
            </div>

            {/* Grid */}
            {communityLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-white/5 rounded-2xl" />
                ))}
              </div>
            ) : communityOutfits.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <Icon name="PhotoIcon" size={48} className="text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No community outfits yet. Be the first to share!</p>
                <Link href="/dashboard?section=uploads" className="mt-4 inline-flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:glow-gold transition-all">
                  <Icon name="ArrowUpTrayIcon" size={16} />
                  Upload Outfit
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {communityOutfits.map((outfit) => (
                    <Link
                      key={outfit._id}
                      href={`/user-outfits/${outfit.slug}`}
                      className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-gold transition-all group block"
                    >
                      <div className="relative h-56">
                        <AppImage
                          src={outfit.images[0] || ''}
                          alt={outfit.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {/* Category pill */}
                        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 capitalize">
                          {outfit.category}
                        </span>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">View Details →</span>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="text-white text-sm font-semibold truncate mb-1">{outfit.title}</h3>
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <div className="flex items-center gap-2">
                            {outfit.userId && (
                              <span className="text-neutral-400 truncate max-w-[80px]">{outfit.userId.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5">
                              <Icon name="EyeIcon" size={12} />
                              {outfit.views}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Icon name="HeartIcon" size={12} />
                              {outfit.likes.length}
                            </span>
                          </div>
                        </div>
                        {outfit.purchasePrice && (
                          <p className="text-primary text-sm font-bold mt-1">₹{outfit.purchasePrice.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View all */}
                <div className="text-center mt-8">
                  <Link
                    href="/fashion-gallery/community"
                    className="inline-flex items-center gap-2 glass-card px-8 py-3 rounded-full text-white hover:text-primary transition-colors text-sm font-medium"
                  >
                    View All Community Outfits
                    <Icon name="ArrowRightIcon" size={16} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}