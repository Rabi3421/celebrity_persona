'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ICastMember {
  name: string;
  role?: string;
  character?: string;
  image?: string;
}

interface ITicketLink {
  platform: string;
  url: string;
  available: boolean;
}

interface IMovieSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  director?: string;
  status?: string;
  language?: string;
  releaseDate?: string;
  poster?: string;
  featured: boolean;
  worldwide?: boolean;
  duration?: number;
  genre?: string[];
  createdAt?: string;
}

interface MovieFull extends MovieRow {
  backdrop?: string;
  originalLanguage?: string;
  synopsis?: string;
  plotSummary?: string;
  productionNotes?: string;
  studio?: string;
  trailer?: string;
  mpaaRating?: string;
  anticipationScore?: number;
  budget?: number;
  boxOfficeProjection?: number;
  preOrderAvailable?: boolean;
  cast?: ICastMember[];
  writers?: string[];
  producers?: string[];
  regions?: string[];
  subtitles?: string[];
  images?: string[];
  ticketLinks?: ITicketLink[];
  seoData?: IMovieSEO;
}

type FormTab = 'basic' | 'cast' | 'details';
type PanelMode = 'add' | 'edit' | null;
type Toast = { type: 'success' | 'error'; message: string } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info', icon: 'FilmIcon'   },
  { key: 'cast',    label: 'Cast',       icon: 'UsersIcon'  },
  { key: 'details', label: 'Details',    icon: 'TagIcon'    },
];

const EMPTY_FORM: MovieFull = {
  id: '',
  title: '',
  slug: '',
  director: '',
  status: '',
  language: '',
  originalLanguage: '',
  synopsis: '',
  plotSummary: '',
  productionNotes: '',
  studio: '',
  trailer: '',
  poster: '',
  backdrop: '',
  mpaaRating: '',
  featured: false,
  worldwide: false,
  preOrderAvailable: false,
  anticipationScore: undefined,
  duration: undefined,
  budget: undefined,
  boxOfficeProjection: undefined,
  releaseDate: '',
  cast: [],
  genre: [],
  regions: [],
  subtitles: [],
  images: [],
  writers: [],
  producers: [],
  ticketLinks: [],
  seoData: { metaTitle: '', metaDescription: '', keywords: [] },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function joinLines(arr?: string[]): string {
  return (arr || []).join('\n');
}

function splitLines(s: string): string[] {
  return s.split('\n').map((l) => l.trim()).filter(Boolean);
}

function formatDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInputValue(d?: string | Date): string {
  if (!d) return '';
  const date = new Date(d as string);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MovieManagementSection() {
  const { authHeaders } = useAuth();

  // List state
  const [movies, setMovies]       = useState<MovieRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [limit, setLimit]         = useState(20);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Row actions
  const [busyMap, setBusyMap]         = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<MovieRow | null>(null);
  const [toast, setToast]             = useState<Toast>(null);

  // Panel
  const [panelMode, setPanelMode]     = useState<PanelMode>(null);
  const [formTab, setFormTab]         = useState<FormTab>('basic');
  const [form, setForm]               = useState<MovieFull>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Partial<Record<keyof MovieFull, string>>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setBusy = (id: string, v: boolean) =>
    setBusyMap((p) => ({ ...p, [id]: v }));

  const setField = <K extends keyof MovieFull>(key: K, value: MovieFull[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  // ── fetch ──────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 1, lim = limit) => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (statusFilter.trim()) params.set('status', statusFilter.trim());
      const res  = await fetch(`/api/superadmin/movies?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      const rows: MovieRow[] = (data.data || []).map((m: any) => ({
        id:          m._id || m.id,
        title:       m.title,
        slug:        m.slug,
        director:    m.director,
        status:      m.status,
        language:    m.language,
        releaseDate: m.releaseDate,
        poster:      m.poster,
        featured:    m.featured    ?? false,
        worldwide:   m.worldwide   ?? false,
        duration:    m.duration,
        genre:       m.genre,
        createdAt:   m.createdAt,
      }));
      setMovies(rows);
      setTotal(data.total);
      setPage(p);
      setLimit(lim);
      setPages(data.pages);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, searchQuery, statusFilter, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // ── open add ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setFormApiError('');
    setFormTab('basic'); setPanelMode('add');
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── open edit ───────────────────────────────────────────────────────────
  const openEdit = async (row: MovieRow) => {
    setFormErrors({}); setFormApiError(''); setFormTab('basic');
    setPanelMode('edit'); setLoadingDetail(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res  = await fetch(`/api/superadmin/movies/${row.id}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      const d: any = data.data;
      setForm({
        id:                  d._id || d.id,
        title:               d.title               || '',
        slug:                d.slug                || '',
        director:            d.director            || '',
        status:              d.status              || '',
        language:            d.language            || '',
        originalLanguage:    d.originalLanguage    || '',
        synopsis:            d.synopsis            || '',
        plotSummary:         d.plotSummary         || '',
        productionNotes:     d.productionNotes     || '',
        studio:              d.studio              || '',
        trailer:             d.trailer             || '',
        poster:              d.poster              || '',
        backdrop:            d.backdrop            || '',
        mpaaRating:          d.mpaaRating          || '',
        featured:            d.featured            ?? false,
        worldwide:           d.worldwide           ?? false,
        preOrderAvailable:   d.preOrderAvailable   ?? false,
        anticipationScore:   d.anticipationScore   ?? undefined,
        duration:            d.duration            ?? undefined,
        budget:              d.budget              ?? undefined,
        boxOfficeProjection: d.boxOfficeProjection ?? undefined,
        releaseDate:         toDateInputValue(d.releaseDate),
        cast:                d.cast                || [],
        genre:               d.genre               || [],
        regions:             d.regions             || [],
        subtitles:           d.subtitles           || [],
        images:              d.images              || [],
        writers:             d.writers             || [],
        producers:           d.producers           || [],
        ticketLinks:         d.ticketLinks         || [],
        seoData:             d.seoData             || { metaTitle: '', metaDescription: '', keywords: [] },
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load movie');
      setPanelMode(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => setPanelMode(null);

  // ── validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof MovieFull, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── payload ──────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    title:               form.title.trim(),
    slug:                form.slug?.trim()               || undefined,
    director:            form.director?.trim()           || undefined,
    status:              form.status?.trim()             || undefined,
    language:            form.language?.trim()           || undefined,
    originalLanguage:    form.originalLanguage?.trim()   || undefined,
    synopsis:            form.synopsis?.trim()           || undefined,
    plotSummary:         form.plotSummary?.trim()        || undefined,
    productionNotes:     form.productionNotes?.trim()    || undefined,
    studio:              form.studio?.trim()             || undefined,
    trailer:             form.trailer?.trim()            || undefined,
    poster:              form.poster?.trim()             || undefined,
    backdrop:            form.backdrop?.trim()           || undefined,
    mpaaRating:          form.mpaaRating?.trim()         || undefined,
    featured:            form.featured,
    worldwide:           form.worldwide,
    preOrderAvailable:   form.preOrderAvailable,
    anticipationScore:   form.anticipationScore          ?? undefined,
    duration:            form.duration                   ?? undefined,
    budget:              form.budget                     ?? undefined,
    boxOfficeProjection: form.boxOfficeProjection        ?? undefined,
    releaseDate:         form.releaseDate                || undefined,
    cast:                form.cast                       || [],
    genre:               form.genre                      || [],
    regions:             form.regions                    || [],
    subtitles:           form.subtitles                  || [],
    writers:             form.writers                    || [],
    producers:           form.producers                  || [],
    ticketLinks:         form.ticketLinks                || [],
    seoData:             form.seoData,
  });

  // ── create ───────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/movies', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');
      closePanel();
      showToast('success', `"${form.title.trim()}" created`);
      fetchList(1);
    } catch (err: any) {
      setFormApiError(err.message || 'Create failed');
    } finally {
      setFormLoading(false);
    }
  };

  // ── update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch(`/api/superadmin/movies/${form.id}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
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

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (m: MovieRow) => {
    setConfirmDelete(null); setBusy(m.id, true);
    try {
      const res  = await fetch(`/api/superadmin/movies/${m.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setMovies((prev) => prev.filter((x) => x.id !== m.id));
      setTotal((t) => t - 1);
      showToast('success', `"${m.title}" deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    } finally {
      setBusy(m.id, false);
    }
  };

  // ── quick toggle featured ─────────────────────────────────────────────────
  const handleToggleFeatured = async (m: MovieRow) => {
    setBusy(m.id, true);
    const newVal = !m.featured;
    try {
      const res  = await fetch(`/api/superadmin/movies/${m.id}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ featured: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setMovies((prev) => prev.map((x) => x.id === m.id ? { ...x, featured: newVal } : x));
      showToast('success', `"${m.title}" ${newVal ? 'featured' : 'unfeatured'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(m.id, false);
    }
  };

  // ── cast helpers ──────────────────────────────────────────────────────────
  const addCastMember = () =>
    setField('cast', [...(form.cast || []), { name: '', role: '', character: '', image: '' }]);

  const updateCast = (i: number, key: keyof ICastMember, val: string) =>
    setField('cast', (form.cast || []).map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const removeCast = (i: number) =>
    setField('cast', (form.cast || []).filter((_, idx) => idx !== i));

  // ── ticket link helpers ───────────────────────────────────────────────────
  const addTicketLink = () =>
    setField('ticketLinks', [...(form.ticketLinks || []), { platform: '', url: '', available: true }]);

  const updateTicketLink = (i: number, key: keyof ITicketLink, val: string | boolean) =>
    setField('ticketLinks', (form.ticketLinks || []).map((t, idx) => idx === i ? { ...t, [key]: val } : t));

  const removeTicketLink = (i: number) =>
    setField('ticketLinks', (form.ticketLinks || []).filter((_, idx) => idx !== i));

  // ── pagination ────────────────────────────────────────────────────────────
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

  const errBorder = (field: keyof MovieFull) =>
    formErrors[field] ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60';

  // ─────────────────────────────────────────────────────────────────────────
  // Form Tab Content
  // ─────────────────────────────────────────────────────────────────────────

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
              placeholder="e.g. Kalki 2898 AD"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('title')}`}
            />
            {formErrors.title && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Slug</label>
            <input type="text" value={form.slug || ''}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="kalki-2898-ad"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Director */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Director</label>
            <input type="text" value={form.director || ''}
              onChange={(e) => setField('director', e.target.value)}
              placeholder="e.g. Nag Ashwin"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Status</label>
            <input type="text" value={form.status || ''}
              onChange={(e) => setField('status', e.target.value)}
              placeholder="e.g. upcoming, released, filming"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Language</label>
            <input type="text" value={form.language || ''}
              onChange={(e) => setField('language', e.target.value)}
              placeholder="e.g. Telugu, Hindi"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Release Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Release Date</label>
            <input type="date" value={form.releaseDate || ''}
              onChange={(e) => setField('releaseDate', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Duration (mins)</label>
            <input type="number" value={form.duration ?? ''}
              onChange={(e) => setField('duration', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 165"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* MPAA Rating */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">MPAA Rating</label>
            <input type="text" value={form.mpaaRating || ''}
              onChange={(e) => setField('mpaaRating', e.target.value)}
              placeholder="e.g. PG-13, R, U/A"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Poster */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Poster URL</label>
            <div className="flex gap-3 items-start">
              <input type="url" value={form.poster || ''}
                onChange={(e) => setField('poster', e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              />
              {form.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.poster} alt="" className="w-12 h-16 rounded-xl object-cover border border-white/10 shrink-0" />
              )}
            </div>
          </div>

          {/* Backdrop */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Backdrop URL</label>
            <div className="flex gap-3 items-start">
              <input type="url" value={form.backdrop || ''}
                onChange={(e) => setField('backdrop', e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              />
              {form.backdrop && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.backdrop} alt="" className="w-24 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
              )}
            </div>
          </div>

          {/* Synopsis */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Synopsis</label>
            <textarea value={form.synopsis || ''} rows={3}
              onChange={(e) => setField('synopsis', e.target.value)}
              placeholder="Brief movie overview..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Plot Summary */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Plot Summary</label>
            <textarea value={form.plotSummary || ''} rows={3}
              onChange={(e) => setField('plotSummary', e.target.value)}
              placeholder="Detailed plot description..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6">
            {(['featured', 'worldwide', 'preOrderAvailable'] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-montserrat text-neutral-300">
                  {key === 'preOrderAvailable' ? 'Pre-Order' : key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <button type="button" onClick={() => setField(key, !form[key])}
                  className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form[key] ? 'bg-yellow-500' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[key] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>
            ))}
          </div>

          {/* SEO */}
          <div className="md:col-span-2 space-y-3 pt-2 border-t border-white/10">
            <p className="text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">SEO Data</p>
            <input type="text" value={form.seoData?.metaTitle || ''}
              onChange={(e) => setField('seoData', { ...form.seoData, metaTitle: e.target.value })}
              placeholder="SEO Meta Title"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
            <textarea value={form.seoData?.metaDescription || ''} rows={2}
              onChange={(e) => setField('seoData', { ...form.seoData, metaDescription: e.target.value })}
              placeholder="SEO Meta Description"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
            <textarea
              value={joinLines(form.seoData?.keywords)} rows={2}
              onChange={(e) => setField('seoData', { ...form.seoData, keywords: splitLines(e.target.value) })}
              placeholder={"kalki 2898\nprabhas movie\nbollywood sci-fi"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>
        </div>
      );

      // ── CAST ───────────────────────────────────────────────────────────
      case 'cast': return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-montserrat text-neutral-300">
              {(form.cast || []).length} cast member{(form.cast || []).length !== 1 ? 's' : ''}
            </p>
            <button type="button" onClick={addCastMember}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-sm font-montserrat transition-all"
            >
              <Icon name="PlusIcon" size={13} /> Add Member
            </button>
          </div>

          {(form.cast || []).length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <Icon name="UsersIcon" size={36} className="text-neutral-700" />
              <p className="text-neutral-500 font-montserrat text-sm">No cast members yet</p>
              <button type="button" onClick={addCastMember}
                className="text-yellow-400 text-sm font-montserrat hover:underline"
              >+ Add first cast member</button>
            </div>
          ) : (
            <div className="space-y-3">
              {(form.cast || []).map((member, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 relative">
                  <button type="button" onClick={() => removeCast(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Icon name="XMarkIcon" size={12} />
                  </button>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Name *</label>
                    <input type="text" value={member.name}
                      onChange={(e) => updateCast(i, 'name', e.target.value)}
                      placeholder="Actor name"
                      className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Role</label>
                    <input type="text" value={member.role || ''}
                      onChange={(e) => updateCast(i, 'role', e.target.value)}
                      placeholder="Lead / Supporting"
                      className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Character</label>
                    <input type="text" value={member.character || ''}
                      onChange={(e) => updateCast(i, 'character', e.target.value)}
                      placeholder="Character name"
                      className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Image URL</label>
                    <input type="url" value={member.image || ''}
                      onChange={(e) => updateCast(i, 'image', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      // ── DETAILS ────────────────────────────────────────────────────────
      case 'details': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Studio */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Studio</label>
            <input type="text" value={form.studio || ''}
              onChange={(e) => setField('studio', e.target.value)}
              placeholder="e.g. Hombale Films"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Trailer */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Trailer URL</label>
            <input type="url" value={form.trailer || ''}
              onChange={(e) => setField('trailer', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Budget (₹ Crore)</label>
            <input type="number" value={form.budget ?? ''}
              onChange={(e) => setField('budget', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 600"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Box Office Projection */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Box Office Projection (₹ Crore)</label>
            <input type="number" value={form.boxOfficeProjection ?? ''}
              onChange={(e) => setField('boxOfficeProjection', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 1200"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Anticipation Score */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Anticipation Score (0–10)</label>
            <input type="number" min="0" max="10" step="0.1" value={form.anticipationScore ?? ''}
              onChange={(e) => setField('anticipationScore', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 9.2"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Original Language */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Original Language</label>
            <input type="text" value={form.originalLanguage || ''}
              onChange={(e) => setField('originalLanguage', e.target.value)}
              placeholder="e.g. Telugu"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Genre (one per line)</label>
            <textarea value={joinLines(form.genre)} rows={4}
              onChange={(e) => setField('genre', splitLines(e.target.value))}
              placeholder={"Action\nSci-Fi\nAdventure"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Regions */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Regions (one per line)</label>
            <textarea value={joinLines(form.regions)} rows={4}
              onChange={(e) => setField('regions', splitLines(e.target.value))}
              placeholder={"India\nUS\nUK"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Writers */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Writers (one per line)</label>
            <textarea value={joinLines(form.writers)} rows={3}
              onChange={(e) => setField('writers', splitLines(e.target.value))}
              placeholder={"Nag Ashwin\nAbhijeet Kumar"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Producers */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Producers (one per line)</label>
            <textarea value={joinLines(form.producers)} rows={3}
              onChange={(e) => setField('producers', splitLines(e.target.value))}
              placeholder={"Vijay Kiragandur"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Subtitles */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Subtitles (one per line)</label>
            <textarea value={joinLines(form.subtitles)} rows={3}
              onChange={(e) => setField('subtitles', splitLines(e.target.value))}
              placeholder={"English\nHindi\nTamil"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Production Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Production Notes</label>
            <textarea value={form.productionNotes || ''} rows={3}
              onChange={(e) => setField('productionNotes', e.target.value)}
              placeholder="Any additional production information..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Ticket Links */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Ticket Links</label>
              <button type="button" onClick={addTicketLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-sm font-montserrat transition-all"
              >
                <Icon name="PlusIcon" size={13} /> Add Link
              </button>
            </div>
            {(form.ticketLinks || []).map((link, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <input type="text" value={link.platform}
                  onChange={(e) => updateTicketLink(i, 'platform', e.target.value)}
                  placeholder="BookMyShow"
                  className="col-span-1 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                />
                <input type="url" value={link.url}
                  onChange={(e) => updateTicketLink(i, 'url', e.target.value)}
                  placeholder="https://..."
                  className="col-span-3 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                />
                <div className="flex items-center justify-between gap-1">
                  <button type="button" onClick={() => updateTicketLink(i, 'available', !link.available)}
                    className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${link.available ? 'bg-yellow-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${link.available ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <button type="button" onClick={() => removeTicketLink(i)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Icon name="XMarkIcon" size={12} />
                  </button>
                </div>
              </div>
            ))}
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
            { label: 'Total',     value: total,                                          icon: 'FilmIcon',           color: 'text-yellow-400'  },
            { label: 'Featured',  value: movies.filter((m) => m.featured).length,        icon: 'SparklesIcon',       color: 'text-purple-400'  },
            { label: 'This Page', value: movies.length,                                  icon: 'RectangleGroupIcon', color: 'text-blue-400'    },
            { label: 'Pages',     value: pages,                                           icon: 'BookOpenIcon',       color: 'text-emerald-400' },
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
              placeholder="Search by title, director..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>
          <input
            type="text" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
            placeholder="Filter by status..."
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
              <Icon name="PlusIcon" size={16} /> Add Movie
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
                  {panelMode === 'add' ? 'Add Movie' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in movie details across tabs' : 'Update movie details'}
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
              <span className="text-neutral-400 font-montserrat text-sm">Loading movie...</span>
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
                      : (panelMode === 'add' ? 'Create Movie' : 'Save Changes')}
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
            <h3 className="font-playfair text-xl font-bold text-white">Upcoming Movies</h3>
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
                  {['Movie', 'Director', 'Status', 'Release Date', 'Featured', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[220, 130, 100, 90, 60, 70].map((w, j) => (
                          <td key={j} className="py-3.5 px-3">
                            <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : movies.map((m) => (
                      <tr key={m.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${busyMap[m.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Movie */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {m.poster ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.poster} alt={m.title} className="w-9 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                            ) : (
                              <div className="w-9 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Icon name="FilmIcon" size={14} className="text-yellow-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium font-montserrat text-sm leading-tight line-clamp-1 max-w-[240px]">{m.title}</p>
                              <p className="text-neutral-600 text-xs font-montserrat mt-0.5">
                                {m.language || '—'}{m.duration ? ` · ${m.duration} min` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Director */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-300 text-sm font-montserrat">{m.director || '—'}</p>
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {m.status
                            ? <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-montserrat capitalize">{m.status}</span>
                            : <span className="text-neutral-600 text-xs font-montserrat">—</span>
                          }
                        </td>
                        {/* Release Date */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-400 text-xs font-montserrat">{formatDate(m.releaseDate)}</p>
                        </td>
                        {/* Featured */}
                        <td className="py-3.5 px-3">
                          <button onClick={() => handleToggleFeatured(m)} title={m.featured ? 'Unfeature' : 'Feature'}
                            className={`w-10 h-5 rounded-full transition-all relative ${m.featured ? 'bg-yellow-500' : 'bg-white/10'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.featured ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(m)} title="Edit"
                              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                              <Icon name="PencilSquareIcon" size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(m)} title="Delete"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Icon name="TrashIcon" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {!loading && !fetchError && movies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Icon name="FilmIcon" size={40} className="mx-auto mb-3 text-neutral-700" />
                      <p className="text-neutral-500 font-montserrat text-sm">No movies found</p>
                      <button onClick={openAdd} className="mt-3 text-yellow-400 text-sm font-montserrat hover:underline">
                        + Add the first movie
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
                <h3 className="font-playfair text-xl font-bold text-white">Delete Movie</h3>
                <p className="text-neutral-400 text-sm font-montserrat mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-neutral-300 font-montserrat text-sm leading-relaxed">
              Permanently delete <span className="text-white font-semibold">"{confirmDelete.title}"</span>?
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-montserrat text-sm font-medium transition-all border border-red-500/20">
                Delete Movie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
