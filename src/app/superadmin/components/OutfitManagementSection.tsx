"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types (match real MongoDB document)
// ─────────────────────────────────────────────────────────────────────────────

interface CelebrityRef {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
}

interface OutfitRow {
  id: string;
  title: string;
  slug: string;
  celebrity: CelebrityRef | string;
  images: string[];
  event?: string;
  designer?: string;
  brand?: string;
  category?: string;
  color?: string;
  price?: string;
  purchaseLink?: string;
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
}

interface OutfitFull extends OutfitRow {
  description?: string;
  size?: string;
  seo?: any;
}

type FormTab   = 'basic' | 'gallery' | 'meta';
type PanelMode = 'add' | 'edit' | null;
type Toast     = { type: 'success' | 'error'; message: string } | null;

const PAGE_SIZES = [10, 20, 50];

const EMPTY_FORM: OutfitFull = {
  id: '', title: '', slug: '', celebrity: '',
  images: [''], event: '', designer: '', brand: '', category: '',
  color: '', price: '', purchaseLink: '', size: '',
  description: '', tags: [], isActive: true, isFeatured: false,
  likesCount: 0, commentsCount: 0,
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info', icon: 'InformationCircleIcon' },
  { key: 'gallery', label: 'Images',     icon: 'PhotoIcon'             },
  { key: 'meta',    label: 'Details',    icon: 'TagIcon'               },
];

const splitLines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const joinLines  = (arr?: string[]) => (arr || []).join('\n');

function getCelebrityName(c: CelebrityRef | string | undefined): string {
  if (!c) return '—';
  if (typeof c === 'string') return c;
  return c.name || '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LabeledInput({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
        {label}{required && <span className="text-yellow-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function OutfitManagementSection() {
  const { authHeaders } = useAuth();

  // List
  const [outfits, setOutfits]         = useState<OutfitRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [limit, setLimit]             = useState(20);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Row actions
  const [busyMap, setBusyMap]           = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<OutfitRow | null>(null);
  const [toast, setToast]               = useState<Toast>(null);

  // Panel
  const [panelMode, setPanelMode]       = useState<PanelMode>(null);
  const [formTab, setFormTab]           = useState<FormTab>('basic');
  const [form, setForm]                 = useState<OutfitFull>(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState<Partial<Record<keyof OutfitFull, string>>>({});
  const [formLoading, setFormLoading]   = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // ─── helpers ────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };
  const setBusy = (id: string, v: boolean) => setBusyMap((p) => ({ ...p, [id]: v }));
  const setField = <K extends keyof OutfitFull>(k: K, v: OutfitFull[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ─── fetch ───────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 1, lim = limit) => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (searchQuery)  params.set('q', searchQuery);
      if (brandFilter)  params.set('brand', brandFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res  = await fetch(`/api/superadmin/outfits?${params}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setOutfits(data.data);
      setTotal(data.total);
      setPage(p);
      setLimit(lim);
      setPages(data.pages);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, searchQuery, brandFilter, categoryFilter, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // ─── open add ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setFormApiError('');
    setFormTab('basic'); setPanelMode('add');
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ─── open edit ───────────────────────────────────────────────────────────
  const openEdit = async (row: OutfitRow) => {
    setFormErrors({}); setFormApiError(''); setFormTab('basic');
    setPanelMode('edit'); setLoadingDetail(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res  = await fetch(`/api/superadmin/outfits/${row.id}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load outfit');
      const d: any = data.data;
      // celebrity may come back populated as { id, name, slug } or as raw ObjectId string
      const celebId = typeof d.celebrity === 'object'
        ? (d.celebrity?.id || d.celebrity?._id || '')
        : (d.celebrity || '');
      setForm({
        id:           d.id,
        title:        d.title         || '',
        slug:         d.slug          || '',
        celebrity:    celebId,
        images:       Array.isArray(d.images) && d.images.length ? d.images : [''],
        event:        d.event         || '',
        designer:     d.designer      || '',
        brand:        d.brand         || '',
        category:     d.category      || '',
        color:        d.color         || '',
        price:        d.price         || '',
        purchaseLink: d.purchaseLink  || '',
        size:         d.size          || '',
        description:  d.description   || '',
        tags:         d.tags          || [],
        isActive:     d.isActive      ?? true,
        isFeatured:   d.isFeatured    ?? false,
        likesCount:   d.likesCount    ?? 0,
        commentsCount: d.commentsCount ?? 0,
        seo:          d.seo           || undefined,
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load outfit details');
      setPanelMode(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => setPanelMode(null);

  // ─── validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof OutfitFull, string>> = {};
    if (!form.title.trim())      errs.title     = 'Title is required';
    if (!String(form.celebrity).trim()) errs.celebrity = 'Celebrity ID is required';
    const validImages = (form.images || []).filter(Boolean);
    if (validImages.length === 0) errs.images = 'At least one image URL is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── payload ─────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    title:        form.title.trim(),
    celebrity:    String(form.celebrity).trim(),
    images:       (form.images || []).filter(Boolean),
    event:        form.event?.trim()        || undefined,
    designer:     form.designer?.trim()     || undefined,
    description:  form.description?.trim()  || undefined,
    brand:        form.brand?.trim()        || undefined,
    category:     form.category?.trim()     || undefined,
    color:        form.color?.trim()        || undefined,
    price:        form.price?.trim()        || undefined,
    purchaseLink: form.purchaseLink?.trim() || undefined,
    size:         form.size?.trim()         || undefined,
    tags:         form.tags || [],
    isActive:     form.isActive,
    isFeatured:   form.isFeatured,
  });

  // ─── create ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/outfits', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create');
      closePanel();
      showToast('success', `"${form.title.trim()}" created successfully`);
      fetchList(1);
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to create outfit');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── update ──────────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch(`/api/superadmin/outfits/${form.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      closePanel();
      showToast('success', `"${form.title.trim()}" updated`);
      fetchList(page);
    } catch (err: any) {
      setFormApiError(err.message || 'Update failed');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (o: OutfitRow) => {
    setConfirmDelete(null); setBusy(o.id, true);
    try {
      const res  = await fetch(`/api/superadmin/outfits/${o.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setOutfits((prev) => prev.filter((x) => x.id !== o.id));
      setTotal((t) => t - 1);
      showToast('success', `"${o.title}" deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    } finally {
      setBusy(o.id, false);
    }
  };

  // ─── quick toggle isActive ───────────────────────────────────────────────
  const handleToggle = async (o: OutfitRow) => {
    setBusy(o.id, true);
    const newVal = !o.isActive;
    try {
      const res  = await fetch(`/api/superadmin/outfits/${o.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setOutfits((prev) => prev.map((x) => x.id === o.id ? { ...x, isActive: newVal } : x));
      showToast('success', `"${o.title}" ${newVal ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(o.id, false);
    }
  };

  // ─── image helpers ────────────────────────────────────────────────────────
  const addImageField    = () => setField('images', [...(form.images || []), '']);
  const removeImageField = (i: number) => setField('images', (form.images || []).filter((_, idx) => idx !== i));
  const updateImage      = (i: number, val: string) =>
    setField('images', (form.images || []).map((img, idx) => idx === i ? val : img));

  // ─── pagination ───────────────────────────────────────────────────────────
  const pageNumbers = (): (number | '...')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const arr: (number | '...')[] = [1];
    if (page > 3)         arr.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) arr.push(i);
    if (page < pages - 2) arr.push('...');
    arr.push(pages);
    return arr;
  };

  const skeletonRows = Array.from({ length: Math.min(limit, 8) });

  // ─────────────────────────────────────────────────────────────────────────
  // Form Tab Content
  // ─────────────────────────────────────────────────────────────────────────

  const errBorder = (field: keyof OutfitFull) =>
    formErrors[field] ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60';

  const renderFormTab = () => {
    switch (formTab) {

      // ── BASIC ──────────────────────────────────────────────────────────
      case 'basic': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Title <span className="text-yellow-400">*</span>
            </label>
            <input type="text" value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Ayushmann Khurrana's Karwa Chauth Kurta Look"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('title')}`}
            />
            {formErrors.title && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.title}</p>}
          </div>

          {/* Celebrity ID */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Celebrity ID (ObjectId) <span className="text-yellow-400">*</span>
            </label>
            <input type="text" value={String(form.celebrity)}
              onChange={(e) => setField('celebrity', e.target.value)}
              placeholder="MongoDB ObjectId of the celebrity"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('celebrity')}`}
            />
            {formErrors.celebrity && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.celebrity}</p>}
          </div>

          {/* Event */}
          <LabeledInput label="Event" value={form.event || ''} onChange={(v) => setField('event', v)} placeholder="e.g. Festival, Wedding, Premiere" />

          {/* Designer */}
          <LabeledInput label="Designer" value={form.designer || ''} onChange={(v) => setField('designer', v)} placeholder="e.g. Gopi Vaid" />

          {/* Brand */}
          <LabeledInput label="Brand" value={form.brand || ''} onChange={(v) => setField('brand', v)} placeholder="e.g. Gucci" />

          {/* Category */}
          <LabeledInput label="Category" value={form.category || ''} onChange={(v) => setField('category', v)} placeholder="e.g. Traditional Wear, Western Wear" />

          {/* Color */}
          <LabeledInput label="Color" value={form.color || ''} onChange={(v) => setField('color', v)} placeholder="e.g. Beige" />

          {/* Price */}
          <LabeledInput label="Price" value={form.price || ''} onChange={(v) => setField('price', v)} placeholder="e.g. ₹26,500" />

          {/* Purchase Link */}
          <div className="md:col-span-2">
            <LabeledInput label="Purchase Link" value={form.purchaseLink || ''} onChange={(v) => setField('purchaseLink', v)} type="url" placeholder="https://..." />
          </div>

          {/* Size */}
          <div className="md:col-span-2">
            <LabeledInput label="Size Availability" value={form.size || ''} onChange={(v) => setField('size', v)} placeholder="e.g. XS, S, M, L, XL, XXL" />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Description</label>
            <textarea value={form.description || ''} rows={5}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe the outfit in detail..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-montserrat text-neutral-300">Active</span>
              <button type="button" onClick={() => setField('isActive', !form.isActive)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.isActive ? 'bg-yellow-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-montserrat text-neutral-300">Featured</span>
              <button type="button" onClick={() => setField('isFeatured', !form.isFeatured)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.isFeatured ? 'bg-yellow-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isFeatured ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
      );

      // ── IMAGES (Gallery) ───────────────────────────────────────────────
      case 'gallery': return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-montserrat font-medium">Image Gallery</p>
              <p className="text-neutral-500 text-xs font-montserrat mt-0.5">First image is used as the primary thumbnail</p>
            </div>
            <button type="button" onClick={addImageField}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 font-montserrat text-sm font-medium transition-all"
            >
              <Icon name="PlusIcon" size={14} /> Add Image
            </button>
          </div>

          {formErrors.images && (
            <p className="text-red-400 text-xs font-montserrat">{formErrors.images}</p>
          )}

          {(form.images || []).length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
              <Icon name="PhotoIcon" size={32} className="mx-auto mb-2 text-neutral-700" />
              <p className="text-neutral-500 text-sm font-montserrat">No images yet</p>
              <button type="button" onClick={addImageField}
                className="mt-2 text-yellow-400 text-sm font-montserrat hover:underline">
                + Add first image
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(form.images || []).map((img, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1 font-montserrat">
                      {i === 0 ? 'Primary Image (thumbnail)' : `Image ${i + 1}`}
                    </label>
                    <input type="url" value={img}
                      onChange={(e) => updateImage(i, e.target.value)}
                      placeholder="https://firebasestorage.googleapis.com/..."
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                    />
                  </div>
                  {/* Preview */}
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 mt-5" />
                  )}
                  {(form.images || []).length > 1 && (
                    <button type="button" onClick={() => removeImageField(i)}
                      className="mt-6 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0">
                      <Icon name="TrashIcon" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );

      // ── META / DETAILS ─────────────────────────────────────────────────
      case 'meta': return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Tags (one per line)</label>
            <textarea
              value={joinLines(form.tags)}
              onChange={(v) => setField('tags', splitLines(v.target.value))}
              rows={6}
              placeholder={"Gopi Vaid kurta set\nceleb ethnic wear\nBeige kurta for men"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
            />
            <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(form.tags || []).length} tags</p>
          </div>

          {/* Stats (read-only) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-playfair text-red-400">{form.likesCount ?? 0}</p>
              <p className="text-neutral-500 text-xs font-montserrat mt-1">Likes</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-playfair text-blue-400">{form.commentsCount ?? 0}</p>
              <p className="text-neutral-500 text-xs font-montserrat mt-1">Comments</p>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          <Icon name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={20} />
          <span className="text-sm font-medium font-montserrat">{toast.message}</span>
        </div>
      )}

      {/* Stats */}
      {panelMode !== 'add' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',    value: total,                                             icon: 'ShoppingBagIcon',   color: 'text-yellow-400'  },
            { label: 'Active',   value: outfits.filter((o) => o.isActive).length,          icon: 'CheckBadgeIcon',    color: 'text-emerald-400' },
            { label: 'Featured', value: outfits.filter((o) => o.isFeatured).length,        icon: 'SparklesIcon',      color: 'text-purple-400'  },
            { label: 'This Page',value: outfits.length,                                    icon: 'RectangleGroupIcon', color: 'text-blue-400'   },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5">
              <Icon name={s.icon as any} size={20} className={s.color} />
              <p className="font-playfair text-3xl font-bold text-white mt-3">
                {loading ? <span className="block h-8 w-10 rounded bg-white/10 animate-pulse" /> : s.value}
              </p>
              <p className="text-neutral-400 text-sm font-montserrat mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
              placeholder="Search by title, designer, brand, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>
          <input
            type="text" value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
            placeholder="Filter by brand..."
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm w-full md:w-40"
          />
          <input
            type="text" value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
            placeholder="Filter by category..."
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm w-full md:w-44"
          />
          <select value={limit} onChange={(e) => fetchList(1, Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
          <button onClick={() => fetchList(page)} disabled={loading} title="Refresh"
            className="px-3 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <Icon name="ArrowPathIcon" size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {panelMode === 'add' ? (
            <button onClick={closePanel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 font-semibold font-montserrat text-sm hover:bg-white/20 transition-all"
            >
              <Icon name="ChevronLeftIcon" size={16} /> Back to List
            </button>
          ) : (
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all"
            >
              <Icon name="PlusIcon" size={16} /> Add Outfit
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {panelMode !== 'add' && fetchError && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/20 bg-red-500/10 flex items-center gap-3">
          <Icon name="ExclamationCircleIcon" size={18} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm font-montserrat flex-1">{fetchError}</p>
          <button onClick={() => fetchList(1)} className="text-xs text-yellow-400 hover:underline font-montserrat">Retry</button>
        </div>
      )}

      {/* ── Inline Panel ── */}
      {panelMode && (
        <div ref={panelRef} className="glass-card rounded-2xl border border-yellow-500/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Icon name={panelMode === 'add' ? 'PlusCircleIcon' : 'PencilSquareIcon'} size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-white">
                  {panelMode === 'add' ? 'Add New Outfit' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in outfit details across tabs' : 'Update outfit details'}
                </p>
              </div>
            </div>
            <button onClick={closePanel} className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Icon name="ArrowPathIcon" size={24} className="text-yellow-400 animate-spin" />
              <span className="text-neutral-400 font-montserrat text-sm">Loading outfit details...</span>
            </div>
          ) : (
            <form onSubmit={panelMode === 'add' ? handleCreate : handleUpdate}>
              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-5 pb-1 overflow-x-auto border-b border-white/10">
                {TABS.map((t) => (
                  <button key={t.key} type="button" onClick={() => setFormTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium font-montserrat whitespace-nowrap transition-all ${
                      formTab === t.key ? 'bg-yellow-500 text-black' : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon name={t.icon as any} size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="px-6 py-5 min-h-[360px]">
                {formApiError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-montserrat text-center">{formApiError}</p>
                  </div>
                )}
                {renderFormTab()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10">
                <p className="text-neutral-600 text-xs font-montserrat">* Required fields</p>
                <div className="flex gap-3">
                  <button type="button" onClick={closePanel}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {formLoading
                      ? (panelMode === 'add' ? 'Creating...' : 'Saving...')
                      : (panelMode === 'add' ? 'Create Outfit' : 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table */}
      {panelMode !== 'add' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-playfair text-xl font-bold text-white">Celebrity Outfits</h3>
            {!loading && (
              <span className="text-neutral-400 text-sm font-montserrat">
                {total > 0 ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}` : '0 results'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Outfit', 'Celebrity', 'Brand / Category', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[200, 140, 120, 70, 80, 80].map((w, j) => (
                          <td key={j} className="py-3.5 px-3">
                            <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : outfits.map((o) => (
                      <tr key={o.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${busyMap[o.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Outfit */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {o.images && o.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.images[0]} alt={o.title} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Icon name="ShoppingBagIcon" size={18} className="text-yellow-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium font-montserrat text-sm leading-tight line-clamp-1 max-w-[220px]">{o.title}</p>
                              {o.event && <p className="text-neutral-600 text-xs font-montserrat">{o.event}</p>}
                              {o.images && o.images.length > 1 && (
                                <p className="text-neutral-600 text-xs font-montserrat">{o.images.length} images</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Celebrity */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-300 text-sm font-montserrat">{getCelebrityName(o.celebrity)}</p>
                          {o.designer && <p className="text-neutral-600 text-xs font-montserrat">by {o.designer}</p>}
                        </td>
                        {/* Brand / Category */}
                        <td className="py-3.5 px-3">
                          {o.brand && <p className="text-neutral-300 text-sm font-montserrat">{o.brand}</p>}
                          {o.category && <p className="text-neutral-500 text-xs font-montserrat">{o.category}</p>}
                          {!o.brand && !o.category && <span className="text-neutral-600 text-xs font-montserrat">—</span>}
                        </td>
                        {/* Price */}
                        <td className="py-3.5 px-3">
                          <span className="text-yellow-400 font-bold font-montserrat text-sm">{o.price || '—'}</span>
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleToggle(o)} title={o.isActive ? 'Deactivate' : 'Activate'}
                              className={`w-10 h-5 rounded-full transition-all relative ${o.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${o.isActive ? 'left-5' : 'left-0.5'}`} />
                            </button>
                            {o.isFeatured && (
                              <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-montserrat">
                                <Icon name="SparklesIcon" size={10} /> Featured
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(o)} title="Edit"
                              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                              <Icon name="PencilSquareIcon" size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(o)} title="Delete"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Icon name="TrashIcon" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {!loading && !fetchError && outfits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Icon name="ShoppingBagIcon" size={40} className="mx-auto mb-3 text-neutral-700" />
                      <p className="text-neutral-500 font-montserrat text-sm">No outfits found</p>
                      <button onClick={openAdd} className="mt-3 text-yellow-400 text-sm font-montserrat hover:underline">
                        + Add the first outfit
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-white/10">
              <p className="text-neutral-500 text-xs font-montserrat order-2 sm:order-1">
                Page {page} of {pages} &middot; {total} total
              </p>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button onClick={() => fetchList(1)} disabled={page <= 1 || loading}
                  className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                  <Icon name="ChevronDoubleLeftIcon" size={14} />
                </button>
                <button onClick={() => fetchList(page - 1)} disabled={page <= 1 || loading}
                  className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                  <Icon name="ChevronLeftIcon" size={14} />
                </button>
                {pageNumbers().map((n, i) =>
                  n === '...'
                    ? <span key={`d${i}`} className="px-1.5 text-neutral-600 font-montserrat text-sm">…</span>
                    : (
                      <button key={n} onClick={() => fetchList(n as number)} disabled={loading}
                        className={`w-8 h-8 rounded-lg text-sm font-medium font-montserrat transition-all ${n === page ? 'bg-yellow-500 text-black' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}`}>
                        {n}
                      </button>
                    )
                )}
                <button onClick={() => fetchList(page + 1)} disabled={page >= pages || loading}
                  className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                  <Icon name="ChevronRightIcon" size={14} />
                </button>
                <button onClick={() => fetchList(pages)} disabled={page >= pages || loading}
                  className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                  <Icon name="ChevronDoubleRightIcon" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-5 border border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Icon name="ExclamationTriangleIcon" size={26} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-white">Delete Outfit</h3>
                <p className="text-neutral-400 text-sm font-montserrat mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-neutral-300 font-montserrat text-sm leading-relaxed">
              Permanently delete{' '}
              <span className="text-white font-semibold">"{confirmDelete.title}"</span>?
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-montserrat text-sm font-medium transition-all border border-red-500/20">
                Delete Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
