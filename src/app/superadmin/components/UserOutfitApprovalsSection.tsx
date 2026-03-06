"use client";

import { useState, useEffect, useCallback } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface UserOutfitRow {
  _id: string;
  title: string;
  slug: string;
  category: string;
  brand?: string;
  color?: string;
  size?: string;
  purchasePrice?: number;
  store?: string;
  images: string[];
  views: number;
  likes: string[];
  isPublished: boolean;
  isApproved: boolean;
  createdAt: string;
  userId?: { _id: string; name: string; email: string; avatar?: string };
}

interface Counts { pending: number; approved: number; draft: number }

type TabType = 'all' | 'pending' | 'approved' | 'draft';

export default function UserOutfitApprovalsSection() {
  const { authHeaders } = useAuth();

  const [outfits, setOutfits]   = useState<UserOutfitRow[]>([]);
  const [counts, setCounts]     = useState<Counts>({ pending: 0, approved: 0, draft: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<TabType>('all');
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  // Preview modal
  const [preview, setPreview]   = useState<UserOutfitRow | null>(null);

  const fetchOutfits = useCallback(async (p = page, t = tab, q = search) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', status: t });
      if (q) params.set('q', q);
      const res  = await fetch(`/api/superadmin/user-outfits?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      setOutfits(json.outfits);
      setCounts(json.counts);
      setPage(json.page);
      setPages(json.pages);
      setTotal(json.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, page, tab, search]);

  useEffect(() => { fetchOutfits(1, tab, search); }, [tab]); // eslint-disable-line

  const doAction = async (id: string, action: 'approve' | 'reject' | 'publish' | 'unpublish') => {
    setActioning(id + action);
    try {
      const res  = await fetch(`/api/superadmin/user-outfits/${id}`, {
        method:  'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      await fetchOutfits(page, tab, search);
      if (preview?._id === id) setPreview(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActioning(null);
    }
  };

  const tabs: { id: TabType; label: string; count?: number; color: string }[] = [
    { id: 'all',      label: 'All',      count: counts.pending + counts.approved + counts.draft, color: 'text-white' },
    { id: 'pending',  label: 'Pending',  count: counts.pending,  color: 'text-yellow-400' },
    { id: 'approved', label: 'Approved', count: counts.approved, color: 'text-green-400'  },
    { id: 'draft',    label: 'Draft',    count: counts.draft,    color: 'text-neutral-400' },
  ];

  const statusBadge = (o: UserOutfitRow) => {
    if (o.isApproved && o.isPublished)  return { label: 'Approved', cls: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (o.isPublished && !o.isApproved) return { label: 'Pending',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Draft', cls: 'bg-neutral-700/20 text-neutral-400 border-neutral-600/30' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-white mb-1">User Outfit Approvals</h2>
          <p className="text-neutral-400 text-sm">Review and approve fashion items submitted by users</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-sm font-medium">{counts.pending} awaiting review</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-yellow-500/10 border-b-2 border-yellow-500 text-yellow-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${t.color}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Search outfits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOutfits(1, tab, search)}
            className="glass-card px-4 py-2 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 bg-transparent w-48"
          />
          <button
            onClick={() => fetchOutfits(1, tab, search)}
            className="glass-card p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Icon name="MagnifyingGlassIcon" size={16} className="text-neutral-400" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && outfits.length === 0 && (
        <div className="glass-card rounded-3xl p-16 text-center">
          <Icon name="CheckCircleIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
          <h3 className="font-playfair text-xl text-white mb-2">
            {tab === 'pending' ? 'No outfits pending review' : 'No outfits found'}
          </h3>
          <p className="text-neutral-400 text-sm">
            {tab === 'pending' ? 'All caught up! New submissions will appear here.' : 'Try a different filter or search.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && outfits.length > 0 && (
        <>
          <p className="text-xs text-neutral-500">{total} outfit{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {outfits.map((outfit) => {
              const badge   = statusBadge(outfit);
              const isActing = actioning?.startsWith(outfit._id);
              return (
                <div key={outfit._id} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/30 transition-all">
                  {/* Image */}
                  <div
                    className="relative h-52 cursor-pointer group"
                    onClick={() => setPreview(outfit)}
                  >
                    <AppImage
                      src={outfit.images[0] || ''}
                      alt={outfit.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium glass-card px-3 py-1.5 rounded-full">Preview</span>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Image count */}
                    {outfit.images.length > 1 && (
                      <span className="absolute top-3 right-3 glass-card text-xs text-white px-2 py-1 rounded-full flex items-center gap-1">
                        <Icon name="PhotoIcon" size={11} /> {outfit.images.length}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1">{outfit.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="capitalize">{outfit.category}</span>
                        {outfit.brand && <><span>·</span><span>{outfit.brand}</span></>}
                        {outfit.purchasePrice && <><span>·</span><span className="text-primary">₹{outfit.purchasePrice.toLocaleString()}</span></>}
                      </div>
                    </div>

                    {/* Uploader */}
                    {outfit.userId && (
                      <div className="flex items-center gap-2 py-2 border-t border-b border-white/5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                          <span className="text-black text-xs font-bold">{outfit.userId.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-white text-xs font-medium truncate">{outfit.userId.name}</p>
                          <p className="text-neutral-500 text-xs truncate">{outfit.userId.email}</p>
                        </div>
                        <span className="ml-auto text-xs text-neutral-500">{new Date(outfit.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Icon name="EyeIcon" size={12} />{outfit.views}</span>
                      <span className="flex items-center gap-1"><Icon name="HeartIcon" size={12} />{outfit.likes.length}</span>
                      <Link
                        href={`/user-outfits/${outfit.slug}`}
                        target="_blank"
                        className="ml-auto text-neutral-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                      </Link>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      {!outfit.isApproved ? (
                        <button
                          onClick={() => doAction(outfit._id, 'approve')}
                          disabled={!!isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                        >
                          {isActing && actioning === outfit._id + 'approve'
                            ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                            : <Icon name="CheckIcon" size={14} />
                          }
                          Approve & Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => doAction(outfit._id, 'unpublish')}
                          disabled={!!isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-700/30 hover:bg-neutral-700/50 text-neutral-400 border border-neutral-600/30 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <Icon name="EyeSlashIcon" size={14} />
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => doAction(outfit._id, 'reject')}
                        disabled={!!isActing}
                        className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {isActing && actioning === outfit._id + 'reject'
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Icon name="XMarkIcon" size={14} />
                        }
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchOutfits(page - 1, tab, search); }}
                className="px-4 py-2 glass-card rounded-full text-sm text-neutral-400 hover:text-white disabled:opacity-30 transition-all">← Prev</button>
              <span className="text-neutral-400 text-sm">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => { setPage(page + 1); fetchOutfits(page + 1, tab, search); }}
                className="px-4 py-2 glass-card rounded-full text-sm text-neutral-400 hover:text-white disabled:opacity-30 transition-all">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg my-8 space-y-5">
            <div className="flex items-start justify-between">
              <h3 className="font-playfair text-xl font-bold text-white leading-tight pr-4">{preview.title}</h3>
              <button onClick={() => setPreview(null)} className="glass-card p-2 rounded-full hover:bg-error/20 transition-colors shrink-0">
                <Icon name="XMarkIcon" size={18} className="text-white" />
              </button>
            </div>

            {/* Images */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {preview.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-48 w-auto rounded-2xl object-cover shrink-0" />
              ))}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Category', preview.category],
                ['Brand', preview.brand],
                ['Color', preview.color],
                ['Size', preview.size],
                ['Price', preview.purchasePrice ? `₹${preview.purchasePrice.toLocaleString()}` : undefined],
                ['Store', preview.store],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="glass-card rounded-xl p-3">
                  <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-medium capitalize">{value}</p>
                </div>
              ))}
            </div>

            {preview.userId && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <span className="text-black font-bold text-sm">{preview.userId.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{preview.userId.name}</p>
                  <p className="text-neutral-400 text-xs">{preview.userId.email}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!preview.isApproved ? (
                <button
                  onClick={() => doAction(preview._id, 'approve')}
                  disabled={!!actioning}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <Icon name="CheckIcon" size={16} /> Approve & Publish
                </button>
              ) : (
                <button
                  onClick={() => doAction(preview._id, 'unpublish')}
                  disabled={!!actioning}
                  className="flex-1 flex items-center justify-center gap-2 glass-card text-neutral-300 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50"
                >
                  <Icon name="EyeSlashIcon" size={16} /> Unpublish
                </button>
              )}
              <button
                onClick={() => doAction(preview._id, 'reject')}
                disabled={!!actioning}
                className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-5 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50"
              >
                <Icon name="XMarkIcon" size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
