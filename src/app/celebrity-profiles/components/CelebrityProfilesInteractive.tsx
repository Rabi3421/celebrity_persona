"use client";

import { useState } from 'react';
import SearchBar from './SearchBar';
import CelebrityGrid from './CelebrityGrid';

export default function CelebrityProfilesInteractive() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4">
            Celebrity Profiles
          </h1>
          <p className="font-inter text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            Wikipedia-level detailed information on your favorite stars
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-16">
          <SearchBar onSearch={setSearchQuery} onFilterChange={setActiveFilter} />
        </div>

        {/* Celebrity Grid */}
        <CelebrityGrid searchQuery={searchQuery} activeFilter={activeFilter} />
      </div>
    </section>
  );
}