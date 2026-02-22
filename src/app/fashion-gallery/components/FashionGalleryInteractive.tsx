"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import FilterBar from './FilterBar';
import OutfitGallery from './OutfitGallery';
import FeaturedOutfit from './FeaturedOutfit';

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
    </>
  );
}