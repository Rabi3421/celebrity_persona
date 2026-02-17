"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
}

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'filter_all', value: 'all', label: 'All' },
    { id: 'filter_movie', value: 'movie', label: 'Movie' },
    { id: 'filter_fashion', value: 'fashion', label: 'Fashion' },
    { id: 'filter_music', value: 'music', label: 'Music' },
    { id: 'filter_sports', value: 'sports', label: 'Sports' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Icon
          name="MagnifyingGlassIcon"
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search celebrities..."
          className="w-full glass-card pl-12 pr-4 py-4 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter.value)}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
              activeFilter === filter.value
                ? 'bg-primary text-black' :'glass-card text-neutral-400 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}