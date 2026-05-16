"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterState {
  category: string;
  event: string;
  outfitType: string;
  brand: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [category, setCategory] = useState('all');
  const [event,    setEvent]    = useState('all');
  const [outfitType, setOutfitType] = useState('all');

  const events = [
    { id: 'ev_all',         value: 'all',           label: 'All Events'   },
    { id: 'ev_red_carpet',  value: 'Red Carpet',    label: 'Red Carpet'   },
    { id: 'ev_airport',     value: 'Airport',       label: 'Airport'      },
    { id: 'ev_casual',      value: 'Casual',        label: 'Casual'       },
    { id: 'ev_party',       value: 'Party',         label: 'Party'        },
    { id: 'ev_wedding',     value: 'Wedding',       label: 'Wedding'      },
    { id: 'ev_premiere',    value: 'Premiere',      label: 'Premiere'     },
  ];

  const categories = [
    { id: 'cat_all',         value: 'all',             label: 'All Categories'   },
    { id: 'cat_traditional', value: 'Traditional Wear', label: 'Traditional'     },
    { id: 'cat_western',     value: 'Western Wear',     label: 'Western'         },
    { id: 'cat_ethnic',      value: 'Ethnic',           label: 'Ethnic'          },
    { id: 'cat_streetwear',  value: 'Streetwear',       label: 'Streetwear'      },
    { id: 'cat_formal',      value: 'Formal',           label: 'Formal'          },
  ];

  const outfitTypes = [
    { id: 'type_all', value: 'all', label: 'All Types' },
    { id: 'type_saree', value: 'Saree', label: 'Saree' },
    { id: 'type_gown', value: 'Gown', label: 'Gown' },
    { id: 'type_dress', value: 'Dress', label: 'Dress' },
    { id: 'type_suit', value: 'Suit', label: 'Suit' },
    { id: 'type_lehenga', value: 'Lehenga', label: 'Lehenga' },
  ];

  const emit = (ev: string, cat: string, type: string) =>
    onFilterChange({ event: ev, category: cat, outfitType: type, brand: 'all' });

  const handleEvent = (v: string) => { setEvent(v); emit(v, category, outfitType); };
  const handleCat = (v: string) => { setCategory(v); emit(event, v, outfitType); };
  const handleType = (v: string) => { setOutfitType(v); emit(event, category, v); };

  const clear = () => {
    setEvent('all'); setCategory('all'); setOutfitType('all');
    onFilterChange({ event: 'all', category: 'all', outfitType: 'all', brand: 'all' });
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-6 sm:p-6">
      {/* Event Filter */}
      <div>
        <label className="font-montserrat text-xs uppercase tracking-wider text-neutral-400 mb-3 block">
          Event
        </label>
        <div className="flex flex-wrap gap-2">
          {events.map((e) => (
            <button key={e.id} onClick={() => handleEvent(e.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all sm:px-4 ${
                event === e.value ? 'bg-secondary text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-montserrat text-xs uppercase tracking-wider text-neutral-400 mb-3 block">
          Outfit Type
        </label>
        <div className="flex flex-wrap gap-2">
          {outfitTypes.map((type) => (
            <button key={type.id} onClick={() => handleType(type.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all sm:px-4 ${
                outfitType === type.value ? 'bg-accent text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="font-montserrat text-xs uppercase tracking-wider text-neutral-400 mb-3 block">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.id} onClick={() => handleCat(c.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all sm:px-4 ${
                category === c.value ? 'bg-primary text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button onClick={clear}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
      >
        <Icon name="XMarkIcon" size={16} />
        <span className="text-sm font-medium">Clear Filters</span>
      </button>
    </div>
  );
}
