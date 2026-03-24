'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/imageUpload';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ICastMember {
  name: string;
  role?: string;
  character?: string;
  image?: string;
  celebrityId?: string;
}

interface ITicketLink {
  platform: string;
  url: string;
  available: boolean;
}

interface IMovieSEO {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];        // secondary keywords
  canonicalUrl?: string;
  robots?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  schemaType?: string;
  structuredData?: string;
  authorName?: string;
  authorUrl?: string;
  articleSection?: string;
  relatedTopics?: string[];
  altText?: string;
  imageDescription?: string;
  priority?: number;
  changeFreq?: string;
}

type MovieStatus = 'draft' | 'published' | 'announced' | 'filming' | 'post-production' | 'upcoming' | 'released' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  published:        'bg-emerald-500/20 text-emerald-400',
  draft:            'bg-yellow-500/20 text-yellow-400',
  announced:        'bg-blue-500/20 text-blue-400',
  filming:          'bg-purple-500/20 text-purple-400',
  'post-production':'bg-indigo-500/20 text-indigo-400',
  upcoming:         'bg-sky-500/20 text-sky-400',
  released:         'bg-emerald-500/20 text-emerald-400',
  cancelled:        'bg-red-500/20 text-red-400',
};

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  director?: string;
  status?: MovieStatus | string;
  language?: string[];
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

type FormTab = 'basic' | 'content' | 'cast' | 'details' | 'images' | 'seo';
type PanelMode = 'add' | 'edit' | null;
type Toast = { type: 'success' | 'error'; message: string } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];

type UploadSlot = { uploading: boolean; progress: number; error: string };
const emptySlot = (): UploadSlot => ({ uploading: false, progress: 0, error: '' });

const EMPTY_MOVIE_SEO: IMovieSEO = {
  metaTitle: '', metaDescription: '', focusKeyword: '', keywords: [],
  canonicalUrl: '', robots: 'index,follow', robotsIndex: true, robotsFollow: true,
  ogTitle: '', ogDescription: '', ogImage: '', ogType: 'movie',
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '',
  twitterImage: '', twitterCreator: '',
  schemaType: 'Movie', structuredData: '',
  authorName: '', authorUrl: '', articleSection: '', relatedTopics: [],
  altText: '', imageDescription: '', priority: 0.8, changeFreq: 'weekly',
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info', icon: 'FilmIcon'            },
  { key: 'content', label: 'Content',    icon: 'DocumentTextIcon'   },
  { key: 'cast',    label: 'Cast',       icon: 'UsersIcon'           },
  { key: 'details', label: 'Details',    icon: 'TagIcon'             },
  { key: 'images',  label: 'Images',     icon: 'PhotoIcon'           },
  { key: 'seo',     label: 'SEO',        icon: 'MagnifyingGlassIcon' },
];

const EMPTY_FORM: MovieFull = {
  id: '',
  title: '',
  slug: '',
  director: '',
  status: '',
  language: [],
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
  seoData: EMPTY_MOVIE_SEO,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function joinLines(arr?: string[]): string {
  return (arr || []).join('\n');
}

function splitLines(s: string): string[] {
  return s.split('\n').map((l) => l.trim()).filter(Boolean);
}

// Comma-separated helpers (useful where inputs should be comma-separated)
function joinComma(arr?: string[]): string {
  return (arr || []).join(', ');
}

function splitComma(s: string): string[] {
  if (!s) return [];
  // split on comma and also allow semicolon for flexibility
  return s
    .split(/[,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function slugify(s: string) {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const LANGUAGES = [
  // Indian languages
  'Hindi','English','Telugu','Tamil','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Assamese','Sindhi','Urdu','Bhojpuri','Konkani','Maithili','Manipuri','Kashmiri','Nepali','Sanskrit',
  // Global languages
  'Spanish','French','German','Chinese (Simplified)','Chinese (Traditional)','Japanese','Korean','Portuguese','Russian','Arabic','Italian','Dutch','Turkish','Vietnamese','Indonesian','Thai','Swedish','Polish','Hebrew'
];

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
  const [draftLoading, setDraftLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isSlugEditedRef = useRef(false);

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
    isSlugEditedRef.current = false;
    setDurationMode('minutes'); setDurationHours(undefined); setDurationMinutes(undefined);
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
      const generatedSlug = slugify(d.title || '');
      isSlugEditedRef.current = (d.slug || '') !== generatedSlug;

      // Ensure all array fields are actual arrays (DB may return string for single-value arrays)
      const toArr = (v: any): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v ? [v] : [];
        return [];
      };

      setForm({
        id:                  d._id || d.id,
        title:               d.title               || '',
        slug:                d.slug                || '',
        director:            d.director            || '',
        status:              d.status              || '',
        language:            toArr(d.language),
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
        cast:                Array.isArray(d.cast) ? d.cast : [],
        genre:               toArr(d.genre),
        regions:             toArr(d.regions),
        subtitles:           toArr(d.subtitles),
        images:              toArr(d.images),
        writers:             toArr(d.writers),
        producers:           toArr(d.producers),
        ticketLinks:         Array.isArray(d.ticketLinks) ? d.ticketLinks : [],
        seoData:             d.seoData ? {
          ...d.seoData,
          keywords:      toArr(d.seoData.keywords),
          relatedTopics: toArr(d.seoData.relatedTopics),
          robotsIndex:   d.seoData.robotsIndex  !== undefined ? d.seoData.robotsIndex  : !String(d.seoData.robots || '').includes('noindex'),
          robotsFollow:  d.seoData.robotsFollow !== undefined ? d.seoData.robotsFollow : !String(d.seoData.robots || '').includes('nofollow'),
        } : EMPTY_MOVIE_SEO,
      });
      // set duration mode based on loaded value
      if (d.duration && typeof d.duration === 'number' && d.duration >= 60) {
        setDurationMode('hours');
        setDurationHours(Math.floor(d.duration / 60));
        setDurationMinutes(d.duration % 60);
      } else {
        setDurationMode('minutes');
        setDurationHours(undefined);
        setDurationMinutes(d.duration ?? undefined);
      }
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
    status:              form.status?.trim()             || 'draft',
    language:            form.language && form.language.length ? form.language : undefined,
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
    seoData:             form.seoData ? (() => {
      const { robotsIndex, robotsFollow, ...rest } = form.seoData!;
      const idx = robotsIndex !== false;
      const fol = robotsFollow !== false;
      return {
        ...rest,
        robotsIndex: idx,
        robotsFollow: fol,
        robots: `${idx ? 'index' : 'noindex'}, ${fol ? 'follow' : 'nofollow'}`,
      };
    })() : undefined,
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
        body:    JSON.stringify({ ...buildPayload(), status: 'published' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');
      closePanel();
      showToast('success', `"${form.title.trim()}" published`);
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
        body:    JSON.stringify({ ...buildPayload(), status: 'published' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      closePanel();
      showToast('success', `"${form.title.trim()}" published`);
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

  // ── validate draft (title-only) ──────────────────────────────────────────
  const validateDraft = () => {
    const errs: Partial<Record<keyof MovieFull, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required to save as draft';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── save as draft ─────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!validateDraft()) return;
    setDraftLoading(true); setFormApiError('');
    try {
      const payload = { ...buildPayload(), status: 'draft' as const };
      let res: Response;
      if (panelMode === 'edit' && form.id) {
        res = await fetch(`/api/superadmin/movies/${form.id}`, {
          method:  'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/superadmin/movies', {
          method:  'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save draft');
      if (panelMode === 'add') {
        setForm((f) => ({ ...f, id: data.data._id || data.data.id, status: 'draft' }));
        setPanelMode('edit');
      } else {
        setForm((f) => ({ ...f, status: 'draft' }));
      }
      showToast('success', `"${form.title.trim()}" saved as draft`);
      fetchList(page);
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to save draft');
    } finally {
      setDraftLoading(false);
    }
  };

  // ── quick status toggle (draft ↔ published) ────────────────────────────────
  const handleStatusToggle = async (m: MovieRow, newStatus: 'draft' | 'published') => {
    if (m.status === newStatus) return;
    setBusy(m.id, true);
    try {
      const res  = await fetch(`/api/superadmin/movies/${m.id}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update status');
      setMovies((prev) => prev.map((x) => x.id === m.id ? { ...x, status: newStatus } : x));
      showToast('success', `"${m.title}" marked as ${newStatus}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    } finally {
      setBusy(m.id, false);
    }
  };

  // ── cast helpers ──────────────────────────────────────────────────────────
  const addCastMember = () =>
    setField('cast', [...(form.cast || []), { name: '', role: '', character: '', image: '', celebrityId: '' }]);

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const newSlug = slugify(v || '');
    setField('title', v);
    if (!isSlugEditedRef.current) setField('slug', newSlug);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSlugEditedRef.current = true;
    setField('slug', e.target.value);
  };

  // language dropdown state and ref
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);

  // rating info modal
  const [showRatingInfo, setShowRatingInfo] = useState(false);

  // image upload state
  const [uploadingMap,     setUploadingMap]     = useState<Record<number, boolean>>({});
  const [uploadingPoster,  setUploadingPoster]  = useState(false);
  const [uploadingBackdrop,setUploadingBackdrop]= useState(false);
  const [posterDragActive,  setPosterDragActive]  = useState(false);
  const [backdropDragActive,setBackdropDragActive]= useState(false);
  const [ogImageUpload,    setOgImageUpload]    = useState<UploadSlot>(emptySlot());
  const [twitterImageUpload,setTwitterImageUpload]= useState<UploadSlot>(emptySlot());

  // celebrity selection state
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [celebritySearch, setCelebritySearch] = useState('');
  const [loadingCelebrities, setLoadingCelebrities] = useState(false);
  const [celebritySearchError, setCelebritySearchError] = useState('');
  const [activeCastDropdown, setActiveCastDropdown] = useState<number | null>(null);
  const castDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!langOpen) return;
      if (!langDropdownRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!langDropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setLangOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [langOpen]);

  // Close cast dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (activeCastDropdown === null) return;
      if (!(e.target instanceof Node)) return;
      
      const activeDropdownRef = castDropdownRefs.current[activeCastDropdown];
      if (activeDropdownRef && !activeDropdownRef.contains(e.target)) {
        setActiveCastDropdown(null);
      }
    }
    
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveCastDropdown(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeCastDropdown]);

  // Duration input mode: 'minutes' or 'hours'
  const [durationMode, setDurationMode] = useState<'minutes' | 'hours'>('minutes');
  const [durationHours, setDurationHours] = useState<number | undefined>(undefined);
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);

  // keep form.duration in sync when hours/minutes change
  useEffect(() => {
    if (durationMode === 'hours') {
      const h = durationHours || 0;
      const m = durationMinutes || 0;
      setField('duration', h * 60 + m);
    }
  }, [durationMode, durationHours, durationMinutes]);

  // ── Image Upload Handlers ──────────────────────────────────────────────────

  const movieSlug = form.slug?.trim() || (form.title?.trim() ? slugify(form.title.trim()) : 'movie');

  // ── Poster ────────────────────────────────────────────────────────────────
  const handleSelectPoster = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { showToast('error', err); return; }
      setUploadingPoster(true);
      try {
        if (form.poster) await deleteImage(form.poster);
        const url = await uploadImage(file, `movies/${movieSlug}/poster`);
        setField('poster', url);
        showToast('success', 'Poster uploaded');
      } catch { showToast('error', 'Failed to upload poster'); }
      finally { setUploadingPoster(false); }
    };
    input.click();
  };

  const handleDeletePoster = async () => {
    if (!form.poster) return;
    try { await deleteImage(form.poster); setField('poster', ''); showToast('success', 'Poster removed'); }
    catch { showToast('error', 'Failed to remove poster'); }
  };

  const handleDropPoster = (e: React.DragEvent) => {
    e.preventDefault(); setPosterDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } } as any;
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      Object.defineProperty(input, 'files', { value: [file] });
      handleSelectPoster();
    }
  };

  // ── Backdrop ──────────────────────────────────────────────────────────────
  const handleSelectBackdrop = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { showToast('error', err); return; }
      setUploadingBackdrop(true);
      try {
        if (form.backdrop) await deleteImage(form.backdrop);
        const url = await uploadImage(file, `movies/${movieSlug}/backdrop`);
        setField('backdrop', url);
        showToast('success', 'Backdrop uploaded');
      } catch { showToast('error', 'Failed to upload backdrop'); }
      finally { setUploadingBackdrop(false); }
    };
    input.click();
  };

  const handleDeleteBackdrop = async () => {
    if (!form.backdrop) return;
    try { await deleteImage(form.backdrop); setField('backdrop', ''); showToast('success', 'Backdrop removed'); }
    catch { showToast('error', 'Failed to remove backdrop'); }
  };

  // ── SEO helpers ─────────────────────────────────────────────────────────────
  const setSeoField = <K extends keyof IMovieSEO>(k: K, v: IMovieSEO[K]) =>
    setForm((p) => ({ ...p, seoData: { ...(p.seoData || EMPTY_MOVIE_SEO), [k]: v } }));

  const handleOgImageUpload = async (file: File) => {
    const err = validateImageFile(file);
    if (err) { setOgImageUpload((p) => ({ ...p, error: err })); return; }
    setOgImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `movies/${movieSlug}/seo`);
      setSeoField('ogImage', url);
      setOgImageUpload({ uploading: false, progress: 100, error: '' });
    } catch {
      setOgImageUpload({ uploading: false, progress: 0, error: 'Upload failed' });
    }
  };

  const handleTwitterImageUpload = async (file: File) => {
    const err = validateImageFile(file);
    if (err) { setTwitterImageUpload((p) => ({ ...p, error: err })); return; }
    setTwitterImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `movies/${movieSlug}/seo`);
      setSeoField('twitterImage', url);
      setTwitterImageUpload({ uploading: false, progress: 100, error: '' });
    } catch {
      setTwitterImageUpload({ uploading: false, progress: 0, error: 'Upload failed' });
    }
  };

  // ── Gallery images ────────────────────────────────────────────────────────
  const addGalleryImage   = () => setField('images', [...(form.images || []), '']);
  const removeGalleryImage = (i: number) =>
    setField('images', (form.images || []).filter((_, idx) => idx !== i));
  const updateGalleryImage = (i: number, val: string) =>
    setField('images', (form.images || []).map((x, idx) => idx === i ? val : x));

  const handleSelectGalleryImage = (i: number) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { showToast('error', err); return; }
      setUploadingMap((p) => ({ ...p, [i]: true }));
      try {
        const old = (form.images || [])[i];
        if (old) await deleteImage(old);
        const url = await uploadImage(file, `movies/${movieSlug}/gallery`);
        updateGalleryImage(i, url);
        showToast('success', 'Image uploaded');
      } catch { showToast('error', 'Failed to upload image'); }
      finally { setUploadingMap((p) => ({ ...p, [i]: false })); }
    };
    input.click();
  };

  const handleDropGalleryImage = async (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const err = validateImageFile(file);
    if (err) { showToast('error', err); return; }
    setUploadingMap((p) => ({ ...p, [i]: true }));
    try {
      const old = (form.images || [])[i];
      if (old) await deleteImage(old);
      const url = await uploadImage(file, `movies/${movieSlug}/gallery`);
      updateGalleryImage(i, url);
      showToast('success', 'Image uploaded');
    } catch { showToast('error', 'Failed to upload image'); }
    finally { setUploadingMap((p) => ({ ...p, [i]: false })); }
  };

  // ── Celebrity Management ──────────────────────────────────────────────────

  const fetchCelebrities = useCallback(async (search: string = '') => {
    setLoadingCelebrities(true);
    setCelebritySearchError('');
    try {
      const params = new URLSearchParams({ 
        limit: '20'
      });
      if (search.trim()) {
        params.set('query', search.trim());
      }
      
      const res = await fetch(`/api/content/celebrities/search?${params}`, {
        headers: authHeaders()
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setCelebrities(data.data);
        setCelebritySearchError('');
      } else {
        setCelebrities([]);
        setCelebritySearchError(data.message || 'No celebrities found');
      }
    } catch (error) {
      console.error('Failed to fetch celebrities:', error);
      setCelebrities([]);
      setCelebritySearchError(error instanceof Error ? error.message : 'Failed to search celebrities');
    } finally {
      setLoadingCelebrities(false);
    }
  }, [authHeaders]);

  // Load celebrities on component mount
  useEffect(() => {
    fetchCelebrities();
  }, [fetchCelebrities]);

  // Handle celebrity search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCelebrities(celebritySearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [celebritySearch, fetchCelebrities]);

  // Handle outside click for cast dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeCastDropdown !== null) {
        const ref = castDropdownRefs.current[activeCastDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setActiveCastDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCastDropdown]);

  const handleSelectCelebrity = (index: number, celebrity: any) => {
    const updatedCast = [...(form.cast || [])];
    updatedCast[index] = {
      ...updatedCast[index],
      name: celebrity.name,
      image: celebrity.profileImage || '',
      celebrityId: celebrity.id
    };
    setField('cast', updatedCast);
    setActiveCastDropdown(null);
    setCelebritySearch(''); // Clear search after selection
    fetchCelebrities('');
  };

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
              onChange={handleTitleChange}
              placeholder="e.g. Kalki 2898 AD"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('title')}`}
            />
            {formErrors.title && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Slug</label>
            <input type="text" value={form.slug || ''}
              onChange={handleSlugChange}
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
            <select value={form.status || ''}
              onChange={(e) => setField('status', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            >
              <option value="">— Select status —</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="announced">Announced</option>
              <option value="filming">Filming</option>
              <option value="post-production">Post-production</option>
              <option value="upcoming">Upcoming</option>
              <option value="released">Released</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Language (multi-select dropdown) */}
          <div className="relative">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Language</label>
            <div className="relative">
              <button type="button" onClick={() => setLangOpen((s) => !s)}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm flex items-center justify-between"
              >
                <span className="truncate">
                  {form.language && form.language.length > 0 ? form.language.join(', ') : 'Select languages'}
                </span>
                <Icon name={langOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} />
              </button>

              {langOpen && (
                <div ref={langDropdownRef} className="absolute z-50 left-0 right-0 mt-2 max-h-56 overflow-y-auto rounded-lg bg-[#060316]/95 border border-white/8 p-2 backdrop-blur-sm">
                  {LANGUAGES.map((lang) => (
                    <label key={lang} className="flex items-center gap-3 px-3 py-2 hover:bg-white/4/10 rounded">
                      <input type="checkbox" checked={!!(form.language || []).includes(lang)}
                        onChange={() => {
                          const cur = form.language || [];
                          if (cur.includes(lang)) setField('language', cur.filter((l) => l !== lang));
                          else setField('language', [...cur, lang]);
                        }}
                        className="w-4 h-4 rounded bg-white/10 border border-white/10 text-yellow-400 focus:ring-0"
                      />
                      <span className="text-sm font-montserrat text-white">{lang}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-neutral-500 text-xs mt-1 font-montserrat">Select one or more languages (Indian + global)</p>
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
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Duration</label>
            <div className="flex items-center gap-3">
              <select value={durationMode} onChange={(e) => setDurationMode(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours & Minutes</option>
              </select>

              {durationMode === 'minutes' ? (
                <input type="number" value={form.duration ?? ''}
                  onChange={(e) => setField('duration', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 165"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              ) : (
                <div className="flex gap-2 w-full">
                  <input type="number" min={0} value={durationHours ?? ''}
                    onChange={(e) => setDurationHours(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="Hours"
                    className="w-24 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                  />
                  <input type="number" min={0} max={59} value={durationMinutes ?? ''}
                    onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="Minutes"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* MPAA / Certification Rating */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Certification / Rating</label>
            <div className="flex items-center gap-2">
              <select value={form.mpaaRating || ''}
                onChange={(e) => setField('mpaaRating', e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              >
                <option value="">— Select rating —</option>
                <optgroup label="Indian (CBFC)">
                  <option value="U">U</option>
                  <option value="U/A">U/A</option>
                  <option value="A">A</option>
                  <option value="S">S</option>
                </optgroup>
                <optgroup label="MPAA (US)">
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC-17">NC-17</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Not Rated">Not Rated</option>
                </optgroup>
              </select>

              <button type="button" onClick={() => setShowRatingInfo(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/8 text-white hover:bg-white/6 transition-all"
                aria-label="Rating info"
              >
                <Icon name="InformationCircleIcon" size={16} />
              </button>
            </div>
            <p className="text-neutral-500 text-xs mt-1 font-montserrat">Choose a certification — click the info icon to learn meanings.</p>

            {showRatingInfo && (
              <div className="fixed inset-0 z-60 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowRatingInfo(false)} />
                <div className="relative z-70 w-full max-w-2xl mx-4 bg-background/95 border border-white/8 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-white font-montserrat">Rating guide</h3>
                    <button type="button" onClick={() => setShowRatingInfo(false)} className="text-neutral-400 hover:text-white">
                      <Icon name="XMarkIcon" size={18} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-300 font-montserrat">
                    <div>
                      <p className="font-semibold text-white">Indian (CBFC)</p>
                      <ul className="mt-2 space-y-2">
                        <li><span className="font-medium">U:</span> Suitable for all ages.</li>
                        <li><span className="font-medium">U/A:</span> Parental guidance for children below 12; may contain mild violence or adult themes.</li>
                        <li><span className="font-medium">A:</span> Restricted to adult audiences (18+); may contain strong language, violence, or sexual content.</li>
                        <li><span className="font-medium">S:</span> Restricted to specialized audiences such as doctors or scientists.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white">MPAA (US)</p>
                      <ul className="mt-2 space-y-2">
                        <li><span className="font-medium">G:</span> General audiences — all ages admitted; minimal or no content.</li>
                        <li><span className="font-medium">PG:</span> Parental guidance suggested; some material may be inappropriate for children.</li>
                        <li><span className="font-medium">PG-13:</span> Parents strongly cautioned — some material may be inappropriate for children under 13.</li>
                        <li><span className="font-medium">R:</span> Restricted — under 17 requires accompanying parent or adult guardian.</li>
                        <li><span className="font-medium">NC-17:</span> No one 17 and under admitted; clearly adult content.</li>
                        <li><span className="font-medium">Not Rated:</span> Not submitted for rating or not rated by the board.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        </div>
      );

      // ── CONTENT ────────────────────────────────────────────────────────
      case 'content': return (
        <div className="space-y-8">
          {/* Synopsis */}
          <div>
            <div className="mb-3">
              <h4 className="text-sm font-semibold font-montserrat text-white">Synopsis</h4>
              <p className="text-xs text-neutral-500 font-montserrat mt-0.5">A brief overview of the movie shown in listings and previews.</p>
            </div>
            <RichTextEditor
              label=""
              value={form.synopsis || ''}
              onChange={(val) => setField('synopsis', val)}
              placeholder="Write a brief movie overview..."
            />
          </div>

          {/* Plot Summary */}
          <div>
            <div className="mb-3">
              <h4 className="text-sm font-semibold font-montserrat text-white">Plot Summary</h4>
              <p className="text-xs text-neutral-500 font-montserrat mt-0.5">A detailed description of the plot — spoilers can be included here.</p>
            </div>
            <RichTextEditor
              label=""
              value={form.plotSummary || ''}
              onChange={(val) => setField('plotSummary', val)}
              placeholder="Write a detailed plot description..."
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
              {(form.cast || []).map((member, i) => {
                const isDropdownOpen = activeCastDropdown === i;
                return (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative">
                    <button type="button" onClick={() => removeCast(i)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all z-10"
                    >
                      <Icon name="XMarkIcon" size={12} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Celebrity Selection */}
                      <div className="relative" ref={el => { castDropdownRefs.current[i] = el; }}>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                          Celebrity <span className="text-yellow-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (isDropdownOpen) {
                              setActiveCastDropdown(null);
                              return;
                            }
                            setCelebritySearch('');
                            fetchCelebrities('');
                            setActiveCastDropdown(i);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {member.image && (
                              <img src={member.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <span className={member.name ? 'text-white' : 'text-neutral-500'}>
                              {member.name || 'Select celebrity...'}
                            </span>
                          </div>
                          <Icon name={isDropdownOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-lg bg-[#060316]/95 border border-white/8 backdrop-blur-sm">
                            {/* Search input inside dropdown */}
                            <div className="p-3 border-b border-white/10">
                              <div className="relative">
                                <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                  type="text"
                                  value={celebritySearch}
                                  onChange={(e) => setCelebritySearch(e.target.value)}
                                  placeholder="Search celebrities..."
                                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-xs"
                                  autoFocus
                                />
                                {loadingCelebrities && (
                                  <Icon name="ArrowPathIcon" size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 animate-spin" />
                                )}
                              </div>
                            </div>
                            
                            {/* Results */}
                            <div className="max-h-48 overflow-y-auto">
                              {celebrities.length > 0 ? (
                                celebrities.map((celebrity) => (
                                  <button
                                    key={celebrity.id}
                                    type="button"
                                    onClick={() => handleSelectCelebrity(i, celebrity)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-left"
                                  >
                                    {celebrity.profileImage ? (
                                      <img 
                                        src={celebrity.profileImage} 
                                        alt="" 
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0" 
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center">
                                        <Icon name="UserIcon" size={16} className="text-neutral-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-montserrat truncate">
                                        {celebrity.name}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-neutral-500 text-sm font-montserrat text-center">
                                  {loadingCelebrities ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Icon name="ArrowPathIcon" size={14} className="animate-spin" />
                                      Loading celebrities...
                                    </div>
                                  ) : celebritySearchError ? (
                                    <div className="text-red-400">
                                      {celebritySearchError}
                                    </div>
                                  ) : celebritySearch.trim() ? (
                                    'No celebrities found'
                                  ) : (
                                    'Start typing to search celebrities'
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                          Role
                        </label>
                        <select
                          value={member.role || ''}
                          onChange={(e) => updateCast(i, 'role', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                        >
                          <option value="">Select role...</option>
                          <option value="Lead">Lead</option>
                          <option value="Supporting">Supporting</option>
                          <option value="Cameo">Cameo</option>
                          <option value="Guest">Guest Appearance</option>
                          <option value="Voice">Voice Actor</option>
                        </select>
                      </div>

                      {/* Character Name */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                          Character Name
                        </label>
                        <input
                          type="text"
                          value={member.character || ''}
                          onChange={(e) => updateCast(i, 'character', e.target.value)}
                          placeholder="e.g. Bhairava, Karna"
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                        />
                      </div>


                    </div>
                  </div>
                );
              })}
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
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={form.anticipationScore ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setField('anticipationScore', undefined);
                  setFormErrors((p) => { const copy = { ...p }; delete copy.anticipationScore; return copy; });
                  return;
                }
                const n = Number(raw);
                if (Number.isNaN(n)) return;
                // If out of range, clamp and set an error message
                if (n < 0 || n > 10) {
                  const clamped = Math.min(10, Math.max(0, n));
                  setField('anticipationScore', clamped);
                  setFormErrors((p) => ({ ...p, anticipationScore: 'Score must be between 0 and 10' }));
                } else {
                  setField('anticipationScore', n);
                  setFormErrors((p) => { const copy = { ...p }; delete copy.anticipationScore; return copy; });
                }
              }}
              onBlur={() => {
                // Ensure final value is within bounds
                const val = form.anticipationScore;
                if (typeof val === 'number') {
                  const clamped = Math.min(10, Math.max(0, val));
                  if (clamped !== val) {
                    setField('anticipationScore', clamped);
                    setFormErrors((p) => ({ ...p, anticipationScore: 'Score must be between 0 and 10' }));
                  }
                }
              }}
              placeholder="e.g. 9.2"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border ${formErrors.anticipationScore ? 'border-red-500/60' : 'border-white/10'} text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm`}
            />
            {formErrors.anticipationScore && (
              <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.anticipationScore}</p>
            )}
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

          {/* Genre (comma-separated) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Genre (comma-separated)</label>
            <textarea value={joinComma(form.genre)} rows={2}
              onChange={(e) => setField('genre', splitComma(e.target.value))}
              placeholder={"Action, Sci-Fi, Adventure"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Regions (comma-separated) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Regions (comma-separated)</label>
            <textarea value={joinComma(form.regions)} rows={2}
              onChange={(e) => setField('regions', splitComma(e.target.value))}
              placeholder={"India, US, UK"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Writers (comma-separated) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Writers (comma-separated)</label>
            <textarea value={joinComma(form.writers)} rows={2}
              onChange={(e) => setField('writers', splitComma(e.target.value))}
              placeholder={"Nag Ashwin, Abhijeet Kumar"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Producers (comma-separated) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Producers (comma-separated)</label>
            <textarea value={joinComma(form.producers)} rows={2}
              onChange={(e) => setField('producers', splitComma(e.target.value))}
              placeholder={"Vijay Kiragandur"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          {/* Subtitles (comma-separated) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Subtitles (comma-separated)</label>
            <textarea value={joinComma(form.subtitles)} rows={2}
              onChange={(e) => setField('subtitles', splitComma(e.target.value))}
              placeholder={"English, Hindi, Tamil"}
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

      // ── IMAGES ─────────────────────────────────────────────────────────
      case 'images': {
        const canUpload = !!form.title.trim();
        return (
        <div className="space-y-6">

          {/* Upload path notice */}
          {!canUpload ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300 text-xs font-montserrat leading-relaxed">
                <span className="font-semibold">Enter the movie title first.</span>{' '}
                Images will be organised in a dedicated folder once the title is filled.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <Icon name="FolderIcon" size={14} className="text-green-400 shrink-0" />
              <p className="text-green-300 text-xs font-montserrat truncate">
                Upload path: <span className="font-semibold">movies / {movieSlug}</span>
              </p>
            </div>
          )}

          {/* ── Poster ── */}
          <div>
            <p className="text-white text-sm font-montserrat font-semibold mb-1">Poster</p>
            <p className="text-neutral-500 text-xs font-montserrat mb-3">Portrait-orientation cover image shown in listings and cards.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setPosterDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setPosterDragActive(false); }}
              onDrop={(e) => { setPosterDragActive(false); if (canUpload) handleDropPoster(e); }}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all group ${
                posterDragActive
                  ? 'border-yellow-400/60 bg-yellow-500/5'
                  : form.poster
                    ? 'border-white/10 hover:border-yellow-500/30'
                    : 'border-dashed border-white/15 hover:border-yellow-500/40 hover:bg-yellow-500/5'
              }`}
            >
              {uploadingPoster ? (
                <div className="h-52 flex flex-col items-center justify-center gap-3">
                  <Icon name="ArrowPathIcon" size={28} className="text-yellow-400 animate-spin" />
                  <p className="text-yellow-400 text-xs font-montserrat">Uploading…</p>
                </div>
              ) : form.poster ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.poster} alt="poster" className="w-full max-h-72 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={handleSelectPoster} disabled={!canUpload}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-black text-xs font-bold font-montserrat hover:bg-yellow-400 transition-all disabled:opacity-50">
                      <Icon name="ArrowUpTrayIcon" size={13} /> Replace
                    </button>
                    <button type="button" onClick={handleDeletePoster}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-montserrat hover:bg-red-500/30 hover:text-red-300 transition-all">
                      <Icon name="TrashIcon" size={13} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={() => canUpload && handleSelectPoster()}
                  disabled={!canUpload}
                  className={`w-full h-52 flex flex-col items-center justify-center gap-2 transition-colors ${
                    canUpload ? 'text-neutral-600 hover:text-yellow-400 cursor-pointer' : 'text-neutral-700 cursor-not-allowed'
                  }`}
                >
                  <Icon name="ArrowUpTrayIcon" size={28} />
                  <p className="text-xs font-montserrat">Click or drop to upload poster</p>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* ── Backdrop ── */}
          <div>
            <p className="text-white text-sm font-montserrat font-semibold mb-1">Backdrop</p>
            <p className="text-neutral-500 text-xs font-montserrat mb-3">Wide landscape image used as page hero / banner background.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setBackdropDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setBackdropDragActive(false); }}
              onDrop={(e) => { setBackdropDragActive(false); if (canUpload) { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) handleSelectBackdrop(); } }}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all group ${
                backdropDragActive
                  ? 'border-yellow-400/60 bg-yellow-500/5'
                  : form.backdrop
                    ? 'border-white/10 hover:border-yellow-500/30'
                    : 'border-dashed border-white/15 hover:border-yellow-500/40 hover:bg-yellow-500/5'
              }`}
            >
              {uploadingBackdrop ? (
                <div className="h-44 flex flex-col items-center justify-center gap-3">
                  <Icon name="ArrowPathIcon" size={28} className="text-yellow-400 animate-spin" />
                  <p className="text-yellow-400 text-xs font-montserrat">Uploading…</p>
                </div>
              ) : form.backdrop ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.backdrop} alt="backdrop" className="w-full max-h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={handleSelectBackdrop} disabled={!canUpload}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-black text-xs font-bold font-montserrat hover:bg-yellow-400 transition-all disabled:opacity-50">
                      <Icon name="ArrowUpTrayIcon" size={13} /> Replace
                    </button>
                    <button type="button" onClick={handleDeleteBackdrop}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-montserrat hover:bg-red-500/30 hover:text-red-300 transition-all">
                      <Icon name="TrashIcon" size={13} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={() => canUpload && handleSelectBackdrop()}
                  disabled={!canUpload}
                  className={`w-full h-44 flex flex-col items-center justify-center gap-2 transition-colors ${
                    canUpload ? 'text-neutral-600 hover:text-yellow-400 cursor-pointer' : 'text-neutral-700 cursor-not-allowed'
                  }`}
                >
                  <Icon name="ArrowUpTrayIcon" size={28} />
                  <p className="text-xs font-montserrat">Click or drop to upload backdrop</p>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* ── Gallery Images ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-white text-sm font-montserrat font-semibold">Gallery Images</p>
                <p className="text-neutral-500 text-xs font-montserrat mt-0.5">Additional stills, BTS photos, or promo images · Upload or paste a URL</p>
              </div>
              <button type="button" onClick={addGalleryImage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 font-montserrat text-sm font-medium transition-all">
                <Icon name="PlusIcon" size={14} /> Add Slot
              </button>
            </div>

            {(form.images || []).length === 0 ? (
              <button type="button" onClick={() => canUpload && addGalleryImage()}
                disabled={!canUpload}
                className={`mt-3 w-full py-14 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group ${
                  canUpload
                    ? 'border-white/10 hover:border-yellow-500/40 hover:bg-yellow-500/5 cursor-pointer'
                    : 'border-white/5 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="p-4 rounded-full bg-white/5 group-hover:bg-yellow-500/10 transition-all">
                  <Icon name="PhotoIcon" size={28} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-neutral-400 text-sm font-montserrat font-medium group-hover:text-white transition-colors">Click to add first image</p>
                  <p className="text-neutral-600 text-xs font-montserrat mt-0.5">or drag &amp; drop files onto any image slot</p>
                </div>
              </button>
            ) : (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(form.images || []).map((img, i) => {
                  const isUploading = !!uploadingMap[i];
                  return (
                    <div key={i}
                      onDrop={(e) => handleDropGalleryImage(e, i)}
                      onDragOver={(e) => e.preventDefault()}
                      className={`relative rounded-2xl border transition-all overflow-hidden group ${
                        isUploading
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : img
                            ? 'border-white/10 bg-white/3 hover:border-yellow-500/30'
                            : 'border-dashed border-white/15 bg-white/3 hover:border-yellow-500/40 hover:bg-yellow-500/5'
                      }`}
                    >
                      {/* Primary badge */}
                      {i === 0 && (
                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold font-montserrat shadow-lg">
                          Primary
                        </span>
                      )}
                      {/* Remove */}
                      {(form.images || []).length > 1 && (
                        <button type="button" onClick={() => removeGalleryImage(i)}
                          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                          <Icon name="TrashIcon" size={13} />
                        </button>
                      )}
                      {/* Preview */}
                      <div className="relative w-full min-h-44">
                        {isUploading ? (
                          <div className="w-full h-44 flex flex-col items-center justify-center gap-3">
                            <Icon name="ArrowPathIcon" size={28} className="text-yellow-400 animate-spin" />
                            <p className="text-yellow-400 text-xs font-montserrat font-medium">Uploading…</p>
                          </div>
                        ) : img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={`gallery-${i}`} className="w-full h-auto object-contain" />
                        ) : (
                          <button type="button" onClick={() => canUpload && handleSelectGalleryImage(i)}
                            disabled={!canUpload}
                            className={`w-full h-44 flex flex-col items-center justify-center gap-2 transition-colors ${
                              canUpload ? 'text-neutral-600 hover:text-yellow-400 cursor-pointer' : 'text-neutral-700 cursor-not-allowed'
                            }`}
                          >
                            <Icon name="ArrowUpTrayIcon" size={28} />
                            <p className="text-xs font-montserrat">Click or drop to upload</p>
                          </button>
                        )}
                        {/* Replace overlay */}
                        {img && !isUploading && canUpload && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleSelectGalleryImage(i)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-black text-xs font-bold font-montserrat hover:bg-yellow-400 transition-all">
                              <Icon name="ArrowUpTrayIcon" size={13} /> Replace
                            </button>
                          </div>
                        )}
                      </div>
                      {/* URL input row */}
                      <div className="px-3 py-3 border-t border-white/10 bg-black/20 flex items-center gap-2">
                        <input type="url" value={img}
                          onChange={(e) => updateGalleryImage(i, e.target.value)}
                          placeholder="Paste URL or upload above…"
                          className="flex-1 min-w-0 bg-transparent text-white text-xs font-montserrat placeholder-neutral-600 focus:outline-none truncate"
                        />
                        <button type="button" onClick={() => handleSelectGalleryImage(i)}
                          disabled={isUploading || !canUpload}
                          className="shrink-0 p-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/30 transition-all disabled:opacity-40">
                          <Icon name="ArrowUpTrayIcon" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Add another ghost card */}
                <button type="button" onClick={addGalleryImage}
                  className="rounded-2xl border-2 border-dashed border-white/10 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all flex flex-col items-center justify-center gap-2 h-full min-h-[220px] text-neutral-600 hover:text-yellow-400 group">
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-yellow-500/10 transition-all">
                    <Icon name="PlusIcon" size={20} />
                  </div>
                  <p className="text-xs font-montserrat">Add image</p>
                </button>
              </div>
            )}
          </div>

        </div>
      );
      }

      // ── SEO ────────────────────────────────────────────────────────────
      case 'seo': {
        const seo    = form.seoData || EMPTY_MOVIE_SEO;
        const setSeo = <K extends keyof IMovieSEO>(k: K, v: IMovieSEO[K]) => setSeoField(k, v);

        const metaTitleLen = (seo.metaTitle       || '').length;
        const metaDescLen  = (seo.metaDescription || '').length;
        const titleScore   = metaTitleLen === 0 ? 'empty' : metaTitleLen <= 60  ? 'good' : 'long';
        const descScore    = metaDescLen  === 0 ? 'empty' : metaDescLen  <= 160 ? 'good' : 'long';
        const scoreColor   = (s: string) =>
          s === 'good' ? 'text-emerald-400' : s === 'long' ? 'text-amber-400' : 'text-neutral-600';
        const scoreLabel   = (s: string, len: number, max: number) =>
          s === 'empty' ? 'Not set' : s === 'good' ? `${len}/${max} ✓ Good` : `${len}/${max} — Too long`;

        const filledCount = [seo.focusKeyword, seo.metaTitle, seo.metaDescription, seo.canonicalUrl,
          seo.ogTitle, seo.ogImage, seo.twitterTitle, seo.twitterImage, seo.schemaType].filter(Boolean).length;
        const filledPct = Math.round((filledCount / 9) * 100);

        return (
          <div className="space-y-7">

            {/* Score bar */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
              <Icon name="MagnifyingGlassIcon" size={18} className="text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm font-montserrat font-semibold">SEO Configuration</p>
                <p className="text-neutral-500 text-xs font-montserrat mt-0.5">Fill all fields for maximum Google discoverability</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-yellow-400 text-xs font-montserrat font-bold">{filledPct}%</p>
                <p className="text-neutral-600 text-xs font-montserrat">filled</p>
              </div>
            </div>

            <div className="border-t border-white/8" />

            {/* On-Page SEO */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold text-white font-montserrat">On-Page SEO</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Directly impacts your Google search snippet.</p>
              <div className="space-y-4">

                {/* Focus keyword */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Focus Keyword</label>
                  <input
                    type="text" value={seo.focusKeyword || ''}
                    onChange={(e) => setSeo('focusKeyword', e.target.value)}
                    placeholder="e.g. Dhanush upcoming movie 2026"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">The single phrase you most want to rank for.</p>
                </div>

                {/* Meta title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Meta Title</label>
                    <span className={`text-[10px] font-montserrat ${scoreColor(titleScore)}`}>
                      {scoreLabel(titleScore, metaTitleLen, 60)}
                    </span>
                  </div>
                  <input
                    type="text" value={seo.metaTitle || ''}
                    onChange={(e) => setSeo('metaTitle', e.target.value)}
                    placeholder={`${form.title || 'Movie Title'} — Celebrity Persona`}
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${
                      titleScore === 'long' ? 'border-amber-500/40 focus:border-amber-500/60' :
                      titleScore === 'good' ? 'border-emerald-500/30 focus:border-emerald-500/60' : 'border-white/10 focus:border-yellow-500/60'
                    }`}
                  />
                  <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      titleScore === 'good' ? 'bg-emerald-500' : titleScore === 'long' ? 'bg-amber-500' : 'bg-neutral-700'
                    }`} style={{ width: `${Math.min(100, (metaTitleLen / 60) * 100)}%` }} />
                  </div>
                </div>

                {/* Meta description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Meta Description (140–160 chars)</label>
                    <span className={`text-[10px] font-montserrat ${scoreColor(descScore)}`}>
                      {scoreLabel(descScore, metaDescLen, 160)}
                    </span>
                  </div>
                  <textarea
                    rows={3} value={seo.metaDescription || ''}
                    onChange={(e) => setSeo('metaDescription', e.target.value)}
                    placeholder="A short, compelling description for Google search results. Include the focus keyword naturally."
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all resize-none ${
                      descScore === 'long' ? 'border-amber-500/40 focus:border-amber-500/60' :
                      descScore === 'good' ? 'border-emerald-500/30 focus:border-emerald-500/60' : 'border-white/10 focus:border-yellow-500/60'
                    }`}
                  />
                  <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      descScore === 'good' ? 'bg-emerald-500' : descScore === 'long' ? 'bg-amber-500' : 'bg-neutral-700'
                    }`} style={{ width: `${Math.min(100, (metaDescLen / 160) * 100)}%` }} />
                  </div>
                </div>

                {/* Secondary keywords */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Secondary Keywords (one per line)</label>
                  <textarea
                    rows={3} value={joinLines(seo.keywords)}
                    onChange={(e) => setSeo('keywords', splitLines(e.target.value))}
                    placeholder={"upcoming hindi movies 2026\nbollywood action film\nleading actor movie"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(seo.keywords || []).length} keywords</p>
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Canonical URL</label>
                  <input
                    type="url" value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeo('canonicalUrl', e.target.value)}
                    placeholder={`https://yoursite.com/upcoming-movies/${form.slug || 'movie-slug'}`}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Prevents duplicate-content penalties. Leave blank to use the page URL.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* Open Graph */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Open Graph (Facebook / LinkedIn)</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Controls how the page looks when shared on social media.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Title</label>
                  <input
                    type="text" value={seo.ogTitle || ''}
                    onChange={(e) => setSeo('ogTitle', e.target.value)}
                    placeholder={seo.metaTitle || `${form.title || 'Movie Title'} — Celebrity Persona`}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Description</label>
                  <textarea
                    rows={2} value={seo.ogDescription || ''}
                    onChange={(e) => setSeo('ogDescription', e.target.value)}
                    placeholder={seo.metaDescription || 'A compelling description for social sharing…'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Image</label>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all mb-2 ${
                    ogImageUpload.uploading ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}>
                    <input type="file" accept="image/*" className="sr-only" disabled={ogImageUpload.uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOgImageUpload(f); e.target.value = ''; }}
                    />
                    {ogImageUpload.uploading ? (
                      <><span className="text-yellow-400 text-sm font-montserrat">Uploading…</span>
                        <div className="ml-auto h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${ogImageUpload.progress}%` }} />
                        </div>
                      </>
                    ) : (
                      <><span className="text-2xl">🖼️</span>
                        <div>
                          <p className="text-sm text-white font-montserrat font-medium">Upload OG Image</p>
                          <p className="text-xs text-neutral-500 font-montserrat">Uploads to Firebase · 1200 × 630 px recommended</p>
                        </div>
                        {seo.ogImage && <span className="ml-auto text-[10px] text-emerald-400 font-montserrat">✓ Set</span>}
                      </>
                    )}
                  </label>
                  {ogImageUpload.error && <p className="text-red-400 text-xs font-montserrat mb-2">{ogImageUpload.error}</p>}
                  <input
                    type="url" value={seo.ogImage || ''}
                    onChange={(e) => setSeo('ogImage', e.target.value)}
                    placeholder="Or paste an image URL (https://…)"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  {seo.ogImage && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10 h-28 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={seo.ogImage} alt="OG preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setSeo('ogImage', '')}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-all">✕</button>
                    </div>
                  )}
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to default to the movie poster.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* Twitter / X Card */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Twitter / X Card</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Controls appearance in Twitter / X previews.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">Card Type</label>
                  <div className="flex gap-3">
                    {(['summary', 'summary_large_image'] as const).map((type) => (
                      <button key={type} type="button"
                        onClick={() => setSeo('twitterCard', type)}
                        className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-montserrat font-medium transition-all ${
                          seo.twitterCard === type
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}>
                        {type === 'summary' ? '□  Summary' : '▬  Large Image'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Creator Handle</label>
                  <input
                    type="text" value={seo.twitterCreator || ''}
                    onChange={(e) => setSeo('twitterCreator', e.target.value)}
                    placeholder="@handle"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Title</label>
                  <input
                    type="text" value={seo.twitterTitle || ''}
                    onChange={(e) => setSeo('twitterTitle', e.target.value)}
                    placeholder={seo.metaTitle || form.title || 'Movie Title'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to inherit Meta Title.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Description</label>
                  <textarea
                    rows={2} value={seo.twitterDescription || ''}
                    onChange={(e) => setSeo('twitterDescription', e.target.value)}
                    placeholder={seo.metaDescription || 'Description shown in Twitter card preview…'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to inherit Meta Description.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Image</label>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all mb-2 ${
                    twitterImageUpload.uploading ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}>
                    <input type="file" accept="image/*" className="sr-only" disabled={twitterImageUpload.uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTwitterImageUpload(f); e.target.value = ''; }}
                    />
                    {twitterImageUpload.uploading ? (
                      <><span className="text-yellow-400 text-sm font-montserrat">Uploading…</span>
                        <div className="ml-auto h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${twitterImageUpload.progress}%` }} />
                        </div>
                      </>
                    ) : (
                      <><span className="text-2xl">🐦</span>
                        <div>
                          <p className="text-sm text-white font-montserrat font-medium">Upload Twitter Image</p>
                          <p className="text-xs text-neutral-500 font-montserrat">Uploads to Firebase · min 120×120; large card: 1200×600 px</p>
                        </div>
                        {seo.twitterImage && <span className="ml-auto text-[10px] text-emerald-400 font-montserrat">✓ Set</span>}
                      </>
                    )}
                  </label>
                  {twitterImageUpload.error && <p className="text-red-400 text-xs font-montserrat mb-2">{twitterImageUpload.error}</p>}
                  <input
                    type="url" value={seo.twitterImage || ''}
                    onChange={(e) => setSeo('twitterImage', e.target.value)}
                    placeholder={seo.ogImage || 'Or paste an image URL (https://…)'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  {seo.twitterImage && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10 h-28 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={seo.twitterImage} alt="Twitter image preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setSeo('twitterImage', '')}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-all">✕</button>
                    </div>
                  )}
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to fall back to OG Image.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* Structured Data */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Structured Data (Schema.org)</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Enables rich results and enhanced snippets in Google.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Schema Type</label>
                  <select
                    value={seo.schemaType || 'Movie'}
                    onChange={(e) => setSeo('schemaType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                  >
                    {['Movie', 'VideoObject', 'CreativeWork', 'Article'].map((t) => (
                      <option key={t} value={t} style={{ background: '#2b1433' }}>{t}</option>
                    ))}
                  </select>
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Use Movie for theatrical releases, VideoObject for streaming.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Genre / Section</label>
                  <input
                    type="text" value={seo.articleSection || ''}
                    onChange={(e) => setSeo('articleSection', e.target.value)}
                    placeholder="Action, Drama, Thriller…"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Director / Author Name</label>
                  <input
                    type="text" value={seo.authorName || ''}
                    onChange={(e) => setSeo('authorName', e.target.value)}
                    placeholder="e.g. S.S. Rajamouli"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Director / Author URL</label>
                  <input
                    type="url" value={seo.authorUrl || ''}
                    onChange={(e) => setSeo('authorUrl', e.target.value)}
                    placeholder="https://example.com/directors/ss-rajamouli"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Related Topics (one per line)</label>
                  <textarea
                    rows={3} value={joinLines(seo.relatedTopics)}
                    onChange={(e) => setSeo('relatedTopics', splitLines(e.target.value))}
                    placeholder={"Prabhas\nDeepika Padukone\nfuturistic Hindi film"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Used for semantic SEO connections.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Custom JSON-LD (optional)</label>
                  <textarea
                    rows={5} value={seo.structuredData || ''}
                    onChange={(e) => setSeo('structuredData', e.target.value)}
                    placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Movie",\n  "name": "Movie Title"\n}'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none font-mono"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to auto-generate from movie data.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* Robots / Crawlability */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Robots / Crawlability</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Controls what Googlebot and other crawlers are allowed to do on this page.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border transition-all ${
                  seo.robotsIndex !== false ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-montserrat text-white">Index this page</p>
                      <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Allow Google to include it in search results</p>
                    </div>
                    <button type="button" onClick={() => setSeo('robotsIndex', !(seo.robotsIndex !== false))}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsIndex !== false ? 'bg-emerald-500' : 'bg-white/10'
                      }`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsIndex !== false ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsIndex !== false ? 'text-emerald-400' : 'text-red-400'
                  }`}>{seo.robotsIndex !== false ? 'index' : 'noindex'}</p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${
                  seo.robotsFollow !== false ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-amber-500/8 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-montserrat text-white">Follow links</p>
                      <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Allow crawlers to follow links on this page</p>
                    </div>
                    <button type="button" onClick={() => setSeo('robotsFollow', !(seo.robotsFollow !== false))}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsFollow !== false ? 'bg-emerald-500' : 'bg-white/10'
                      }`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsFollow !== false ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsFollow !== false ? 'text-emerald-400' : 'text-amber-400'
                  }`}>{seo.robotsFollow !== false ? 'follow' : 'nofollow'}</p>
                </div>
              </div>
              <div className="mt-3 px-3 py-2 rounded-xl bg-black/30 border border-white/8">
                <p className="text-[10px] text-neutral-500 font-montserrat">Generated tag preview:</p>
                <code className="text-xs text-yellow-300/80 font-mono">
                  {`<meta name="robots" content="${seo.robotsIndex !== false ? 'index' : 'noindex'}, ${seo.robotsFollow !== false ? 'follow' : 'nofollow'}" />`}
                </code>
              </div>
            </section>

          </div>
        );
      }
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
      {!panelMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const now = new Date();
            const RELEASED_STATUSES = ['Released', 'Now Showing', 'Now Playing', 'In Theatres', 'In Theaters'];
            const isRel = (m: MovieRow) => {
              if (RELEASED_STATUSES.some(s => s.toLowerCase() === (m.status || '').toLowerCase())) return true;
              if (m.releaseDate) { const d = new Date(m.releaseDate); if (!isNaN(d.getTime()) && d <= now) return true; }
              return false;
            };
            const upcomingCount = movies.filter(m => !isRel(m)).length;
            const releasedCount = movies.filter(m => isRel(m)).length;
            return [
              { label: 'Total',      value: total,          icon: 'FilmIcon',       color: 'text-yellow-400'  },
              { label: 'Published',  value: movies.filter(m => m.status === 'published').length, icon: 'CheckBadgeIcon', color: 'text-emerald-400' },
              { label: 'Upcoming',   value: upcomingCount,  icon: 'CalendarIcon',   color: 'text-sky-400'     },
              { label: 'Released',   value: releasedCount,  icon: 'SparklesIcon',   color: 'text-purple-400'  },
            ];
          })().map((s) => (
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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchList(1); }}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer w-full md:w-44"
          >
            <option value="" style={{ background: '#2b1433' }}>All statuses</option>
            <option value="published"    style={{ background: '#2b1433' }}>Published</option>
            <option value="draft"        style={{ background: '#2b1433' }}>Draft</option>
            <option value="announced"    style={{ background: '#2b1433' }}>Announced</option>
            <option value="filming"      style={{ background: '#2b1433' }}>Filming</option>
            <option value="post-production" style={{ background: '#2b1433' }}>Post-production</option>
            <option value="upcoming"     style={{ background: '#2b1433' }}>Upcoming</option>
            <option value="released"     style={{ background: '#2b1433' }}>Released</option>
            <option value="cancelled"    style={{ background: '#2b1433' }}>Cancelled</option>
          </select>
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
          {panelMode ? (
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
      {!panelMode && fetchError && (
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 shrink-0">
                <Icon name={panelMode === 'add' ? 'PlusCircleIcon' : 'PencilSquareIcon'} size={20} className="text-yellow-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-playfair text-base sm:text-lg font-bold text-white truncate">
                  {panelMode === 'add' ? 'Add Movie' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in movie details across tabs' : 'Update movie details'}
                </p>
              </div>
            </div>
            <button onClick={closePanel} className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all self-end sm:self-auto">
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <p className="text-neutral-600 text-xs font-montserrat">* Required fields</p>
                  {form.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-montserrat capitalize ${
                      STATUS_COLORS[form.status] || 'bg-neutral-500/20 text-neutral-400'
                    }`}>
                      {form.status}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 sm:ml-auto">
                  <button type="button" onClick={closePanel}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveDraft} disabled={draftLoading || formLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-semibold font-montserrat text-sm hover:bg-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {draftLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {draftLoading ? 'Saving Draft...' : 'Save as Draft'}
                  </button>
                  <button type="submit" disabled={formLoading || draftLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {formLoading
                      ? (panelMode === 'add' ? 'Publishing...' : 'Saving...')
                      : (panelMode === 'add' ? 'Publish Movie' : 'Save & Publish')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tables — split into Upcoming vs Released */}
      {!panelMode && (() => {
        const now = new Date();
        const RELEASED_STATUSES = ['Released', 'Now Showing', 'Now Playing', 'In Theatres', 'In Theaters'];

        const isReleased = (m: MovieRow) => {
          if (RELEASED_STATUSES.some(s => s.toLowerCase() === (m.status || '').toLowerCase())) return true;
          if (m.releaseDate) {
            const d = new Date(m.releaseDate);
            if (!isNaN(d.getTime()) && d <= now) return true;
          }
          return false;
        };

        const upcomingMovies = movies.filter(m => !isReleased(m));
        const releasedMovies = movies.filter(m => isReleased(m));

        const MovieTableRows = ({ rows, emptyLabel }: { rows: MovieRow[]; emptyLabel: string }) => (
          <>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Icon name="FilmIcon" size={32} className="mx-auto mb-2 text-neutral-700" />
                  <p className="text-neutral-500 font-montserrat text-sm">{emptyLabel}</p>
                </td>
              </tr>
            ) : (
              rows.map((m) => (
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
                          {Array.isArray(m.language) ? m.language.join('·') : (m.language || '—')}{m.duration ? ` · ${m.duration} min` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Director */}
                  <td className="py-3.5 px-3 hidden md:table-cell">
                    <p className="text-neutral-300 text-sm font-montserrat">{m.director || '—'}</p>
                  </td>
                  {/* Status */}
                  <td className="py-3.5 px-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-1.5">
                      {m.status && m.status !== 'draft' && m.status !== 'published' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-montserrat capitalize ${
                          STATUS_COLORS[m.status] || 'bg-neutral-500/10 text-neutral-400'
                        }`}>{m.status}</span>
                      )}
                      <div className="inline-flex rounded-lg overflow-hidden border border-white/10">
                        <button
                          onClick={() => handleStatusToggle(m, 'draft')}
                          disabled={!!busyMap[m.id]}
                          title="Set to Draft"
                          className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                            (m.status || 'draft') === 'draft'
                              ? 'bg-yellow-500/25 text-yellow-300'
                              : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                          }`}
                        >Draft</button>
                        <button
                          onClick={() => handleStatusToggle(m, 'published')}
                          disabled={!!busyMap[m.id]}
                          title="Set to Published"
                          className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                            m.status === 'published'
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                          }`}
                        >Published</button>
                      </div>
                    </div>
                  </td>
                  {/* Release Date */}
                  <td className="py-3.5 px-3 hidden lg:table-cell">
                    <p className="text-neutral-400 text-xs font-montserrat">{formatDate(m.releaseDate)}</p>
                  </td>
                  {/* Featured */}
                  <td className="py-3.5 px-3 hidden sm:table-cell">
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
              ))
            )}
          </>
        );

        const TableHead = () => (
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Movie</th>
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden md:table-cell">Director</th>
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden lg:table-cell">Release Date</th>
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Featured</th>
              <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
        );

        return (
          <div className="space-y-6">
            {/* ── Upcoming Movies ── */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                    <Icon name="CalendarIcon" size={16} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-bold text-white">Upcoming Movies</h3>
                    <p className="text-neutral-500 text-xs font-montserrat">Release date is in the future or not yet set</p>
                  </div>
                  {!loading && (
                    <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-montserrat bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {upcomingMovies.length}
                    </span>
                  )}
                </div>
                {!loading && (
                  <span className="text-neutral-500 text-xs font-montserrat shrink-0">
                    {upcomingMovies.length} movie{upcomingMovies.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHead />
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
                      : <MovieTableRows rows={upcomingMovies} emptyLabel="No upcoming movies found" />
                    }
                  </tbody>
                </table>
              </div>

              {!loading && upcomingMovies.length === 0 && !fetchError && (
                <div className="mt-4 text-center">
                  <button onClick={openAdd} className="text-yellow-400 text-sm font-montserrat hover:underline">
                    + Add an upcoming movie
                  </button>
                </div>
              )}
            </div>

            {/* ── Released Movies ── */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Icon name="CheckBadgeIcon" size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-bold text-white">Already Released</h3>
                    <p className="text-neutral-500 text-xs font-montserrat">Release date has passed or marked as released</p>
                  </div>
                  {!loading && (
                    <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-montserrat bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {releasedMovies.length}
                    </span>
                  )}
                </div>
                {!loading && (
                  <span className="text-neutral-500 text-xs font-montserrat shrink-0">
                    {releasedMovies.length} movie{releasedMovies.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHead />
                  <tbody>
                    {loading
                      ? skeletonRows.slice(0, 3).map((_, i) => (
                          <tr key={i} className="border-b border-white/5">
                            {[220, 130, 100, 90, 60, 70].map((w, j) => (
                              <td key={j} className="py-3.5 px-3">
                                <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      : <MovieTableRows rows={releasedMovies} emptyLabel="No released movies on this page" />
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination (shared — applies to the full result set) */}
            {pages > 1 && (
              <div className="glass-card rounded-2xl px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              </div>
            )}
          </div>
        );
      })()}

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
