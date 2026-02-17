"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Celebrity {
  id: string;
  name: string;
  profession: string;
  latestProject: string;
  instagramFollowers: string;
  image: string;
  alt: string;
  category: string;
}

interface CelebrityGridProps {
  searchQuery: string;
  activeFilter: string;
}

export default function CelebrityGrid({ searchQuery, activeFilter }: CelebrityGridProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const celebrities: Celebrity[] = [
  {
    id: 'celeb_grid_1',
    name: 'Emma Watson',
    profession: 'Actress & Activist',
    latestProject: 'Fashion Week 2026',
    instagramFollowers: '62.4M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d4aad93b-1770398321397.png",
    alt: 'Young woman with long brown hair in elegant black dress',
    category: 'movie'
  },
  {
    id: 'celeb_grid_2',
    name: 'Chris Hemsworth',
    profession: 'Actor',
    latestProject: 'Thor: Ragnarok Returns',
    instagramFollowers: '55.2M',
    image: "https://images.unsplash.com/photo-1616707808904-e012afa93dba",
    alt: 'Man with short brown hair in casual denim jacket',
    category: 'movie'
  },
  {
    id: 'celeb_grid_3',
    name: 'Zendaya',
    profession: 'Actress & Singer',
    latestProject: 'Dune: Messiah',
    instagramFollowers: '184M',
    image: "https://images.unsplash.com/photo-1608216874348-f0acf1cc149e",
    alt: 'Young woman with curly hair in stylish white top',
    category: 'movie'
  },
  {
    id: 'celeb_grid_4',
    name: 'Ryan Reynolds',
    profession: 'Actor & Producer',
    latestProject: 'Deadpool 3',
    instagramFollowers: '47.8M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1cfb5fe8d-1763294577039.png",
    alt: 'Man with short hair in gray suit jacket',
    category: 'movie'
  },
  {
    id: 'celeb_grid_5',
    name: 'Margot Robbie',
    profession: 'Actress & Producer',
    latestProject: 'Barbie: Dream World',
    instagramFollowers: '28.5M',
    image: "https://images.unsplash.com/photo-1620154417713-aa0fa0ce78f2",
    alt: 'Young woman with blonde hair in elegant pink dress',
    category: 'fashion'
  },
  {
    id: 'celeb_grid_6',
    name: 'Tom Holland',
    profession: 'Actor',
    latestProject: 'Spider-Man: Beyond',
    instagramFollowers: '67.3M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_149216793-1763296002470.png",
    alt: 'Young man with short brown hair in casual navy shirt',
    category: 'movie'
  },
  {
    id: 'celeb_grid_7',
    name: 'Scarlett Johansson',
    profession: 'Actress',
    latestProject: 'Black Widow Returns',
    instagramFollowers: '0',
    image: "https://images.unsplash.com/photo-1696575813317-201d93f3576a",
    alt: 'Young woman with red hair in elegant black dress',
    category: 'movie'
  },
  {
    id: 'celeb_grid_8',
    name: 'Timothée Chalamet',
    profession: 'Actor',
    latestProject: 'Wonka: The Golden Ticket',
    instagramFollowers: '18.9M',
    image: "https://images.unsplash.com/photo-1650407121929-3f0ac60727da",
    alt: 'Young man with curly hair in stylish brown jacket',
    category: 'movie'
  },
  {
    id: 'celeb_grid_9',
    name: 'Taylor Swift',
    profession: 'Singer & Songwriter',
    latestProject: 'Eras Tour 2026',
    instagramFollowers: '272M',
    image: "https://images.unsplash.com/photo-1595274884203-6fbf8b40046b",
    alt: 'Young woman with blonde hair in sparkly performance outfit',
    category: 'music'
  },
  {
    id: 'celeb_grid_10',
    name: 'Dwayne Johnson',
    profession: 'Actor & Producer',
    latestProject: 'Black Adam Returns',
    instagramFollowers: '389M',
    image: "https://images.unsplash.com/photo-1711617906377-77059de85479",
    alt: 'Muscular man with bald head in black tactical gear',
    category: 'movie'
  },
  {
    id: 'celeb_grid_11',
    name: 'Serena Williams',
    profession: 'Tennis Champion',
    latestProject: 'US Open 2026',
    instagramFollowers: '16.2M',
    image: "https://images.unsplash.com/photo-1677116616921-6e768d435d54",
    alt: 'Athletic woman in white tennis outfit with racket',
    category: 'sports'
  },
  {
    id: 'celeb_grid_12',
    name: 'Billie Eilish',
    profession: 'Singer & Songwriter',
    latestProject: 'New Album Release',
    instagramFollowers: '110M',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_182af9817-1766577612967.png",
    alt: 'Young woman with unique style in oversized streetwear',
    category: 'music'
  }];


  const filteredCelebrities = celebrities.filter((celeb) => {
    const matchesSearch = celeb.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || celeb.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      style={{ opacity: isHydrated ? 1 : 0 }}>
      
      {filteredCelebrities.map((celebrity) =>
      <div
        key={celebrity.id}
        className="glass-card rounded-2xl overflow-hidden hover:scale-105 hover:glow-gold transition-all duration-500 cursor-pointer">
        
          <div className="relative aspect-[4/5]">
            <AppImage
            src={celebrity.image}
            alt={celebrity.alt}
            className="w-full h-full object-cover" />
          
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-playfair text-2xl font-bold text-white mb-1">
                {celebrity.name}
              </h3>
              <p className="text-sm text-neutral-300 mb-3">{celebrity.profession}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="FilmIcon" size={16} className="text-primary" />
                  <span className="text-xs text-neutral-400">{celebrity.latestProject}</span>
                </div>
                {celebrity.instagramFollowers !== '0' &&
              <div className="flex items-center gap-1">
                    <Icon name="UserGroupIcon" size={16} className="text-primary" />
                    <span className="text-xs text-neutral-400">
                      {celebrity.instagramFollowers}
                    </span>
                  </div>
              }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>);

}