"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/context/AuthContext';

interface FavOutfit {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  category: string;
  brand?: string;
  purchasePrice?: number;
  store?: string;
  views: number;
  likes: string[];
  comments: any[];
  favourites: string[];
  createdAt: string;
  userId?: { name: string; avatar?: string };
}

export default function FavouritesSection() {
  const { user, authHeaders } = useAuth();
  const [outfits, setOutfits] = useState<FavOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchFavourites = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/user-outfits/favourites', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setOutfits(json.outfits);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { fetchFavourites(); }, []); // eslint-disable-line

  const handleRemove = async (outfit: FavOutfit) => {
    setRemoving(outfit._id);
    try {
      const res  = await fetch(`/api/user-outfits/${outfit.slug}/interact`, {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'unfavourite' }),
      });
      const json = await res.json();
      if (json.success) setOutfits((prev) => prev.filter((o) => o._id !== outfit._id));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-white mb-1">Saved Outfits</h2>
          <p className="text-neutral-400 text-sm">Outfits you've bookmarked for later</p>
        </div>
        {outfits.length > 0 && (
          <span className="px-4 py-2 glass-card rounded-2xl text-yellow-400 text-sm border border-yellow-500/20">
            {outfits.length} saved
          </span>
        )}
      </div>

      {outfits.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <Icon name="BookmarkIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
          <h3 className="font-playfair text-xl text-white mb-2">No saved outfits yet</h3>
          <p className="text-neutral-400 text-sm mb-6">Browse the Fashion Gallery and tap the Save button on outfits you love.</p>
          <Link
            href="/fashion-gallery"
            className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
          >
            <Icon name="SparklesIcon" size={16} /> Explore Fashion Gallery
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {outfits.map((outfit) => (
            <div key={outfit._id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/30 transition-all group">
              {/* Image */}
              <Link href={`/user-outfits/${outfit.slug}`} className="block relative h-52 overflow-hidden">
                <AppImage
                  src={outfit.images[0] || ''}
                  alt={outfit.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Stats overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1"><Icon name="EyeIcon" size={12} />{outfit.views}</span>
                  <span className="flex items-center gap-1"><Icon name="HeartIcon" size={12} />{outfit.likes.length}</span>
                  <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftIcon" size={12} />{outfit.comments.length}</span>
                </div>
              </Link>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <Link href={`/user-outfits/${outfit.slug}`}>
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors mb-1">
                      {outfit.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="capitalize">{outfit.category}</span>
                    {outfit.brand && <><span>·</span><span>{outfit.brand}</span></>}
                    {outfit.purchasePrice && (
                      <><span>·</span><span className="text-primary font-medium">₹{outfit.purchasePrice.toLocaleString()}</span></>
                    )}
                  </div>
                </div>

                {outfit.userId && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs text-neutral-500">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <span className="text-black font-bold text-[10px]">{outfit.userId.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="truncate">{outfit.userId.name}</span>
                    <span className="ml-auto">{new Date(outfit.createdAt).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/user-outfits/${outfit.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all"
                  >
                    <Icon name="EyeIcon" size={13} /> View
                  </Link>
                  <button
                    onClick={() => handleRemove(outfit)}
                    disabled={removing === outfit._id}
                    className="flex items-center justify-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                    title="Remove from saved"
                  >
                    {removing === outfit._id
                      ? <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      : <Icon name="BookmarkSlashIcon" size={13} />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
