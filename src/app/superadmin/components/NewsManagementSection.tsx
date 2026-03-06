"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/imageUpload';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface INewsSEO {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogImages?: string[];
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  authorName?: string;
  authorUrl?: string;
  section?: string;
  relatedTopics?: string[];
  schemaType?: string;
  structuredData?: string;
}

interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  author?: string;
  category?: string;
  celebrity?: any;
  tags?: string[];
  publishDate?: string;
  featured: boolean;
  createdAt?: string;
}

interface NewsFull extends NewsRow {
  content: string;
  seo?: INewsSEO;
}

type FormTab   = 'basic' | 'content' | 'meta' | 'seo';
type PanelMode = 'add' | 'edit' | null;
type Toast     = { type: 'success' | 'error'; message: string } | null;

const PAGE_SIZES = [10, 20, 50];

const EMPTY_SEO: INewsSEO = {
  metaTitle: '', metaDescription: '', focusKeyword: '',
  metaKeywords: [], canonicalUrl: '', robots: 'index,follow',
  noindex: false, nofollow: false,
  ogTitle: '', ogDescription: '', ogType: 'article', ogSiteName: '', ogImages: [],
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '',
  twitterImage: '', twitterSite: '', twitterCreator: '',
  authorName: '', authorUrl: '', section: '', relatedTopics: [],
  schemaType: 'NewsArticle', structuredData: '',
};

const EMPTY_FORM: NewsFull = {
  id: '', title: '', slug: '', content: '', excerpt: '',
  thumbnail: '', author: '', category: '', celebrity: '',
  tags: [], publishDate: '', featured: false,
  seo: { ...EMPTY_SEO },
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',   label: 'Basic Info', icon: 'InformationCircleIcon'  },
  { key: 'content', label: 'Content',    icon: 'DocumentTextIcon'       },
  { key: 'meta',    label: 'Details',    icon: 'TagIcon'                },
  { key: 'seo',     label: 'SEO',        icon: 'MagnifyingGlassIcon'    },
];

// Predefined categories for news articles
const NEWS_CATEGORIES = [
  'Celebrity News',
  'Tamil Cinema',
  'Bollywood',
  'Hollywood',
  'Interviews',
  'Fashion',
  'Reviews',
  'Trailers',
  'Industry',
];

const splitLines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const joinLines  = (arr?: string[]) => (arr || []).join('\n');

function formatDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function toDateInputValue(d?: string) {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); }
  catch { return ''; }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function NewsManagementSection() {
  const { authHeaders } = useAuth();

  // List state
  const [news, setNews]               = useState<NewsRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [limit, setLimit]             = useState(20);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter]     = useState('');

  // Row actions
  const [busyMap, setBusyMap]             = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<NewsRow | null>(null);
  const [toast, setToast]                 = useState<Toast>(null);

  // Panel
  const [panelMode, setPanelMode]         = useState<PanelMode>(null);
  const [formTab, setFormTab]             = useState<FormTab>('basic');
  const [form, setForm]                   = useState<NewsFull>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<Partial<Record<keyof NewsFull, string>>>({});
  const [formLoading, setFormLoading]     = useState(false);
  const [formApiError, setFormApiError]   = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const isSlugEditedRef = useRef(false);
  const [celebrities, setCelebrities] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // ─── helpers ─────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };
  const setBusy  = (id: string, v: boolean) => setBusyMap((p) => ({ ...p, [id]: v }));
  const setField = <K extends keyof NewsFull>(k: K, v: NewsFull[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ─── fetch ───────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 1, lim = limit) => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (searchQuery)    params.set('q',        searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);
      if (authorFilter)   params.set('author',   authorFilter);
      const res  = await fetch(`/api/superadmin/news?${params}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setNews(data.data);
      setTotal(data.total);
      setPage(p);
      setLimit(lim);
      setPages(data.pages);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, searchQuery, categoryFilter, authorFilter, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // fetch celebrities for optional dropdown
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/superadmin/celebrities?limit=500`, {
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok || !data.success) return;
        if (!mounted) return;
        const list = (data.data || []).map((c: any) => ({
          id: String(c.id ?? c._id ?? c._id?.toString() ?? ''),
          name: c.name || c.fullName || c.title || c.slug || String(c._id ?? c.id ?? ''),
        })).filter((x: any) => x.id);
        setCelebrities(list);
      } catch (err) {
        // ignore loading errors for optional dropdown
      }
    };
    load();
    return () => { mounted = false; };
  }, [authHeaders]);

  // Thumbnail upload handlers
  const handleSelectThumbnail = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const f = e.target.files ? e.target.files[0] : null;
      if (f) handleUploadThumbnail(f);
    };
    input.click();
  };

  const handleDropThumbnail = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleUploadThumbnail(f);
  };

  const handleUploadThumbnail = async (file: File) => {
    const validation = validateImageFile(file);
    if (validation) { showToast('error', validation); return; }
    setUploadingThumbnail(true);
    try {
      // upload to news/ folder
      const url = await uploadImage(file, 'news');
      // If there was an existing thumbnail, attempt to delete it
      if (form.thumbnail) {
        try { await deleteImage(form.thumbnail); } catch (err) { /* ignore */ }
      }
      setField('thumbnail', url);
      showToast('success', 'Thumbnail uploaded');
    } catch (err) {
      showToast('error', 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!form.thumbnail) return;
    try {
      await deleteImage(form.thumbnail);
    } catch (err) {
      // ignore
    }
    setField('thumbnail', '');
    showToast('success', 'Thumbnail removed');
  };

  // ─── open add ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setFormApiError('');
    setFormTab('basic'); setPanelMode('add');
    isSlugEditedRef.current = false;
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ─── open edit ───────────────────────────────────────────────────────────
  const openEdit = async (row: NewsRow) => {
    setFormErrors({}); setFormApiError(''); setFormTab('basic');
    setPanelMode('edit'); setLoadingDetail(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res  = await fetch(`/api/superadmin/news/${row.id}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      const d: any = data.data;
      setForm({
        id:          d.id,
        title:       d.title       || '',
        slug:        d.slug        || '',
        content:     d.content     || '',
        excerpt:     d.excerpt     || '',
        thumbnail:   d.thumbnail   || '',
        author:      d.author      || '',
        category:    d.category    || '',
        celebrity:   (function() {
                        if (!d.celebrity) return '';
                        if (typeof d.celebrity === 'string') return d.celebrity;
                        if (d.celebrity._id) return String(d.celebrity._id);
                        if (d.celebrity.id) return String(d.celebrity.id);
                        return '';
                      })(),
        tags:        d.tags        || [],
        publishDate: toDateInputValue(d.publishDate),
        featured:    d.featured    ?? false,
        seo: { ...EMPTY_SEO, ...(d.seo || {}) },
      });
      isSlugEditedRef.current = true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load article');
      setPanelMode(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => setPanelMode(null);

  // ─── validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof NewsFull, string>> = {};
    if (!form.title.trim())   errs.title   = 'Title is required';
    if (!form.content.trim()) errs.content = 'Content is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── payload ─────────────────────────────────────────────────────────────
  const setSeoField = <K extends keyof INewsSEO>(k: K, v: INewsSEO[K]) =>
    setForm((f) => ({ ...f, seo: { ...(f.seo || EMPTY_SEO), [k]: v } }));

  const buildPayload = () => ({
    title:       form.title.trim(),
    slug:        form.slug?.trim() || undefined,
    content:     form.content.trim(),
    excerpt:     form.excerpt?.trim()     || undefined,
    thumbnail:   form.thumbnail?.trim()   || undefined,
    author:      form.author?.trim()      || undefined,
    category:    form.category?.trim()    || undefined,
    celebrity:   form.celebrity || null,
    tags:        form.tags || [],
    publishDate: form.publishDate || undefined,
    featured:    form.featured,
    seo:         form.seo || undefined,
  });

  // ─── create ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/news', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
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

  // ─── update ──────────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch(`/api/superadmin/news/${form.id}`, {
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
  const handleDelete = async (n: NewsRow) => {
    setConfirmDelete(null); setBusy(n.id, true);
    try {
      const res  = await fetch(`/api/superadmin/news/${n.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setNews((prev) => prev.filter((x) => x.id !== n.id));
      setTotal((t) => t - 1);
      showToast('success', `"${n.title}" deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    } finally {
      setBusy(n.id, false);
    }
  };

  // ─── quick toggle featured ────────────────────────────────────────────────
  const handleToggleFeatured = async (n: NewsRow) => {
    setBusy(n.id, true);
    const newVal = !n.featured;
    try {
      const res  = await fetch(`/api/superadmin/news/${n.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setNews((prev) => prev.map((x) => x.id === n.id ? { ...x, featured: newVal } : x));
      showToast('success', `"${n.title}" ${newVal ? 'featured' : 'unfeatured'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(n.id, false);
    }
  };

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
  const errBorder = (field: keyof NewsFull) =>
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
              onChange={(e) => {
                const v = e.target.value;
                setField('title', v);
                // auto-update slug unless user has edited it manually
                if (!isSlugEditedRef.current) setField('slug', slugify(v));
              }}
              placeholder="e.g. Sai Pallavi Replaces Pooja Hegde in Dhanush's D55"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('title')}`}
            />
            {formErrors.title && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.title}</p>}

            <label className="block text-xs font-medium text-neutral-400 mt-4 mb-1.5 font-montserrat uppercase tracking-wider">Slug (auto-generated)</label>
            <input type="text" value={form.slug || ''}
              onChange={(e) => { setField('slug', e.target.value); isSlugEditedRef.current = true; }}
              placeholder="auto-generated-from-title"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
            <p className="text-xs text-neutral-500 mt-1">URL path segment — lowercase letters, numbers and hyphens.</p>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Author</label>
            <input type="text" value={form.author || ''}
              onChange={(e) => setField('author', e.target.value)}
              placeholder="e.g. Rabinarayan Pradhan"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Category (predefined dropdown) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Category</label>
            <select
              value={form.category || ''}
              onChange={(e) => setField('category', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            >
              <option value="">Select category</option>
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Publish Date</label>
            <input type="date" value={form.publishDate || ''}
              onChange={(e) => setField('publishDate', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          {/* Celebrity ID */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Celebrity (optional)</label>
            <select value={form.celebrity || ''}
              onChange={(e) => setField('celebrity', e.target.value || '')}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            >
              <option value="">None</option>
              {celebrities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">Optional — link this article to a celebrity profile.</p>
          </div>

          {/* Thumbnail (upload) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Thumbnail</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setThumbnailDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setThumbnailDragActive(false); }}
              onDrop={(e) => { setThumbnailDragActive(false); handleDropThumbnail(e); }}
              className={`w-full p-4 rounded-xl transition-colors border-2 ${thumbnailDragActive ? 'border-yellow-400/60 bg-white/5' : 'border-white/10 bg-white/3'} flex items-center gap-4`}
            >
              <div className="flex-1">
                <p className="text-sm text-neutral-300 mb-2">Drag & drop an image here or</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSelectThumbnail}
                    className="px-3 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm">
                    {uploadingThumbnail ? 'Uploading...' : 'Choose Image'}
                  </button>
                  {form.thumbnail && (
                    <button type="button" onClick={handleDeleteThumbnail}
                      className="px-3 py-2 rounded-xl bg-white/5 text-neutral-300 hover:bg-white/10 text-sm">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-2">Optional — upload from your computer. Max 5MB.</p>
              </div>
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                {form.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-neutral-500 text-xs">Preview</div>
                )}
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Excerpt</label>
            <textarea value={form.excerpt || ''} rows={3}
              onChange={(e) => setField('excerpt', e.target.value)}
              placeholder="Brief summary of the article..."
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
        </div>
      );

      // ── CONTENT ────────────────────────────────────────────────────────
      case 'content': return (
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
            Article Content (HTML) <span className="text-yellow-400">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            rows={20}
            placeholder="<h2>Article heading</h2><p>Content here...</p>"
            className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm resize-y font-mono ${errBorder('content')}`}
          />
          {formErrors.content && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.content}</p>}
          <p className="text-neutral-600 text-xs mt-1 font-montserrat">{form.content.length} chars</p>
        </div>
      );

      // ── META / DETAILS ─────────────────────────────────────────────────
      case 'meta': return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Tags (one per line)</label>
            <textarea
              value={joinLines(form.tags)}
              onChange={(e) => setField('tags', splitLines(e.target.value))}
              rows={8}
              placeholder={"Dhanush\nSai Pallavi\nTamil Cinema News\nKollywood"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
            <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(form.tags || []).length} tags</p>
          </div>
        </div>
      );

      // ── SEO ────────────────────────────────────────────────────────────
      case 'seo': {
        const seo = form.seo || EMPTY_SEO;
        const inp = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm';
        const sel = inp + ' cursor-pointer';
        const ta  = inp + ' resize-none';
        const lbl = 'block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider';
        const sec = 'text-sm font-semibold text-white font-montserrat uppercase tracking-wider border-b border-white/10 pb-2';
        return (
          <div className="space-y-7">

            {/* ── Basic Meta ───────────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Basic Meta Tags</h4>
              <div className="grid grid-cols-1 gap-4">

                <div>
                  <label className={lbl}>Meta Title <span className="text-yellow-400">*</span></label>
                  <input type="text" maxLength={60} value={seo.metaTitle || ''}
                    onChange={(e) => setSeoField('metaTitle', e.target.value)}
                    placeholder="Breaking News: Celebrity Story | CelebrityPersona"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">{60 - (seo.metaTitle?.length || 0)} chars remaining (60 max)</p>
                </div>

                <div>
                  <label className={lbl}>Meta Description <span className="text-yellow-400">*</span></label>
                  <textarea rows={3} maxLength={160} value={seo.metaDescription || ''}
                    onChange={(e) => setSeoField('metaDescription', e.target.value)}
                    placeholder="Concise, compelling summary with main keyword. Shown in Google search results."
                    className={ta} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">{160 - (seo.metaDescription?.length || 0)} chars remaining (160 max)</p>
                </div>

                <div>
                  <label className={lbl}>Focus Keyword <span className="text-yellow-400">*</span></label>
                  <input type="text" value={seo.focusKeyword || ''}
                    onChange={(e) => setSeoField('focusKeyword', e.target.value)}
                    placeholder="e.g. Dhanush new movie 2026"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">Primary keyword to rank for in Google</p>
                </div>

                <div>
                  <label className={lbl}>Additional Keywords</label>
                  <textarea rows={4} value={(seo.metaKeywords || []).join('\n')}
                    onChange={(e) => setSeoField('metaKeywords', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                    placeholder={"sai pallavi new movie\ntamil cinema news\nkollywood casting news 2026"}
                    className={ta} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">One keyword per line. Focus on long-tail keywords.</p>
                </div>

              </div>
            </div>

            {/* ── Article Schema ─────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Article Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className={lbl}>Schema Type</label>
                  <select value={seo.schemaType || 'NewsArticle'}
                    onChange={(e) => setSeoField('schemaType', e.target.value)}
                    className={sel}>
                    <option value="NewsArticle">NewsArticle</option>
                    <option value="Article">Article</option>
                    <option value="BlogPosting">BlogPosting</option>
                    <option value="ReportageNewsArticle">ReportageNewsArticle</option>
                  </select>
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">Schema.org type for rich snippets</p>
                </div>

                <div>
                  <label className={lbl}>Article Section</label>
                  <input type="text" value={seo.section || ''}
                    onChange={(e) => setSeoField('section', e.target.value)}
                    placeholder="e.g. Tamil Cinema"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">Helps Google News categorise articles</p>
                </div>

                <div>
                  <label className={lbl}>Author Name</label>
                  <input type="text" value={seo.authorName || ''}
                    onChange={(e) => setSeoField('authorName', e.target.value)}
                    placeholder="e.g. Rabinarayan Pradhan"
                    className={inp} />
                </div>

                <div>
                  <label className={lbl}>Author URL</label>
                  <input type="url" value={seo.authorUrl || ''}
                    onChange={(e) => setSeoField('authorUrl', e.target.value)}
                    placeholder="https://example.com/author/rabi"
                    className={inp} />
                </div>

                <div className="md:col-span-2">
                  <label className={lbl}>Related Topics</label>
                  <textarea rows={3} value={(seo.relatedTopics || []).join('\n')}
                    onChange={(e) => setSeoField('relatedTopics', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                    placeholder={"Sai Pallavi\nDhanush\nTamil cinema casting"}
                    className={ta} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">One topic per line. Used for semantic SEO connections.</p>
                </div>

              </div>
            </div>

            {/* ── Open Graph ───────────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Open Graph (Facebook / LinkedIn)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className={lbl}>OG Title</label>
                  <input type="text" value={seo.ogTitle || ''}
                    onChange={(e) => setSeoField('ogTitle', e.target.value)}
                    placeholder="Title shown when shared on social media"
                    className={inp} />
                </div>

                <div>
                  <label className={lbl}>OG Type</label>
                  <select value={seo.ogType || 'article'}
                    onChange={(e) => setSeoField('ogType', e.target.value)}
                    className={sel}>
                    <option value="article">article</option>
                    <option value="website">website</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={lbl}>OG Description</label>
                  <textarea rows={2} value={seo.ogDescription || ''}
                    onChange={(e) => setSeoField('ogDescription', e.target.value)}
                    placeholder="Compelling description for social media cards"
                    className={ta} />
                </div>

                <div>
                  <label className={lbl}>OG Site Name</label>
                  <input type="text" value={seo.ogSiteName || ''}
                    onChange={(e) => setSeoField('ogSiteName', e.target.value)}
                    placeholder="CelebrityPersona"
                    className={inp} />
                </div>

                <div>
                  <label className={lbl}>OG Image URL</label>
                  <input type="url" value={(seo.ogImages || [])[0] || ''}
                    onChange={(e) => setSeoField('ogImages', e.target.value ? [e.target.value] : [])}
                    placeholder="https://… (1200×630 recommended)"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">1200×630 px, &lt;1 MB</p>
                </div>

              </div>
            </div>

            {/* ── Twitter Cards ───────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Twitter / X Cards</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className={lbl}>Card Type</label>
                  <select value={seo.twitterCard || 'summary_large_image'}
                    onChange={(e) => setSeoField('twitterCard', e.target.value)}
                    className={sel}>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="summary">Summary</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>Twitter Title</label>
                  <input type="text" value={seo.twitterTitle || ''}
                    onChange={(e) => setSeoField('twitterTitle', e.target.value)}
                    placeholder="Title for Twitter/X sharing"
                    className={inp} />
                </div>

                <div className="md:col-span-2">
                  <label className={lbl}>Twitter Description</label>
                  <textarea rows={2} value={seo.twitterDescription || ''}
                    onChange={(e) => setSeoField('twitterDescription', e.target.value)}
                    placeholder="Description for Twitter/X cards"
                    className={ta} />
                </div>

                <div>
                  <label className={lbl}>Twitter Image URL</label>
                  <input type="url" value={seo.twitterImage || ''}
                    onChange={(e) => setSeoField('twitterImage', e.target.value)}
                    placeholder="https://… (1200×675 recommended)"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">1200×675 px for large card</p>
                </div>

                <div>
                  <label className={lbl}>Twitter @site handle</label>
                  <input type="text" value={seo.twitterSite || ''}
                    onChange={(e) => setSeoField('twitterSite', e.target.value)}
                    placeholder="@CelebrityPersona"
                    className={inp} />
                </div>

                <div>
                  <label className={lbl}>Twitter @creator handle</label>
                  <input type="text" value={seo.twitterCreator || ''}
                    onChange={(e) => setSeoField('twitterCreator', e.target.value)}
                    placeholder="@author_handle"
                    className={inp} />
                </div>

              </div>
            </div>

            {/* ── Technical SEO ───────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Technical SEO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="md:col-span-2">
                  <label className={lbl}>Canonical URL</label>
                  <input type="url" value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeoField('canonicalUrl', e.target.value)}
                    placeholder="https://yoursite.com/celebrity-news/article-slug"
                    className={inp} />
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">Leave blank to auto-use the page URL. Prevents duplicate content.</p>
                </div>

                <div>
                  <label className={lbl}>Robots Meta</label>
                  <select value={seo.robots || 'index,follow'}
                    onChange={(e) => setSeoField('robots', e.target.value)}
                    className={sel}>
                    <option value="index,follow">index, follow</option>
                    <option value="index,nofollow">index, nofollow</option>
                    <option value="noindex,follow">noindex, follow</option>
                    <option value="noindex,nofollow">noindex, nofollow</option>
                  </select>
                  <p className="text-neutral-500 text-xs mt-1 font-montserrat">Control crawler indexing behaviour</p>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setSeoField('noindex', !seo.noindex)}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${seo.noindex ? 'bg-red-500' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${seo.noindex ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm font-montserrat text-neutral-300">No-index this article</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setSeoField('nofollow', !seo.nofollow)}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${seo.nofollow ? 'bg-red-500' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${seo.nofollow ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm font-montserrat text-neutral-300">No-follow links in article</span>
                  </label>
                </div>

              </div>
            </div>

            {/* ── Structured Data ─────────────────────── */}
            <div className="space-y-4">
              <h4 className={sec}>Structured Data (JSON-LD)</h4>
              <div>
                <label className={lbl}>Custom JSON-LD</label>
                <textarea rows={7} value={seo.structuredData || ''}
                  onChange={(e) => setSeoField('structuredData', e.target.value)}
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "NewsArticle",\n  "headline": "Article Headline",\n  "author": { "@type": "Person", "name": "Author Name" }\n}`}
                  className={ta + ' font-mono'} />
                <div className="flex items-start gap-2 mt-2">
                  <Icon name="InformationCircleIcon" size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-neutral-500 text-xs font-montserrat">Optional — paste custom JSON-LD for rich snippets. Leave blank to auto-generate from article data.</p>
                </div>
              </div>
            </div>

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
      {panelMode !== 'add' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',     value: total,                                       icon: 'NewspaperIcon',     color: 'text-yellow-400'  },
            { label: 'Featured',  value: news.filter((n) => n.featured).length,       icon: 'SparklesIcon',      color: 'text-purple-400'  },
            { label: 'This Page', value: news.length,                                 icon: 'RectangleGroupIcon',color: 'text-blue-400'    },
            { label: 'Pages',     value: pages,                                        icon: 'BookOpenIcon',      color: 'text-emerald-400' },
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
              placeholder="Search by title, author, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>
          <input
            type="text" value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
            placeholder="Filter by category..."
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm w-full md:w-44"
          />
          <input
            type="text" value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
            placeholder="Filter by author..."
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm w-full md:w-40"
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
              <Icon name="PlusIcon" size={16} /> Add Article
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
                  {panelMode === 'add' ? 'Add News Article' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in article details across tabs' : 'Update article details'}
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
              <span className="text-neutral-400 font-montserrat text-sm">Loading article...</span>
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
                      : (panelMode === 'add' ? 'Create Article' : 'Save Changes')}
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
            <h3 className="font-playfair text-xl font-bold text-white">Celebrity News</h3>
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
                  {['Article', 'Author', 'Category', 'Published', 'Featured', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[220, 120, 100, 90, 60, 70].map((w, j) => (
                          <td key={j} className="py-3.5 px-3">
                            <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : news.map((n) => (
                      <tr key={n.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${busyMap[n.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Article */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {n.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={n.thumbnail} alt={n.title} className="w-12 h-9 rounded-lg object-cover shrink-0 border border-white/10" />
                            ) : (
                              <div className="w-12 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Icon name="NewspaperIcon" size={16} className="text-yellow-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium font-montserrat text-sm leading-tight line-clamp-1 max-w-[260px]">{n.title}</p>
                              <p className="text-neutral-600 text-xs font-montserrat mt-0.5 line-clamp-1 max-w-[260px]">{n.excerpt || n.slug}</p>
                            </div>
                          </div>
                        </td>
                        {/* Author */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-300 text-sm font-montserrat">{n.author || '—'}</p>
                        </td>
                        {/* Category */}
                        <td className="py-3.5 px-3">
                          {n.category
                            ? <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-montserrat">{n.category}</span>
                            : <span className="text-neutral-600 text-xs font-montserrat">—</span>
                          }
                        </td>
                        {/* Published */}
                        <td className="py-3.5 px-3">
                          <p className="text-neutral-400 text-xs font-montserrat">{formatDate(n.publishDate || n.createdAt)}</p>
                        </td>
                        {/* Featured */}
                        <td className="py-3.5 px-3">
                          <button onClick={() => handleToggleFeatured(n)} title={n.featured ? 'Unfeature' : 'Feature'}
                            className={`w-10 h-5 rounded-full transition-all relative ${n.featured ? 'bg-yellow-500' : 'bg-white/10'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${n.featured ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(n)} title="Edit"
                              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                              <Icon name="PencilSquareIcon" size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(n)} title="Delete"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Icon name="TrashIcon" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {!loading && !fetchError && news.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Icon name="NewspaperIcon" size={40} className="mx-auto mb-3 text-neutral-700" />
                      <p className="text-neutral-500 font-montserrat text-sm">No news articles found</p>
                      <button onClick={openAdd} className="mt-3 text-yellow-400 text-sm font-montserrat hover:underline">
                        + Add the first article
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
                <h3 className="font-playfair text-xl font-bold text-white">Delete Article</h3>
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
                Delete Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
