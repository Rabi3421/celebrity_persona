"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface UserUpload {
  id: string;
  uploaderName: string;
  uploaderAvatar: string;
  outfitDescription: string;
  upvotes: number;
  views: string;
  image: string;
  alt: string;
}

export default function CommunityUploads() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const uploads: UserUpload[] = [
  {
    id: 'upload_1',
    uploaderName: 'Sarah Chen',
    uploaderAvatar: "https://images.unsplash.com/photo-1511937209140-62912b8086d9",
    outfitDescription: 'Emma Watson inspired casual look',
    upvotes: 234,
    views: '3.2K',
    image: "https://images.unsplash.com/photo-1610850756109-1f9b7abb5cdf",
    alt: 'Casual beige sweater with light blue jeans and white sneakers'
  },
  {
    id: 'upload_2',
    uploaderName: 'Mike Johnson',
    uploaderAvatar: "https://images.unsplash.com/photo-1706967930742-9d6c5238e7e4",
    outfitDescription: 'Tom Holland airport style',
    upvotes: 189,
    views: '2.8K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1308d5eaf-1770609261808.png",
    alt: 'Sporty bomber jacket with navy joggers and running shoes'
  },
  {
    id: 'upload_3',
    uploaderName: 'Lisa Park',
    uploaderAvatar: "https://images.unsplash.com/photo-1577707801363-d1ac635656b9",
    outfitDescription: 'Zendaya red carpet recreation',
    upvotes: 412,
    views: '5.6K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_147d7b671-1770185029925.png",
    alt: 'Elegant emerald green gown with crystal embellishments'
  },
  {
    id: 'upload_4',
    uploaderName: 'Alex Rivera',
    uploaderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11a2e4a58-1763295038790.png",
    outfitDescription: 'Ryan Reynolds smart casual',
    upvotes: 156,
    views: '2.1K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_145c0c654-1767637889808.png",
    alt: 'Classic navy suit with white dress shirt and brown leather shoes'
  },
  {
    id: 'upload_5',
    uploaderName: 'Emma Davis',
    uploaderAvatar: "https://images.unsplash.com/photo-1609449559585-23908d447562",
    outfitDescription: 'Margot Robbie party outfit',
    upvotes: 298,
    views: '4.3K',
    image: "https://images.unsplash.com/photo-1700064817900-6c16021b304e",
    alt: 'Glamorous pink satin dress with silver heels'
  },
  {
    id: 'upload_6',
    uploaderName: 'James Wilson',
    uploaderAvatar: "https://images.unsplash.com/photo-1712161397051-fb62c24b0597",
    outfitDescription: 'Timothée Chalamet street style',
    upvotes: 267,
    views: '3.7K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_116e4fac8-1767445180508.png",
    alt: 'Stylish burgundy velvet blazer with black turtleneck'
  },
  {
    id: 'upload_7',
    uploaderName: 'Nina Patel',
    uploaderAvatar: "https://images.unsplash.com/photo-1694401878077-51d2ebf44833",
    outfitDescription: 'Scarlett Johansson evening look',
    upvotes: 345,
    views: '4.9K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_149794400-1765050044265.png",
    alt: 'Stunning black evening gown with sequin detailing'
  },
  {
    id: 'upload_8',
    uploaderName: 'Chris Lee',
    uploaderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1970befee-1768597019468.png",
    outfitDescription: 'Chris Hemsworth gym wear',
    upvotes: 178,
    views: '2.5K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1970befee-1768597019468.png",
    alt: 'Athletic gray hoodie with dark blue joggers and sneakers'
  },
  {
    id: 'upload_9',
    uploaderName: 'Sophie Martin',
    uploaderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10ecead6b-1769406885989.png",
    outfitDescription: 'Emma Watson sustainable fashion',
    upvotes: 421,
    views: '6.1K',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_105afe58d-1768666763976.png",
    alt: 'Elegant beige blazer with gold buttons over white silk shirt'
  }];


  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <span className="font-montserrat text-xs uppercase tracking-wider text-secondary mb-4 block">
              Community
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              User Uploads
            </h2>
            <p className="font-inter text-lg text-neutral-400 max-w-2xl">
              See how our community recreates celebrity fashion
            </p>
          </div>
          <button className="glass-card px-8 py-4 rounded-full hover:glow-rose transition-all flex items-center gap-2">
            <Icon name="ArrowUpTrayIcon" size={20} className="text-secondary" />
            <span className="text-base font-medium text-white">Upload Yours</span>
          </button>
        </div>

        {/* Masonry Grid */}
        <div
          className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          style={{ opacity: isHydrated ? 1 : 0 }}>
          
          {uploads.map((upload) =>
          <div
            key={upload.id}
            className="break-inside-avoid glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-rose transition-all duration-500 cursor-pointer">
            
              <div className="relative">
                <AppImage
                src={upload.image}
                alt={upload.alt}
                className="w-full h-auto object-cover" />
              
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <AppImage
                    src={upload.uploaderAvatar}
                    alt={`${upload.uploaderName} profile picture`}
                    className="w-full h-full object-cover" />
                  
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">
                      {upload.uploaderName}
                    </h4>
                    <p className="text-xs text-neutral-500">Community Member</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-300 mb-4 line-clamp-2">
                  {upload.outfitDescription}
                </p>
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full hover:glow-rose transition-all">
                    <Icon name="HeartIcon" size={16} className="text-secondary" />
                    <span className="text-sm text-white">{upload.upvotes}</span>
                  </button>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Icon name="EyeIcon" size={16} />
                    <span className="text-sm">{upload.views}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="glass-card px-8 py-4 rounded-full hover:glow-rose transition-all">
            <span className="text-base font-medium text-white">Load More Uploads</span>
          </button>
        </div>
      </div>
    </section>);

}