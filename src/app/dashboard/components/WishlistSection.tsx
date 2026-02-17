"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

type WishlistTab = 'celebrities' | 'outfits';

interface Celebrity {
  id: string;
  name: string;
  profession: string;
  image: string;
  savedDate: string;
}

interface Outfit {
  id: string;
  celebrityName: string;
  occasion: string;
  image: string;
  priceRange: string;
  savedDate: string;
}

export default function WishlistSection() {
  const [activeTab, setActiveTab] = useState<WishlistTab>('celebrities');

  const savedCelebrities: Celebrity[] = [
    {
      id: '1',
      name: 'Zendaya',
      profession: 'Actress & Fashion Icon',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
      savedDate: '2 days ago',
    },
    {
      id: '2',
      name: 'Timothée Chalamet',
      profession: 'Actor',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      savedDate: '5 days ago',
    },
    {
      id: '3',
      name: 'Florence Pugh',
      profession: 'Actress',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      savedDate: '1 week ago',
    },
    {
      id: '4',
      name: 'Harry Styles',
      profession: 'Musician & Style Icon',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      savedDate: '2 weeks ago',
    },
  ];

  const savedOutfits: Outfit[] = [
    {
      id: '1',
      celebrityName: 'Zendaya',
      occasion: 'Red Carpet',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
      priceRange: '$500-$2000',
      savedDate: '1 day ago',
    },
    {
      id: '2',
      celebrityName: 'Blake Lively',
      occasion: 'Gala',
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400',
      priceRange: '$1000-$3000',
      savedDate: '3 days ago',
    },
    {
      id: '3',
      celebrityName: 'Emma Stone',
      occasion: 'Casual',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      priceRange: '$200-$800',
      savedDate: '1 week ago',
    },
    {
      id: '4',
      celebrityName: 'Margot Robbie',
      occasion: 'Street Style',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
      priceRange: '$300-$1000',
      savedDate: '2 weeks ago',
    },
    {
      id: '5',
      celebrityName: 'Anya Taylor-Joy',
      occasion: 'Premiere',
      image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400',
      priceRange: '$800-$2500',
      savedDate: '3 weeks ago',
    },
    {
      id: '6',
      celebrityName: 'Saoirse Ronan',
      occasion: 'Awards',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
      priceRange: '$1500-$4000',
      savedDate: '1 month ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tab Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('celebrities')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeTab === 'celebrities' ?'bg-primary text-black font-medium' :'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="UserGroupIcon" size={20} />
          <span>Saved Celebrities ({savedCelebrities.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('outfits')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeTab === 'outfits' ?'bg-primary text-black font-medium' :'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="SparklesIcon" size={20} />
          <span>Saved Outfits ({savedOutfits.length})</span>
        </button>
      </div>

      {/* Celebrities Grid */}
      {activeTab === 'celebrities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedCelebrities.map((celebrity) => (
            <div
              key={celebrity.id}
              className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-gold transition-all group"
            >
              <div className="relative h-64">
                <AppImage
                  src={celebrity.image}
                  alt={`${celebrity.name} profile photo`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <button className="absolute top-4 right-4 glass-card p-2 rounded-full hover:bg-error/20 transition-colors">
                  <Icon name="HeartIcon" variant="solid" size={20} className="text-secondary" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-playfair text-xl font-bold text-white mb-1">
                  {celebrity.name}
                </h3>
                <p className="text-sm text-neutral-400 mb-2">{celebrity.profession}</p>
                <p className="text-xs text-neutral-500">Saved {celebrity.savedDate}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outfits Grid */}
      {activeTab === 'outfits' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {savedOutfits.map((outfit) => (
            <div
              key={outfit.id}
              className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-rose transition-all group"
            >
              <div className="relative h-80">
                <AppImage
                  src={outfit.image}
                  alt={`${outfit.celebrityName} wearing ${outfit.occasion} outfit`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <button className="absolute top-4 right-4 glass-card p-2 rounded-full hover:bg-error/20 transition-colors">
                  <Icon name="HeartIcon" variant="solid" size={20} className="text-secondary" />
                </button>
                <div className="absolute top-4 left-4">
                  <span className="glass-card px-3 py-1.5 rounded-full text-xs font-medium text-white">
                    {outfit.occasion}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-playfair text-xl font-bold text-white mb-2">
                    {outfit.celebrityName}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">{outfit.priceRange}</span>
                    <span className="text-xs text-neutral-500">Saved {outfit.savedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}