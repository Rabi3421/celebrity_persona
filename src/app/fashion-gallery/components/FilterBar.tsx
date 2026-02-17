"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterBarProps {
  onFilterChange: (filters: {
    occasion: string;
    celebrity: string;
    priceRange: string;
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedCelebrity, setSelectedCelebrity] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  const occasions = [
    { id: 'occasion_all', value: 'all', label: 'All Occasions' },
    { id: 'occasion_red_carpet', value: 'RED CARPET', label: 'Red Carpet' },
    { id: 'occasion_airport', value: 'AIRPORT', label: 'Airport' },
    { id: 'occasion_casual', value: 'CASUAL', label: 'Casual' },
    { id: 'occasion_party', value: 'PARTY', label: 'Party' },
  ];

  const priceRanges = [
    { id: 'price_all', value: 'all', label: 'All Prices' },
    { id: 'price_low', value: '$', label: 'Under $500' },
    { id: 'price_mid', value: '$$', label: '$500 - $1000' },
    { id: 'price_high', value: '$$$', label: 'Over $1000' },
  ];

  const handleOccasionChange = (value: string) => {
    setSelectedOccasion(value);
    onFilterChange({
      occasion: value,
      celebrity: selectedCelebrity,
      priceRange: selectedPriceRange,
    });
  };

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value);
    onFilterChange({
      occasion: selectedOccasion,
      celebrity: selectedCelebrity,
      priceRange: value,
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Occasion Filter */}
      <div>
        <label className="font-montserrat text-xs uppercase tracking-wider text-neutral-400 mb-3 block">
          Occasion
        </label>
        <div className="flex flex-wrap gap-2">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => handleOccasionChange(occasion.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedOccasion === occasion.value
                  ? 'bg-secondary text-black' :'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {occasion.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="font-montserrat text-xs uppercase tracking-wider text-neutral-400 mb-3 block">
          Price Range
        </label>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => handlePriceRangeChange(range.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedPriceRange === range.value
                  ? 'bg-primary text-black' :'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSelectedOccasion('all');
          setSelectedCelebrity('all');
          setSelectedPriceRange('all');
          onFilterChange({ occasion: 'all', celebrity: 'all', priceRange: 'all' });
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
      >
        <Icon name="XMarkIcon" size={16} />
        <span className="text-sm font-medium">Clear Filters</span>
      </button>
    </div>
  );
}