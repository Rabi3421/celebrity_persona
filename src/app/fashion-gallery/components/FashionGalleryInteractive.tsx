"use client";

import { useState } from 'react';
import FilterBar from './FilterBar';
import OutfitGallery from './OutfitGallery';

export default function FashionGalleryInteractive() {
  const [filters, setFilters] = useState({
    occasion: 'all',
    celebrity: 'all',
    priceRange: 'all',
  });

  return (
    <>
      {/* Page Header */}
      <div className="text-center mb-16 px-6">
        <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4">
          Celebrity Fashion Gallery
        </h1>
        <p className="font-inter text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
          Shop the exact outfits worn by your favorite celebrities
        </p>
      </div>

      <div className="px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <FilterBar onFilterChange={setFilters} />
          </div>

          {/* Outfit Gallery */}
          <div className="lg:col-span-3">
            <OutfitGallery filters={filters} />
            <div className="text-center mt-12">
              <button className="glass-card px-8 py-4 rounded-full hover:glow-rose transition-all">
                <span className="text-base font-medium text-white">Load More Outfits</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}