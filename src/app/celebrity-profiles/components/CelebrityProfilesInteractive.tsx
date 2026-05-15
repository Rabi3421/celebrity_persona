"use client";

import { useState } from 'react';
import SearchBar from './SearchBar';
import CelebrityGrid from './CelebrityGrid';
import TrendingCelebrities from './TrendingCelebrities';
import CategorySpotlight from './CategorySpotlight';
import StatsCounter from './StatsCounter';
import WhyExplore from './WhyExplore';
import type { CelebrityDoc } from './CelebrityGrid';

interface CelebrityProfilesInteractiveProps {
  initialCelebrities?: CelebrityDoc[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  initialTrending?: CelebrityDoc[];
  initialLoaded?: boolean;
}

export default function CelebrityProfilesInteractive({
  initialCelebrities = [],
  initialPagination,
  initialTrending = [],
  initialLoaded = false,
}: CelebrityProfilesInteractiveProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <>
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="font-playfair text-4xl font-bold text-white mb-4 sm:text-5xl md:text-7xl">
              Celebrity Profiles
            </h1>
            <p className="font-inter text-base leading-7 text-neutral-400 max-w-2xl mx-auto md:text-xl">
              Wikipedia-level detailed information on your favorite stars
            </p>
          </div>

          {/* Search & Filter */}
          <div className="mb-16">
            <SearchBar onSearch={setSearchQuery} onFilterChange={setActiveFilter} />
          </div>

          {/* Celebrity Grid */}
          <CelebrityGrid
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            initialCelebrities={initialCelebrities}
            initialPagination={initialPagination}
            initialLoaded={initialLoaded}
          />
        </div>
      </section>

      {/* ── Trending Strip ───────────────────────────────────────── */}
      <TrendingCelebrities initialCelebrities={initialTrending} initialLoaded={initialLoaded} />

      {/* ── Stats Counter ────────────────────────────────────────── */}
      <StatsCounter />

      {/* ── Category Spotlight ───────────────────────────────────── */}
      <CategorySpotlight />

      {/* ── Why Explore / Features + CTA ─────────────────────────── */}
      <WhyExplore />
    </>
  );
}
