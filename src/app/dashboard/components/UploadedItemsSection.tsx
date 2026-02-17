"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface UploadedItem {
  id: string;
  title: string;
  category: string;
  uploadDate: string;
  views: number;
  likes: number;
  image: string;
  status: 'published' | 'pending' | 'draft';
}

export default function UploadedItemsSection() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const uploadedItems: UploadedItem[] = [
    {
      id: '1',
      title: 'Vintage Denim Jacket',
      category: 'Casual',
      uploadDate: '2024-02-05',
      views: 1243,
      likes: 89,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      status: 'published',
    },
    {
      id: '2',
      title: 'Red Carpet Gown',
      category: 'Formal',
      uploadDate: '2024-02-03',
      views: 2156,
      likes: 234,
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400',
      status: 'published',
    },
    {
      id: '3',
      title: 'Street Style Sneakers',
      category: 'Footwear',
      uploadDate: '2024-02-01',
      views: 876,
      likes: 45,
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
      status: 'published',
    },
    {
      id: '4',
      title: 'Summer Beach Outfit',
      category: 'Casual',
      uploadDate: '2024-01-28',
      views: 543,
      likes: 67,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
      status: 'pending',
    },
    {
      id: '5',
      title: 'Business Suit',
      category: 'Professional',
      uploadDate: '2024-01-25',
      views: 0,
      likes: 0,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
      status: 'draft',
    },
    {
      id: '6',
      title: 'Bohemian Maxi Dress',
      category: 'Casual',
      uploadDate: '2024-01-20',
      views: 1987,
      likes: 156,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
      status: 'published',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/20 text-success border-success/30';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'draft':
        return 'bg-neutral-700/20 text-neutral-400 border-neutral-600/30';
      default:
        return 'bg-neutral-700/20 text-neutral-400 border-neutral-600/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-white mb-2">
            My Uploads
          </h2>
          <p className="text-neutral-400">Manage your uploaded fashion items</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all flex items-center gap-2"
        >
          <Icon name="ArrowUpTrayIcon" size={20} />
          <span>Upload New</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="font-playfair text-3xl font-bold text-white mb-1">
            {uploadedItems.length}
          </p>
          <p className="text-sm text-neutral-400">Total Uploads</p>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="font-playfair text-3xl font-bold text-white mb-1">
            {uploadedItems.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-400">Total Views</p>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="font-playfair text-3xl font-bold text-white mb-1">
            {uploadedItems.reduce((sum, item) => sum + item.likes, 0)}
          </p>
          <p className="text-sm text-neutral-400">Total Likes</p>
        </div>
      </div>

      {/* Uploaded Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploadedItems.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-gold transition-all group"
          >
            <div className="relative h-64">
              <AppImage
                src={item.image}
                alt={`${item.title} - ${item.category} fashion item`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
                    getStatusColor(item.status)
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="glass-card p-2 rounded-full hover:bg-primary/20 transition-colors">
                  <Icon name="PencilIcon" size={16} className="text-white" />
                </button>
                <button className="glass-card p-2 rounded-full hover:bg-error/20 transition-colors">
                  <Icon name="TrashIcon" size={16} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-playfair text-lg font-bold text-white mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-neutral-400 mb-3">{item.category}</p>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Icon name="EyeIcon" size={14} />
                    {item.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="HeartIcon" size={14} />
                    {item.likes}
                  </span>
                </div>
                <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal (Static) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-playfair text-2xl font-bold text-white">
                Upload Fashion Item
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="glass-card p-2 rounded-full hover:bg-error/20 transition-colors"
              >
                <Icon name="XMarkIcon" size={20} className="text-white" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors cursor-pointer">
                <Icon name="PhotoIcon" size={48} className="text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-400 text-sm">Click to upload or drag and drop</p>
                <p className="text-neutral-600 text-xs mt-1">PNG, JPG up to 10MB</p>
              </div>
              <input
                type="text"
                placeholder="Item Title"
                className="w-full glass-card px-4 py-3 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Select Category</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="footwear">Footwear</option>
                <option value="professional">Professional</option>
              </select>
              <button className="w-full bg-primary text-black py-3 rounded-full font-medium hover:glow-gold transition-all">
                Upload Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}