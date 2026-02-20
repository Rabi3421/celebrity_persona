'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IReviewCastMember {
  name: string;
  character?: string;
  image?: string;
}

interface IMovieDetails {
  releaseYear?: number;
  director?: string;
  writers?: string[];
  cast?: IReviewCastMember[];
  genre?: string[];
  runtime?: number;
  budget?: string;
  boxOffice?: string;
  studio?: string;
  mpaaRating?: string;
}

interface IScores {
  criticsScore?: number;
  audienceScore?: number;
  imdbRating?: number;
  rottenTomatoesScore?: number;
}

interface IAuthorSocial {
  twitter?: string;
  instagram?: string;
  website?: string;
}

interface IAuthor {
  name: string;
  avatar?: string;
  bio?: string;
  credentials?: string;
  reviewCount?: number;
  socialMedia?: IAuthorSocial;
}

interface ReviewRow {
  id: string;
  title: string;
  slug: string;
  movieTitle: string;
  poster?: string;
  rating: number;
  featured: boolean;
  publishDate?: string;
  excerpt?: string;
  authorName?: string;
  createdAt?: string;
}

interface ReviewFull extends ReviewRow {
  backdropImage?: string;
  trailer?: string;
  content: string;
  verdict?: string;
  author: IAuthor;
  movieDetails?: IMovieDetails;
  scores?: IScores;
  pros?: string[];
  cons?: string[];
  seoData?: { metaTitle?: string; metaDescription?: string; keywords?: string[] };
}

type FormTab = 'basic' | 'content' | 'movie' | 'scores';
type PanelMode = 'add' | 'edit' | null;
type Toast = { type: 'success' | 'error'; message: string } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info',    icon: 'DocumentTextIcon'    },
  { key: 'content', label: 'Review',        icon: 'PencilSquareIcon'    },
  { key: 'movie',   label: 'Movie Details', icon: 'FilmIcon'            },
  { key: 'scores',  label: 'Scores',        icon: 'StarIcon'            },
];

const EMPTY_AUTHOR: IAuthor = {
  name: '',
  avatar: '',
  bio: '',
  credentials: '',
  reviewCount: 0,
  socialMedia: { twitter: '', instagram: '', website: '' },
};

const EMPTY_FORM: ReviewFull = {
  id: '',
  title: '',
  slug: '',
  movieTitle: '',
  poster: '',
  backdropImage: '',
  trailer: '',
  rating: 7,
  content: '',
  excerpt: '',
  verdict: '',
  featured: false,
  publishDate: '',
  authorName: '',
  author: EMPTY_AUTHOR,
  movieDetails: {
    releaseYear: undefined,
    director: '',
    writers: [],
    cast: [],
    genre: [],
    runtime: undefined,
    budget: '',
    boxOffice: '',
    studio: '',
    mpaaRating: '',
  },
  scores: {
    criticsScore: undefined,
    audienceScore: undefined,
    imdbRating: undefined,
    rottenTomatoesScore: undefined,
  },
  pros: [],
  cons: [],
  seoData: { metaTitle: '', metaDescription: '', keywords: [] },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function joinLines(arr?: string[]): string { return (arr || []).join('\n'); }
function splitLines(s: string): string[] { return s.split('\n').map((l) => l.trim()).filter(Boolean); }

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

function ratingColor(r: number) {
  if (r >= 8) return 'text-emerald-400';
  if (r >= 6) return 'text-yellow-400';
  return 'text-red-400';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReviewManagementSection() {
  const { authHeaders } = useAuth();

  // List state
  const [reviews, setReviews]         = useState<ReviewRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [limit, setLimit]             = useState(20);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Row actions
  const [busyMap, setBusyMap]               = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete]   = useState<ReviewRow | null>(null);
  const [toast, setToast]                   = useState<Toast>(null);

  // Panel
  const [panelMode, setPanelMode]           = useState<PanelMode>(null);
  const [formTab, setFormTab]               = useState<FormTab>('basic');
  const [form, setForm]                     = useState<ReviewFull>(EMPTY_FORM);
  const [formErrors, setFormErrors]         = useState<Partial<Record<keyof ReviewFull, string>>>({});
  const [formLoading, setFormLoading]       = useState(false);
  const [formApiError, setFormApiError]     = useState('');
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setBusy = (id: string, v: boolean) =>
    setBusyMap((p) => ({ ...p, [id]: v }));

  const setField = <K extends keyof ReviewFull>(key: K, value: ReviewFull[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setAuthorField = <K extends keyof IAuthor>(key: K, value: IAuthor[K]) =>
    setForm((p) => ({ ...p, author: { ...p.author, [key]: value } }));

  const setMovieField = <K extends keyof IMovieDetails>(key: K, value: IMovieDetails[K]) =>
    setForm((p) => ({ ...p, movieDetails: { ...p.movieDetails, [key]: value } }));

  const setScoreField = <K extends keyof IScores>(key: K, value: IScores[K]) =>
    setForm((p) => ({ ...p, scores: { ...p.scores, [key]: value } }));

  // ── fetch ──────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 1, lim = limit) => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const res  = await fetch(`/api/superadmin/reviews?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Failed to load');
      const rows: ReviewRow[] = (data.data || []).map((r: any) => ({
        id:          r._id || r.id,
        title:       r.title,
        slug:        r.slug,
        movieTitle:  r.movieTitle,
        poster:      r.poster,
        rating:      r.rating,
        featured:    r.featured ?? false,
        publishDate: r.publishDate,
        excerpt:     r.excerpt,
        authorName:  r.author?.name,
        createdAt:   r.createdAt,
      }));
      setReviews(rows);
      setTotal(data.total);
      setPage(p);
      setLimit(lim);
      setPages(data.pages);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, searchQuery, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // ── open add ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setFormApiError('');
    setFormTab('basic'); setPanelMode('add');
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── open edit ───────────────────────────────────────────────────────────
  const openEdit = async (row: ReviewRow) => {
    setFormErrors({}); setFormApiError(''); setFormTab('basic');
    setPanelMode('edit'); setLoadingDetail(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res  = await fetch(`/api/superadmin/reviews/${row.id}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Failed to load');
      const d: any = data.data;
      setForm({
        id:            d._id || d.id,
        title:         d.title         || '',
        slug:          d.slug          || '',
        movieTitle:    d.movieTitle    || '',
        poster:        d.poster        || '',
        backdropImage: d.backdropImage || '',
        trailer:       d.trailer       || '',
        rating:        d.rating        ?? 7,
        content:       d.content       || '',
        excerpt:       d.excerpt       || '',
        verdict:       d.verdict       || '',
        featured:      d.featured      ?? false,
        publishDate:   toDateInputValue(d.publishDate),
        authorName:    d.author?.name  || '',
        author: {
          name:        d.author?.name        || '',
          avatar:      d.author?.avatar      || '',
          bio:         d.author?.bio         || '',
          credentials: d.author?.credentials || '',
          reviewCount: d.author?.reviewCount ?? 0,
          socialMedia: {
            twitter:   d.author?.socialMedia?.twitter   || '',
            instagram: d.author?.socialMedia?.instagram || '',
            website:   d.author?.socialMedia?.website   || '',
          },
        },
        movieDetails: {
          releaseYear: d.movieDetails?.releaseYear ?? undefined,
          director:    d.movieDetails?.director    || '',
          writers:     d.movieDetails?.writers     || [],
          cast:        d.movieDetails?.cast        || [],
          genre:       d.movieDetails?.genre       || [],
          runtime:     d.movieDetails?.runtime     ?? undefined,
          budget:      d.movieDetails?.budget      || '',
          boxOffice:   d.movieDetails?.boxOffice   || '',
          studio:      d.movieDetails?.studio      || '',
          mpaaRating:  d.movieDetails?.mpaaRating  || '',
        },
        scores: {
          criticsScore:        d.scores?.criticsScore        ?? undefined,
          audienceScore:       d.scores?.audienceScore       ?? undefined,
          imdbRating:          d.scores?.imdbRating          ?? undefined,
          rottenTomatoesScore: d.scores?.rottenTomatoesScore ?? undefined,
        },
        pros:    d.pros    || [],
        cons:    d.cons    || [],
        seoData: d.seoData || { metaTitle: '', metaDescription: '', keywords: [] },
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load review');
      setPanelMode(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => setPanelMode(null);

  // ── validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof ReviewFull, string>> = {};
    if (!form.title.trim())      errs.title      = 'Title is required';
    if (!form.movieTitle.trim()) errs.movieTitle = 'Movie title is required';
    if (!form.content.trim())    errs.content    = 'Review content is required';
    if (!form.author.name.trim()) errs.authorName = 'Author name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── payload ──────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    title:         form.title.trim(),
    slug:          form.slug?.trim()          || undefined,
    movieTitle:    form.movieTitle.trim(),
    poster:        form.poster?.trim()        || undefined,
    backdropImage: form.backdropImage?.trim() || undefined,
    trailer:       form.trailer?.trim()       || undefined,
    rating:        form.rating,
    content:       form.content.trim(),
    excerpt:       form.excerpt?.trim()       || undefined,
    verdict:       form.verdict?.trim()       || undefined,
    featured:      form.featured,
    publishDate:   form.publishDate           || undefined,
    author:        form.author,
    movieDetails:  form.movieDetails,
    scores:        form.scores,
    pros:          form.pros    || [],
    cons:          form.cons    || [],
    seoData:       form.seoData,
  });

  // ── create ───────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/reviews', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Create failed');
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
      const res  = await fetch(`/api/superadmin/reviews/${form.id}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Update failed');
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
  const handleDelete = async (r: ReviewRow) => {
    setConfirmDelete(null); setBusy(r.id, true);
    try {
      const res  = await fetch(`/api/superadmin/reviews/${r.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Delete failed');
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      setTotal((t) => t - 1);
      showToast('success', `"${r.title}" deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    } finally {
      setBusy(r.id, false);
    }
  };

  // ── quick toggle featured ─────────────────────────────────────────────────
  const handleToggleFeatured = async (r: ReviewRow) => {
    setBusy(r.id, true);
    const newVal = !r.featured;
    try {
      const res  = await fetch(`/api/superadmin/reviews/${r.id}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ featured: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Update failed');
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, featured: newVal } : x));
      showToast('success', `"${r.title}" ${newVal ? 'featured' : 'unfeatured'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(r.id, false);
    }
  };

  // ── cast helpers ──────────────────────────────────────────────────────────
  const addCastMember = () =>
    setMovieField('cast', [...(form.movieDetails?.cast || []), { name: '', character: '', image: '' }]);

  const updateCast = (i: number, key: keyof IReviewCastMember, val: string) =>
    setMovieField('cast', (form.movieDetails?.cast || []).map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const removeCast = (i: number) =>
    setMovieField('cast', (form.movieDetails?.cast || []).filter((_, idx) => idx !== i));

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

  const errBorder = (field: keyof ReviewFull) =>
    formErrors[field] ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60';

  // ─────────────────────────────────────────────────────────────────────────
  // Form Tab Content
  // ─────────────────────────────────────────────────────────────────────────

  const renderFormTab = () => {
    switch (formTab) {

      // ── BASIC ──────────────────────────────────────────────────────────
      case 'basic': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Review Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Review Title <span className="text-yellow-400">*</span>
            </label>
            <input type="text" value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Kantara Chapter 1: A Cinematic Masterpiece Rooted in Tradition and Myth"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('title')}`}
            />
            {formErrors.title && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.title}</p>}
          </div>

          {/* Movie Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Movie Title <span className="text-yellow-400">*</span>
            </label>
            <input type="text" value={form.movieTitle}
              onChange={(e) => setField('movieTitle', e.target.value)}
              placeholder="e.g. Kantara: A Legend – Chapter 1"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('movieTitle')}`}
            />
            {formErrors.movieTitle && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.movieTitle}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Slug</label>
            <input type="text" value={form.slug || ''}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="auto-generated from title"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Rating (0–10) <span className="text-yellow-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="10" step="0.1" value={form.rating}
                onChange={(e) => setField('rating', parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              />
              <span className={`font-playfair text-2xl font-bold ${ratingColor(form.rating)}`}>{form.rating}</span>
              <span className="text-neutral-500 font-montserrat text-xs">/ 10</span>
            </div>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Publish Date</label>
            <input type="date" value={form.publishDate || ''}
              onChange={(e) => setField('publishDate', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
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
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Backdrop Image URL</label>
            <div className="flex gap-3 items-start">
              <input type="url" value={form.backdropImage || ''}
                onChange={(e) => setField('backdropImage', e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              />
              {form.backdropImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.backdropImage} alt="" className="w-24 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
              )}
            </div>
          </div>

          {/* Trailer */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Trailer URL</label>
            <input type="url" value={form.trailer || ''}
              onChange={(e) => setField('trailer', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Excerpt */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Excerpt</label>
            <textarea value={form.excerpt || ''} rows={3}
              onChange={(e) => setField('excerpt', e.target.value)}
              placeholder="Brief summary shown on listing pages..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-montserrat text-neutral-300">Featured</span>
              <button type="button" onClick={() => setField('featured', !form.featured)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.featured ? 'bg-yellow-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.featured ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>

          {/* Author block */}
          <div className="md:col-span-2 space-y-3 pt-2 border-t border-white/10">
            <p className="text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Author</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">
                  Name <span className="text-yellow-400">*</span>
                </label>
                <input type="text" value={form.author.name}
                  onChange={(e) => setAuthorField('name', e.target.value)}
                  placeholder="Reviewer name"
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${formErrors.authorName ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60'}`}
                />
                {formErrors.authorName && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.authorName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Credentials</label>
                <input type="text" value={form.author.credentials || ''}
                  onChange={(e) => setAuthorField('credentials', e.target.value)}
                  placeholder="e.g. Film Critics"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Avatar URL</label>
                <div className="flex gap-3 items-center">
                  <input type="url" value={form.author.avatar || ''}
                    onChange={(e) => setAuthorField('avatar', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                  />
                  {form.author.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.author.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Bio</label>
                <textarea value={form.author.bio || ''} rows={2}
                  onChange={(e) => setAuthorField('bio', e.target.value)}
                  placeholder="Brief author bio..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Instagram</label>
                <input type="url" value={form.author.socialMedia?.instagram || ''}
                  onChange={(e) => setAuthorField('socialMedia', { ...form.author.socialMedia, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1 font-montserrat uppercase tracking-wider">Website</label>
                <input type="url" value={form.author.socialMedia?.website || ''}
                  onChange={(e) => setAuthorField('socialMedia', { ...form.author.socialMedia, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
            </div>
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
              placeholder={"Kantara review\nIndian cinema 2025\nRishab Shetty film"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>
        </div>
      );

      // ── CONTENT / REVIEW TEXT ──────────────────────────────────────────
      case 'content': return (
        <div className="space-y-5">

          {/* Main Review Content */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Review Content (HTML) <span className="text-yellow-400">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              rows={16}
              placeholder={'<p><strong>Film Title</strong> is a...</p>\n<p>The story revolves around...</p>'}
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm resize-y font-mono ${errBorder('content')}`}
            />
            {formErrors.content && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.content}</p>}
            <p className="text-neutral-600 text-xs mt-1 font-montserrat">{form.content.length} chars</p>
          </div>

          {/* Verdict */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Final Verdict</label>
            <textarea value={form.verdict || ''} rows={4}
              onChange={(e) => setField('verdict', e.target.value)}
              placeholder="Wrap-up verdict paragraph shown at the bottom of the review..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pros */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                Pros (one per line)
              </label>
              <textarea value={joinLines(form.pros)} rows={8}
                onChange={(e) => setField('pros', splitLines(e.target.value))}
                placeholder={"Brilliant blend of folklore\nPowerful performances\nStunning cinematography"}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
              />
              <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(form.pros || []).length} items</p>
            </div>

            {/* Cons */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                Cons (one per line)
              </label>
              <textarea value={joinLines(form.cons)} rows={8}
                onChange={(e) => setField('cons', splitLines(e.target.value))}
                placeholder={"Complex folklore narrative\nLong runtime\nLimited subtitle availability"}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
              />
              <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(form.cons || []).length} items</p>
            </div>
          </div>
        </div>
      );

      // ── MOVIE DETAILS ──────────────────────────────────────────────────
      case 'movie': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Release Year</label>
            <input type="number" value={form.movieDetails?.releaseYear ?? ''}
              onChange={(e) => setMovieField('releaseYear', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 2025"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Director</label>
            <input type="text" value={form.movieDetails?.director || ''}
              onChange={(e) => setMovieField('director', e.target.value)}
              placeholder="e.g. Rishab Shetty"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Studio</label>
            <input type="text" value={form.movieDetails?.studio || ''}
              onChange={(e) => setMovieField('studio', e.target.value)}
              placeholder="e.g. Hombale Films"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">MPAA Rating</label>
            <input type="text" value={form.movieDetails?.mpaaRating || ''}
              onChange={(e) => setMovieField('mpaaRating', e.target.value)}
              placeholder="e.g. PG-13, U/A"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Runtime (mins)</label>
            <input type="number" value={form.movieDetails?.runtime ?? ''}
              onChange={(e) => setMovieField('runtime', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 157"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Budget</label>
            <input type="text" value={form.movieDetails?.budget || ''}
              onChange={(e) => setMovieField('budget', e.target.value)}
              placeholder="e.g. ₹125 crore"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Box Office</label>
            <input type="text" value={form.movieDetails?.boxOffice || ''}
              onChange={(e) => setMovieField('boxOffice', e.target.value)}
              placeholder="e.g. ₹590 crore"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Genre (one per line)</label>
            <textarea value={joinLines(form.movieDetails?.genre)} rows={4}
              onChange={(e) => setMovieField('genre', splitLines(e.target.value))}
              placeholder={"Action\nThriller\nDrama\nMystery"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Writers (one per line)</label>
            <textarea value={joinLines(form.movieDetails?.writers)} rows={4}
              onChange={(e) => setMovieField('writers', splitLines(e.target.value))}
              placeholder={"Rishab Shetty (Story & Screenplay)"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Cast */}
          <div className="md:col-span-2 space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Cast</label>
              <button type="button" onClick={addCastMember}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-sm font-montserrat transition-all"
              >
                <Icon name="PlusIcon" size={13} /> Add Member
              </button>
            </div>

            {(form.movieDetails?.cast || []).length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Icon name="UsersIcon" size={28} className="text-neutral-700" />
                <p className="text-neutral-500 font-montserrat text-sm">No cast members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(form.movieDetails?.cast || []).map((member, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 relative">
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
        </div>
      );

      // ── SCORES ──────────────────────────────────────────────────────────
      case 'scores': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {[
            { key: 'criticsScore'       as const, label: "Critics Score",          placeholder: "e.g. 80",  max: 100, icon: 'StarIcon',                color: 'text-yellow-400'  },
            { key: 'audienceScore'      as const, label: "Audience Score",         placeholder: "e.g. 92",  max: 100, icon: 'UserGroupIcon',            color: 'text-blue-400'    },
            { key: 'imdbRating'         as const, label: "IMDb Rating (0–10)",     placeholder: "e.g. 9.8", max: 10,  icon: 'FilmIcon',                 color: 'text-yellow-300'  },
            { key: 'rottenTomatoesScore'as const, label: "Rotten Tomatoes (%)",    placeholder: "e.g. 90",  max: 100, icon: 'CheckBadgeIcon',           color: 'text-red-400'     },
          ].map(({ key, label, placeholder, max, icon, color }) => (
            <div key={key} className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/5 shrink-0">
                <Icon name={icon as any} size={22} className={color} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
                <input
                  type="number" min="0" max={max} step="0.1"
                  value={form.scores?.[key] ?? ''}
                  onChange={(e) => setScoreField(key, e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
              {form.scores?.[key] !== undefined && (
                <span className={`font-playfair text-2xl font-bold shrink-0 ${color}`}>
                  {form.scores[key]}
                </span>
              )}
            </div>
          ))}

          <div className="md:col-span-2 p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-neutral-500 font-montserrat text-xs">
              Scores are optional. They appear on the review page alongside the main rating. IMDb rating is on a 0–10 scale; others are percentages (0–100).
            </p>
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
            { label: 'Total',     value: total,                                           icon: 'DocumentTextIcon',   color: 'text-yellow-400'  },
            { label: 'Featured',  value: reviews.filter((r) => r.featured).length,        icon: 'SparklesIcon',       color: 'text-purple-400'  },
            { label: 'This Page', value: reviews.length,                                  icon: 'RectangleGroupIcon', color: 'text-blue-400'    },
            { label: 'Pages',     value: pages,                                            icon: 'BookOpenIcon',       color: 'text-emerald-400' },
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
              placeholder="Search by title or movie name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>
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
              <Icon name="PlusIcon" size={16} /> Add Review
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
                  {panelMode === 'add' ? 'Add Movie Review' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in review details across tabs' : 'Update review details'}
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
              <span className="text-neutral-400 font-montserrat text-sm">Loading review...</span>
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
                      : (panelMode === 'add' ? 'Create Review' : 'Save Changes')}
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
            <h3 className="font-playfair text-xl font-bold text-white">Movie Reviews</h3>
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
                  {['Review', 'Movie', 'Author', 'Rating', 'Published', 'Featured', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[200, 160, 110, 60, 80, 55, 70].map((w, j) => (
                          <td key={j} className="py-3.5 px-3">
                            <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : reviews.map((r) => (
                      <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${busyMap[r.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Review title + poster */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {r.poster ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.poster} alt={r.title} className="w-9 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                            ) : (
                              <div className="w-9 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Icon name="DocumentTextIcon" size={14} className="text-yellow-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium font-montserrat text-sm leading-tight line-clamp-2 max-w-[220px]">{r.title}</p>
                            </div>
                          </div>
                        </td>
                        {/* Movie */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-300 text-sm font-montserrat line-clamp-1 max-w-[160px]">{r.movieTitle}</p>
                        </td>
                        {/* Author */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-400 text-sm font-montserrat">{r.authorName || '—'}</p>
                        </td>
                        {/* Rating */}
                        <td className="py-3.5 px-3">
                          <span className={`font-playfair text-lg font-bold ${ratingColor(r.rating)}`}>{r.rating}</span>
                          <span className="text-neutral-600 text-xs font-montserrat">/10</span>
                        </td>
                        {/* Published */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-400 text-xs font-montserrat">{formatDate(r.publishDate || r.createdAt)}</p>
                        </td>
                        {/* Featured */}
                        <td className="py-3.5 px-3">
                          <button onClick={() => handleToggleFeatured(r)} title={r.featured ? 'Unfeature' : 'Feature'}
                            className={`w-10 h-5 rounded-full transition-all relative ${r.featured ? 'bg-yellow-500' : 'bg-white/10'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.featured ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(r)} title="Edit"
                              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                              <Icon name="PencilSquareIcon" size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(r)} title="Delete"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Icon name="TrashIcon" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {!loading && !fetchError && reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Icon name="DocumentTextIcon" size={40} className="mx-auto mb-3 text-neutral-700" />
                      <p className="text-neutral-500 font-montserrat text-sm">No reviews found</p>
                      <button onClick={openAdd} className="mt-3 text-yellow-400 text-sm font-montserrat hover:underline">
                        + Add the first review
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
                <h3 className="font-playfair text-xl font-bold text-white">Delete Review</h3>
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
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
