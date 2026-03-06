'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
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
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  structuredData?: string;
  focusKeyword?: string;
  altText?: string;
  imageDescription?: string;
  robots?: string;
  priority?: number;
  changeFreq?: string;
}

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  director?: string;
  status?: string;
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

type FormTab = 'basic' | 'cast' | 'details' | 'images' | 'seo';
type PanelMode = 'add' | 'edit' | null;
type Toast = { type: 'success' | 'error'; message: string } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50];

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info', icon: 'FilmIcon'   },
  { key: 'cast',    label: 'Cast',       icon: 'UsersIcon'  },
  { key: 'details', label: 'Details',    icon: 'TagIcon'    },
  { key: 'images',  label: 'Images',     icon: 'PhotoIcon'  },
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
  seoData: { 
    metaTitle: '', 
    metaDescription: '', 
    keywords: [], 
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'movie',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCard: 'summary_large_image',
    structuredData: '',
    focusKeyword: '',
    altText: '',
    imageDescription: '',
    robots: 'index,follow',
    priority: 0.8,
    changeFreq: 'weekly'
  },
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

      setForm({
        id:                  d._id || d.id,
        title:               d.title               || '',
        slug:                d.slug                || '',
        director:            d.director            || '',
        status:              d.status              || '',
        language:            d.language            || [],
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
        seoData:             d.seoData             || { 
          metaTitle: '', 
          metaDescription: '', 
          keywords: [], 
          canonicalUrl: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          ogType: 'movie',
          twitterTitle: '',
          twitterDescription: '',
          twitterImage: '',
          twitterCard: 'summary_large_image',
          structuredData: '',
          focusKeyword: '',
          altText: '',
          imageDescription: '',
          robots: 'index,follow',
          priority: 0.8,
          changeFreq: 'weekly'
        },
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
    status:              form.status?.trim()             || undefined,
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
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFileUpload(files, 'additional');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files, 'additional');
    }
    // Reset input
    e.target.value = '';
  };

  const handleSelectImageType = (type: 'poster' | 'backdrop' | 'additional') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = type === 'additional';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        handleFileUpload(files, type);
      }
    };
    input.click();
  };

  const handleFileUpload = async (files: File[], type: 'poster' | 'backdrop' | 'additional') => {
    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation) {
        showToast('error', validation);
        continue;
      }

      const uploadKey = type === 'additional' ? `additional-${Date.now()}` : type;
      setUploading(prev => ({ ...prev, [uploadKey]: true }));

      try {
        const url = await uploadImage(file, 'movies');
        
        if (type === 'poster') {
          if (form.poster) {
            await deleteImage(form.poster); // Delete old poster
          }
          setField('poster', url);
        } else if (type === 'backdrop') {
          if (form.backdrop) {
            await deleteImage(form.backdrop); // Delete old backdrop
          }
          setField('backdrop', url);
        } else {
          // Additional images
          const currentImages = form.images || [];
          setField('images', [...currentImages, url]);
        }

        showToast('success', `${type} uploaded successfully`);
      } catch (error) {
        showToast('error', `Failed to upload ${type}`);
        console.error('Upload error:', error);
      } finally {
        setUploading(prev => ({ ...prev, [uploadKey]: false }));
      }
    }
  };

  const handleDeleteImage = async (type: 'poster' | 'backdrop') => {
    const imageUrl = type === 'poster' ? form.poster : form.backdrop;
    if (!imageUrl) return;

    try {
      await deleteImage(imageUrl);
      setField(type, '');
      showToast('success', `${type} deleted`);
    } catch (error) {
      showToast('error', `Failed to delete ${type}`);
    }
  };

  const handleReplaceImage = (type: 'poster' | 'backdrop') => {
    handleSelectImageType(type);
  };

  const handleDeleteAdditionalImage = async (index: number) => {
    const images = form.images || [];
    const imageUrl = images[index];
    
    if (imageUrl) {
      try {
        await deleteImage(imageUrl);
        const newImages = images.filter((_, i) => i !== index);
        setField('images', newImages);
        showToast('success', 'Image deleted');
      } catch (error) {
        showToast('error', 'Failed to delete image');
      }
    }
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
      if (celebritySearch !== '') {
        fetchCelebrities(celebritySearch);
      }
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
    setCelebrities([]); // Clear search results
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
                          onClick={() => setActiveCastDropdown(isDropdownOpen ? null : i)}
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

                      {/* Manual Image URL Override */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                          Custom Image (Optional)
                        </label>
                        <input
                          type="url"
                          value={member.image || ''}
                          onChange={(e) => updateCast(i, 'image', e.target.value)}
                          placeholder="Override celebrity image..."
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                        />
                        <p className="text-neutral-500 text-xs mt-1 font-montserrat">
                          Leave empty to use celebrity's profile image
                        </p>
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
      case 'images': return (
        <div className="space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-4">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Movie Images
            </label>
            
            {/* Drag and Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-yellow-400 bg-yellow-500/10' 
                  : 'border-white/20 hover:border-white/40 bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-white/10">
                  <Icon name="ArrowUpTrayIcon" size={32} className="text-neutral-400" />
                </div>
                <div>
                  <p className="text-white font-montserrat font-medium">Drop images here or click to select</p>
                  <p className="text-neutral-500 text-sm font-montserrat mt-1">
                    Support: JPG, PNG, WebP (max 5MB each)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Images Grid */}
          <div className="space-y-4">
            {/* Poster */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">
                Poster Image
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {form.poster ? (
                  <div className="relative group">
                    <img 
                      src={form.poster} 
                      alt="Poster" 
                      className="w-full h-48 object-cover rounded-xl border border-white/10" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('poster')}
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplaceImage('poster')}
                        className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                        title="Replace"
                      >
                        <Icon name="ArrowPathIcon" size={16} />
                      </button>
                    </div>
                    {uploading.poster && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <Icon name="ArrowPathIcon" size={24} className="text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => handleSelectImageType('poster')}
                    className="h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all"
                  >
                    <Icon name="PhotoIcon" size={32} className="text-neutral-500 mb-2" />
                    <p className="text-neutral-500 text-sm font-montserrat">Add Poster</p>
                  </div>
                )}
              </div>
            </div>

            {/* Backdrop */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">
                Backdrop Image
              </label>
              <div className="grid grid-cols-1 gap-4">
                {form.backdrop ? (
                  <div className="relative group">
                    <img 
                      src={form.backdrop} 
                      alt="Backdrop" 
                      className="w-full h-40 object-cover rounded-xl border border-white/10" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('backdrop')}
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplaceImage('backdrop')}
                        className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                        title="Replace"
                      >
                        <Icon name="ArrowPathIcon" size={16} />
                      </button>
                    </div>
                    {uploading.backdrop && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <Icon name="ArrowPathIcon" size={24} className="text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => handleSelectImageType('backdrop')}
                    className="h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all"
                  >
                    <Icon name="PhotoIcon" size={32} className="text-neutral-500 mb-2" />
                    <p className="text-neutral-500 text-sm font-montserrat">Add Backdrop</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Images Gallery */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">
                Additional Images ({(form.images || []).length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(form.images || []).map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Gallery ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-xl border border-white/10" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteAdditionalImage(index)}
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                    </div>
                    {uploading[`additional-${index}`] && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <Icon name="ArrowPathIcon" size={20} className="text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add more images button */}
                <div 
                  onClick={() => handleSelectImageType('additional')}
                  className="h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all"
                >
                  <Icon name="PlusIcon" size={24} className="text-neutral-500 mb-1" />
                  <p className="text-neutral-500 text-xs font-montserrat">Add Image</p>
                </div>
              </div>
            </div>

            {/* Upload Progress Info */}
            {Object.values(uploading).some(Boolean) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Icon name="ArrowUpTrayIcon" size={16} className="text-yellow-400 animate-pulse" />
                <p className="text-yellow-400 text-sm font-montserrat">
                  Uploading images to Firebase Storage...
                </p>
              </div>
            )}
          </div>
        </div>
      );

      // ── SEO ────────────────────────────────────────────────────────────
      case 'seo': return (
        <div className="space-y-6">
          {/* Basic Meta Tags */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Basic Meta Tags</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                  Meta Title <span className="text-yellow-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={form.seoData?.metaTitle || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, metaTitle: e.target.value })}
                  placeholder="Amazing Movie Title | Best Movies 2024"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                  maxLength={60}
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">
                  {60 - (form.seoData?.metaTitle?.length || 0)} characters remaining (60 max recommended)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                  Meta Description <span className="text-yellow-400">*</span>
                </label>
                <textarea 
                  value={form.seoData?.metaDescription || ''} 
                  rows={3}
                  onChange={(e) => setField('seoData', { ...form.seoData, metaDescription: e.target.value })}
                  placeholder="Compelling description of the movie that encourages users to click. Include main keywords naturally."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                  maxLength={160}
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">
                  {160 - (form.seoData?.metaDescription?.length || 0)} characters remaining (160 max recommended)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                  Focus Keyword <span className="text-yellow-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={form.seoData?.focusKeyword || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, focusKeyword: e.target.value })}
                  placeholder="main target keyword"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Primary keyword to rank for</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Keywords</label>
                <textarea
                  value={joinLines(form.seoData?.keywords)} 
                  rows={3}
                  onChange={(e) => setField('seoData', { ...form.seoData, keywords: splitLines(e.target.value) })}
                  placeholder={"movie name 2024\nactor name movies\nbollywood action movie\nlatest hindi films"}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">One keyword per line. Focus on long-tail keywords</p>
              </div>
            </div>
          </div>

          {/* Open Graph Tags */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Open Graph (Facebook/LinkedIn)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Title</label>
                <input 
                  type="text" 
                  value={form.seoData?.ogTitle || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, ogTitle: e.target.value })}
                  placeholder="Title for social media sharing"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Type</label>
                <select 
                  value={form.seoData?.ogType || 'movie'}
                  onChange={(e) => setField('seoData', { ...form.seoData, ogType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                >
                  <option value="movie">Movie</option>
                  <option value="video.movie">Video Movie</option>
                  <option value="article">Article</option>
                  <option value="website">Website</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Description</label>
                <textarea 
                  value={form.seoData?.ogDescription || ''} 
                  rows={2}
                  onChange={(e) => setField('seoData', { ...form.seoData, ogDescription: e.target.value })}
                  placeholder="Description for social media sharing"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Image URL</label>
                <input 
                  type="url" 
                  value={form.seoData?.ogImage || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, ogImage: e.target.value })}
                  placeholder="https://example.com/movie-poster.jpg"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Recommended: 1200x630px, less than 1MB</p>
              </div>
            </div>
          </div>

          {/* Twitter Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Twitter Cards</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Card Type</label>
                <select 
                  value={form.seoData?.twitterCard || 'summary_large_image'}
                  onChange={(e) => setField('seoData', { ...form.seoData, twitterCard: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="app">App</option>
                  <option value="player">Player</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Title</label>
                <input 
                  type="text" 
                  value={form.seoData?.twitterTitle || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, twitterTitle: e.target.value })}
                  placeholder="Title for Twitter sharing"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Description</label>
                <textarea 
                  value={form.seoData?.twitterDescription || ''} 
                  rows={2}
                  onChange={(e) => setField('seoData', { ...form.seoData, twitterDescription: e.target.value })}
                  placeholder="Description for Twitter sharing"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Twitter Image URL</label>
                <input 
                  type="url" 
                  value={form.seoData?.twitterImage || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, twitterImage: e.target.value })}
                  placeholder="https://example.com/twitter-image.jpg"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Recommended: 1200x675px for large image card</p>
              </div>
            </div>
          </div>

          {/* Technical SEO */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Technical SEO</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Canonical URL</label>
                <input 
                  type="url" 
                  value={form.seoData?.canonicalUrl || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, canonicalUrl: e.target.value })}
                  placeholder="https://example.com/movie-slug"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Preferred URL for this page</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Robots Meta</label>
                <select 
                  value={form.seoData?.robots || 'index,follow'}
                  onChange={(e) => setField('seoData', { ...form.seoData, robots: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                >
                  <option value="index,follow">Index, Follow</option>
                  <option value="index,nofollow">Index, No Follow</option>
                  <option value="noindex,follow">No Index, Follow</option>
                  <option value="noindex,nofollow">No Index, No Follow</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Priority</label>
                <select 
                  value={form.seoData?.priority || 0.8}
                  onChange={(e) => setField('seoData', { ...form.seoData, priority: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                >
                  <option value={1.0}>1.0 (Highest)</option>
                  <option value={0.9}>0.9</option>
                  <option value={0.8}>0.8 (High)</option>
                  <option value={0.7}>0.7</option>
                  <option value={0.6}>0.6 (Medium)</option>
                  <option value={0.5}>0.5</option>
                  <option value={0.4}>0.4 (Low)</option>
                  <option value={0.3}>0.3</option>
                  <option value={0.2}>0.2</option>
                  <option value={0.1}>0.1 (Lowest)</option>
                </select>
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Sitemap priority (0.1 - 1.0)</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Change Frequency</label>
                <select 
                  value={form.seoData?.changeFreq || 'weekly'}
                  onChange={(e) => setField('seoData', { ...form.seoData, changeFreq: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                >
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">How often content changes</p>
              </div>
            </div>
          </div>

          {/* Image SEO */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Image SEO</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Alt Text</label>
                <input 
                  type="text" 
                  value={form.seoData?.altText || ''}
                  onChange={(e) => setField('seoData', { ...form.seoData, altText: e.target.value })}
                  placeholder="Descriptive alt text for poster image"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Alt text for main poster image</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Image Description</label>
                <textarea 
                  value={form.seoData?.imageDescription || ''} 
                  rows={2}
                  onChange={(e) => setField('seoData', { ...form.seoData, imageDescription: e.target.value })}
                  placeholder="Detailed description of the movie poster for accessibility"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
                />
                <p className="text-neutral-500 text-xs mt-1 font-montserrat">Detailed image description for screen readers</p>
              </div>
            </div>
          </div>

          {/* Structured Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2">Structured Data (JSON-LD)</h4>
            
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Custom Structured Data</label>
              <textarea 
                value={form.seoData?.structuredData || ''} 
                rows={6}
                onChange={(e) => setField('seoData', { ...form.seoData, structuredData: e.target.value })}
                placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Movie",\n  "name": "Movie Title",\n  "director": "Director Name",\n  "actor": ["Actor 1", "Actor 2"]\n}`}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none font-mono"
              />
              <div className="flex items-start gap-2 mt-2">
                <Icon name="InformationCircleIcon" size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-neutral-500 text-xs font-montserrat">
                  <p>Add custom JSON-LD structured data for rich snippets.</p>
                  <p className="mt-1">Leave empty to auto-generate from movie data.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Tips */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon name="LightBulbIcon" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-yellow-400 font-semibold font-montserrat text-sm mb-2">SEO Best Practices</h5>
                <ul className="text-neutral-300 text-xs font-montserrat space-y-1">
                  <li>• Use your focus keyword in title, description, and H1</li>
                  <li>• Keep titles under 60 characters, descriptions under 160</li>
                  <li>• Use unique titles and descriptions for each page</li>
                  <li>• Include emotional triggers and call-to-actions</li>
                  <li>• Optimize images with descriptive file names and alt text</li>
                  <li>• Add structured data for rich snippets in search results</li>
                </ul>
              </div>
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
