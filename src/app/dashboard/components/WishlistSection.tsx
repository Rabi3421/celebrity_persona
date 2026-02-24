"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/context/AuthContext';

type WishlistTab = 'celebrities' | 'outfits';

interface FollowedCelebrity {
  id: string;
  name: string;
  slug: string;
  profileImage: string;
  occupation: string[];
  categories: string[];
  isVerified: boolean;
}

// Merged saved outfit (user-uploaded OR celebrity outfit)
interface SavedOutfit {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  brand?: string;
  price?: string;
  purchasePrice?: number;
  category?: string;
  event?: string;
  likes: string[];
  comments: any[];
  createdAt: string;
  // user outfit extras
  views?: number;
  userId?: { name: string; avatar?: string };
  // celebrity outfit extras
  celebrity?: { name: string; slug?: string } | string;
  _source: 'user' | 'celebrity';
}

export default function WishlistSection() {
  const { authHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState<WishlistTab>('celebrities');

  // Celebrities state
  const [celebrities, setCelebrities] = useState<FollowedCelebrity[]>([]);
  const [celebLoading, setCelebLoading] = useState(true);
  const [unfollowing, setUnfollowing]   = useState<string | null>(null);

  // Outfits state
  const [outfits, setOutfits]       = useState<SavedOutfit[]>([]);
  const [outfitLoading, setOutfitLoading] = useState(true);
  const [removing, setRemoving]     = useState<string | null>(null);

  const fetchCelebrities = useCallback(async () => {
    setCelebLoading(true);
    try {
      const res  = await fetch('/api/user/celebrities/following', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setCelebrities(json.celebrities);
    } catch { /* ignore */ }
    finally { setCelebLoading(false); }
  }, [authHeaders]);

  const fetchOutfits = useCallback(async () => {
    setOutfitLoading(true);
    try {
      const headers = authHeaders();
      const [userRes, celebRes] = await Promise.all([
        fetch('/api/user-outfits/favourites',      { headers }),
        fetch('/api/celebrity-outfits/favourites', { headers }),
      ]);
      const [userJson, celebJson] = await Promise.all([userRes.json(), celebRes.json()]);

      const userOutfits: SavedOutfit[] = (userJson.success  ? userJson.outfits  : []).map((o: any) => ({ ...o, _source: 'user'      as const }));
      const celebOutfits: SavedOutfit[] = (celebJson.success ? celebJson.outfits : []).map((o: any) => ({ ...o, _source: 'celebrity' as const }));

      setOutfits(
        [...userOutfits, ...celebOutfits].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch { /* ignore */ }
    finally { setOutfitLoading(false); }
  }, [authHeaders]);

  useEffect(() => {
    fetchCelebrities();
    fetchOutfits();
  }, []); // eslint-disable-line

  const handleUnfollow = async (celeb: FollowedCelebrity) => {
    setUnfollowing(celeb.id);
    try {
      const res  = await fetch('/api/user/celebrities/follow', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ celebrityId: celeb.id }),
      });
      const json = await res.json();
      if (json.success && !json.following) {
        setCelebrities((prev) => prev.filter((c) => c.id !== celeb.id));
      }
    } finally { setUnfollowing(null); }
  };

  const handleRemoveOutfit = async (outfit: SavedOutfit) => {
    setRemoving(outfit._id);
    try {
      const apiBase = outfit._source === 'celebrity' ? '/api/celebrity-outfits' : '/api/user-outfits';
      const res  = await fetch(`${apiBase}/${outfit.slug}/interact`, {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'unfavourite' }),
      });
      const json = await res.json();
      if (json.success) setOutfits((prev) => prev.filter((o) => o._id !== outfit._id));
    } finally { setRemoving(null); }
  };

  return (
    <div className="space-y-8">

      {/* Tab selector */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab('celebrities')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'celebrities' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="UserGroupIcon" size={18} />
          Following
          {!celebLoading && <span className="ml-1 opacity-70">({celebrities.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('outfits')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'outfits' ? 'bg-primary text-black' : 'glass-card text-neutral-400 hover:text-white'
          }`}
        >
          <Icon name="SparklesIcon" size={18} />
          Saved Outfits
          {!outfitLoading && <span className="ml-1 opacity-70">({outfits.length})</span>}
        </button>
      </div>

      {/* ── Following celebrities ────────────────────────────────────────── */}
      {activeTab === 'celebrities' && (
        celebLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        ) : celebrities.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="UserGroupIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">Not following anyone yet</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Visit a celebrity profile and tap <strong className="text-white">Follow</strong> to add them here.
            </p>
            <Link
              href="/celebrity-profiles"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="SparklesIcon" size={16} /> Explore Celebrities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {celebrities.map((celeb) => (
              <div key={celeb.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all group">
                {/* Image */}
                <Link href={`/celebrity-profiles/${celeb.slug}`} className="block relative h-56 overflow-hidden">
                  {celeb.profileImage ? (
                    <AppImage
                      src={celeb.profileImage}
                      alt={celeb.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                      <Icon name="UserCircleIcon" size={56} className="text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Following badge */}
                  <div className="absolute top-3 right-3 bg-primary/20 border border-primary/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Icon name="HeartIcon" size={11} className="text-primary fill-primary" />
                    <span className="text-[10px] text-primary font-bold">Following</span>
                  </div>
                  {celeb.isVerified && (
                    <div className="absolute top-3 left-3 bg-blue-500/80 rounded-full p-1 backdrop-blur-sm">
                      <Icon name="CheckBadgeIcon" size={13} className="text-white" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <Link href={`/celebrity-profiles/${celeb.slug}`}>
                      <h3 className="font-playfair text-lg font-bold text-white hover:text-primary transition-colors leading-tight">
                        {celeb.name}
                      </h3>
                    </Link>
                    {celeb.occupation.length > 0 && (
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {celeb.occupation.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/celebrity-profiles/${celeb.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <Icon name="UserIcon" size={13} /> View Profile
                    </Link>
                    <button
                      onClick={() => handleUnfollow(celeb)}
                      disabled={unfollowing === celeb.id}
                      className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      title="Unfollow"
                    >
                      {unfollowing === celeb.id
                        ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Icon name="HeartIcon" size={13} className="fill-red-400" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Saved outfits ────────────────────────────────────────────────── */}
      {activeTab === 'outfits' && (
        outfitLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        ) : outfits.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Icon name="BookmarkIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No saved outfits yet</h3>
            <p className="text-neutral-400 text-sm mb-6">Tap the Save button on any outfit to bookmark it here.</p>
            <Link
              href="/fashion-gallery"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="SparklesIcon" size={16} /> Browse Fashion Gallery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {outfits.map((outfit) => {
              const isCeleb  = outfit._source === 'celebrity';
              const href     = isCeleb ? `/celebrity-outfits/${outfit.slug}` : `/user-outfits/${outfit.slug}`;
              const celebCredit = isCeleb
                ? (typeof outfit.celebrity === 'object' ? (outfit.celebrity as any)?.name : outfit.celebrity)
                : outfit.userId?.name;

              return (
                <div key={outfit._id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/30 transition-all group">
                  <Link href={href} className="block relative h-52 overflow-hidden">
                    <AppImage
                      src={outfit.images[0] || ''}
                      alt={outfit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Source badge */}
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                      isCeleb ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-white/70 border border-white/20'
                    }`}>
                      {isCeleb ? '⭐ Celebrity' : 'Community'}
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1"><Icon name="HeartIcon" size={12} />{outfit.likes.length}</span>
                      <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftIcon" size={12} />{outfit.comments.length}</span>
                    </div>
                  </Link>
                  <div className="p-4 space-y-3">
                    <div>
                      <Link href={href}>
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors mb-1">{outfit.title}</h3>
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {[outfit.event || outfit.category, outfit.brand, isCeleb ? outfit.price : outfit.purchasePrice ? `₹${outfit.purchasePrice.toLocaleString()}` : null]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {celebCredit && (
                      <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs text-neutral-500">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                          {isCeleb
                            ? <Icon name="StarIcon" size={10} className="text-black" />
                            : <span className="text-black font-bold text-[10px]">{String(celebCredit).charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <span className="truncate">{celebCredit}</span>
                        <span className="ml-auto">{new Date(outfit.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link href={href}
                        className="flex-1 flex items-center justify-center gap-1.5 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-xl text-xs font-medium transition-all">
                        <Icon name="EyeIcon" size={13} /> View
                      </Link>
                      <button
                        onClick={() => handleRemoveOutfit(outfit)}
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
              );
            })}
          </div>
        )
      )}
    </div>
  );
}


