"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/imageUpload';
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
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
}

interface IOutfitSEO {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  noindex?: boolean;
  nofollow?: boolean;
  // form-friendly fields (mapped to DB schema on save)
  ogImage?: string;        // → DB: ogImages[0]
  robotsIndex?: boolean;   // → DB: noindex (inverted)
  robotsFollow?: boolean;  // → DB: nofollow (inverted)
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;
  ogUrl?: string;
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
  articleSection?: string; // form-friendly alias for section
  relatedTopics?: string[];
  schemaType?: string;
  structuredDataDepth?: string;
  alternateLangs?: string[];
  prevUrl?: string;
  nextUrl?: string;
}

interface OutfitFull extends OutfitRow, Record<string, any> {
  description?: string;
  size?: string;
  seo?: IOutfitSEO;
}

type FormTab = 'basic' | 'celebrity' | 'look' | 'media' | 'products' | 'article' | 'source' | 'seo' | 'schema' | 'publishing';
type PanelMode = 'add' | 'edit' | null;
type Toast     = { type: 'success' | 'error'; message: string } | null;

const PAGE_SIZES = [10, 20, 50];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  scheduled: 'bg-sky-500/20 text-sky-400',
  draft:     'bg-yellow-500/20 text-yellow-400',
  archived:  'bg-neutral-500/20 text-neutral-400',
};

const EMPTY_SEO: IOutfitSEO = {
  metaTitle: '', metaDescription: '', focusKeyword: '',
  metaKeywords: [], canonicalUrl: '', robots: 'index,follow',
  noindex: false, nofollow: false,
  ogImage: '', ogTitle: '', ogDescription: '', ogType: 'article', ogSiteName: '', ogUrl: '', ogImages: [],
  robotsIndex: true, robotsFollow: true,
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '',
  twitterImage: '', twitterSite: '', twitterCreator: '',
  authorName: '', authorUrl: '', section: '', articleSection: '', relatedTopics: [],
  schemaType: 'Product', structuredDataDepth: 'basic',
  alternateLangs: [], prevUrl: '', nextUrl: '',
};

const EMPTY_FORM: OutfitFull = {
  id: '', title: '', slug: '', celebrity: '',
  images: [''], featuredImage: '', featuredImageAlt: '', event: '', eventName: '', outfitType: '', designer: '', brand: '', category: '',
  color: '', price: '', purchaseLink: '', size: '',
  excerpt: '', outfitSummary: '', outfitDescription: '', sourceType: '', sourceName: '', sourceUrl: '',
  description: '', tags: [], isActive: true, isFeatured: false, isTrending: false, isEditorPick: false, status: 'draft' as const,
  likesCount: 0, commentsCount: 0,
  seo: { ...EMPTY_SEO },
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic', label: 'Basic Info', icon: 'InformationCircleIcon' },
  { key: 'celebrity', label: 'Celebrity & Occasion', icon: 'StarIcon' },
  { key: 'look', label: 'Look Breakdown', icon: 'TagIcon' },
  { key: 'media', label: 'Images & Media', icon: 'PhotoIcon' },
  { key: 'products', label: 'Products / Buy Links', icon: 'ShoppingBagIcon' },
  { key: 'article', label: 'Description / Article', icon: 'DocumentTextIcon' },
  { key: 'source', label: 'Source & Credits', icon: 'ShieldCheckIcon' },
  { key: 'seo', label: 'SEO', icon: 'MagnifyingGlassIcon' },
  { key: 'schema', label: 'Schema', icon: 'CodeBracketIcon' },
  { key: 'publishing', label: 'Publishing', icon: 'RocketLaunchIcon' },
];

const splitLines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const joinLines  = (arr?: string[]) => (arr || []).join('\n');

function getCelebrityName(c: CelebrityRef | string | undefined): string {
  if (!c) return '—';
  if (typeof c === 'string') return c;
  return c.name || '—';
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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
  const [statusFilter, setStatusFilter] = useState('');

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
  const [draftLoading, setDraftLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const isSlugEditedRef = useRef(false);
  const [celebrities, setCelebrities] = useState<Array<{ id: string; name: string; slug?: string; profileImage?: string }>>([]);

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
      if (searchQuery)    params.set('q', searchQuery);
      if (brandFilter)    params.set('brand', brandFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter)   params.set('status', statusFilter);
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
  }, [authHeaders, searchQuery, brandFilter, categoryFilter, statusFilter, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // fetch celebrities for dropdown
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
          id: String(c.id ?? c._id ?? ''),
          name: c.name || c.fullName || c.title || String(c._id ?? c.id ?? ''),
          slug: c.slug,
          profileImage: c.profileImage || c.avatar || undefined,
        })).filter((x: any) => x.id);
        setCelebrities(list);
      } catch (err) {
        // ignore optional dropdown errors
      }
    };
    load();
    return () => { mounted = false; };
  }, [authHeaders]);

  // ─── open add ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setFormApiError('');
    setFormTab('basic'); setPanelMode('add');
    isSlugEditedRef.current = false;
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
      const primaryCelebritySlug = d.primaryCelebritySlug || (typeof d.celebrity === 'object' ? d.celebrity?.slug : '');
      setForm({
        id:           d.id,
        title:        d.title         || '',
        slug:         d.slug          || '',
        celebrity:    celebId,
        images:       Array.isArray(d.images) && d.images.length ? d.images : [''],
        featuredImage: d.featuredImage || d.images?.[0] || '',
        featuredImageAlt: d.featuredImageAlt || '',
        event:        d.eventName || d.event || '',
        eventName:    d.eventName || d.event || '',
        outfitType:   d.outfitType || '',
        designer:     d.designer      || '',
        brand:        d.brand         || '',
        category:     d.category      || '',
        color:        d.color         || '',
        price:        d.price         || '',
        purchaseLink: d.purchaseLink  || '',
        primaryCelebritySlug,
        excerpt:      d.excerpt || '',
        outfitSummary: d.outfitSummary || '',
        outfitDescription: d.outfitDescription || d.description || '',
        sourceType:   d.sourceType || '',
        sourceName:   d.sourceName || '',
        sourceUrl:    d.sourceUrl || '',
        size:         d.size          || '',
        description:  d.description   || '',
        tags:         d.tags          || [],
        isActive:     d.isActive      ?? true,
        isFeatured:   d.isFeatured    ?? false,
        isTrending:   d.isTrending     ?? false,
        isEditorPick: d.isEditorPick   ?? false,
        status:       (['draft', 'scheduled', 'published', 'archived'].includes(d.status) ? d.status : 'draft'),
        likesCount:   d.likesCount    ?? 0,
        commentsCount: d.commentsCount ?? 0,
        seo: d.seo ? {
          ...EMPTY_SEO,
          ...d.seo,
          // map DB fields → form aliases
          ogImage:      (d.seo.ogImages || [])[0] || d.seo.ogImage || '',
          robotsIndex:  !(d.seo.noindex  ?? false),
          robotsFollow: !(d.seo.nofollow ?? false),
          articleSection: d.seo.section || d.seo.articleSection || '',
          metaKeywords: d.seo.metaKeywords || [],
          relatedTopics: d.seo.relatedTopics || [],
          alternateLangs: d.seo.alternateLangs || [],
        } : { ...EMPTY_SEO },
      });
      isSlugEditedRef.current = true;
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
  const buildPayload = () => {
    const selectedCelebrity = celebrities.find((c) => c.id === String(form.celebrity));
    const imageList = (form.images || []).filter(Boolean);
    const featuredImage = form.featuredImage || imageList[0] || '';
    const plainDescription = (form.outfitDescription || form.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Map form-friendly SEO aliases → DB field names
    const rawSeo = form.seo;
    const seoPayload = rawSeo ? {
      metaTitle:          rawSeo.metaTitle          || undefined,
      metaDescription:    rawSeo.metaDescription    || undefined,
      focusKeyword:       rawSeo.focusKeyword        || undefined,
      metaKeywords:       rawSeo.metaKeywords        || [],
      canonicalUrl:       rawSeo.canonicalUrl        || undefined,
      robots:             rawSeo.robots              || 'index,follow',
      noindex:            rawSeo.robotsIndex === false ? true : false,   // inverted
      nofollow:           rawSeo.robotsFollow === false ? true : false,  // inverted
      ogTitle:            rawSeo.ogTitle             || undefined,
      ogDescription:      rawSeo.ogDescription       || undefined,
      ogImages:           rawSeo.ogImage ? [rawSeo.ogImage] : (rawSeo.ogImages || []),
      ogType:             rawSeo.ogType === 'product' ? 'article' : rawSeo.ogType || undefined,
      ogSiteName:         rawSeo.ogSiteName          || undefined,
      ogUrl:              rawSeo.ogUrl               || undefined,
      twitterCard:        rawSeo.twitterCard         || undefined,
      twitterTitle:       rawSeo.twitterTitle        || undefined,
      twitterDescription: rawSeo.twitterDescription  || undefined,
      twitterImage:       rawSeo.twitterImage        || undefined,
      twitterSite:        rawSeo.twitterSite         || undefined,
      twitterCreator:     rawSeo.twitterCreator      || undefined,
      schemaType:         rawSeo.schemaType          || undefined,
      structuredDataDepth: rawSeo.structuredDataDepth || undefined,
      authorName:         rawSeo.authorName          || undefined,
      authorUrl:          rawSeo.authorUrl           || undefined,
      section:            rawSeo.articleSection || rawSeo.section || undefined,
      relatedTopics:      rawSeo.relatedTopics        || [],
      alternateLangs:     rawSeo.alternateLangs       || [],
      prevUrl:            rawSeo.prevUrl             || undefined,
      nextUrl:            rawSeo.nextUrl             || undefined,
    } : undefined;

    return {
      title:        form.title.trim(),
      slug:         form.slug?.trim() || undefined,
      celebrity:    String(form.celebrity).trim(),
      primaryCelebrity: String(form.celebrity).trim(),
      primaryCelebritySlug: form.primaryCelebritySlug || selectedCelebrity?.slug || undefined,
      images:       imageList,
      featuredImage,
      featuredImageAlt: form.featuredImageAlt || (form.title ? `${selectedCelebrity?.name || 'Celebrity'} wearing ${form.title}` : undefined),
      event:        form.event?.trim()        || undefined,
      eventName:    form.eventName?.trim() || form.event?.trim() || undefined,
      outfitType:   form.outfitType?.trim() || form.category?.trim() || undefined,
      designer:     form.designer?.trim()     || undefined,
      excerpt:      form.excerpt?.trim() || plainDescription.slice(0, 220) || undefined,
      outfitSummary: form.outfitSummary?.trim() || plainDescription.slice(0, 220) || undefined,
      outfitDescription: (form.outfitDescription || form.description || '').trim() || undefined,
      description:  (form.outfitDescription || form.description || '').trim() || undefined,
      brand:        form.brand?.trim()        || undefined,
      category:     form.category?.trim()     || undefined,
      color:        form.color?.trim()        || undefined,
      price:        form.price?.trim()        || undefined,
      purchaseLink: form.purchaseLink?.trim() || undefined,
      originalBuyUrl: form.purchaseLink?.trim() || undefined,
      originalProductName: form.title.trim(),
      originalBrand: form.brand?.trim() || undefined,
      originalDesigner: form.designer?.trim() || undefined,
      originalPrice: form.price?.trim() || undefined,
      size:         form.size?.trim()         || undefined,
      sourceType:   form.sourceType?.trim() || undefined,
      sourceName:   form.sourceName?.trim() || undefined,
      sourceUrl:    form.sourceUrl?.trim() || undefined,
      tags:         form.tags || [],
      isActive:     form.isActive,
      isFeatured:   form.isFeatured,
      isTrending:   form.isTrending,
      isEditorPick: form.isEditorPick,
      status:       form.status,
      seo:          seoPayload,
      focusKeyword: seoPayload?.focusKeyword,
      metaTitle: seoPayload?.metaTitle || form.title.trim(),
      metaDescription: seoPayload?.metaDescription || form.excerpt || plainDescription.slice(0, 155),
      schemaType: 'Article',
      schemaHeadline: seoPayload?.metaTitle || form.title.trim(),
      schemaDescription: seoPayload?.metaDescription || form.excerpt || plainDescription.slice(0, 155),
      schemaImage: featuredImage,
    };
  };

  // ─── create ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/outfits', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), status: 'published' }),
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

  // ─── validate draft (title + celebrity required) ──────────────────────────
  const validateDraft = () => {
    const errs: Partial<Record<keyof OutfitFull, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required to save as draft';
    if (!String(form.celebrity).trim()) errs.celebrity = 'Celebrity is required to save as draft';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── save as draft ────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!validateDraft()) return;
    setDraftLoading(true); setFormApiError('');
    const payload = { ...buildPayload(), status: 'draft' as const };
    try {
      let res: Response;
      if (panelMode === 'edit' && form.id) {
        res = await fetch(`/api/superadmin/outfits/${form.id}`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/superadmin/outfits', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save draft');
      // If newly created draft, switch panel to edit mode
      if (panelMode === 'add') {
        setForm((f) => ({ ...f, id: data.data.id, status: 'draft' }));
        setPanelMode('edit');
      } else {
        setForm((f) => ({ ...f, status: 'draft' }));
      }
      showToast('success', `Draft saved — "${form.title.trim()}"`);
      fetchList(page);
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to save draft');
    } finally {
      setDraftLoading(false);
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

  const handleStatusToggle = async (o: OutfitRow, newStatus: 'draft' | 'published') => {
    if (o.status === newStatus) return;
    setBusy(o.id, true);
    try {
      const res  = await fetch(`/api/superadmin/outfits/${o.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setOutfits((prev) => prev.map((x) => x.id === o.id ? { ...x, status: newStatus } : x));
      showToast('success', `"${o.title}" set to ${newStatus}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    } finally {
      setBusy(o.id, false);
    }
  };

  // ─── image helpers ────────────────────────────────────────────────────────
  const addImageField    = () => setField('images', [...(form.images || []), '']);
  const removeImageField = (i: number) => setField('images', (form.images || []).filter((_, idx) => idx !== i));
  const updateImage      = (i: number, val: string) =>
    setField('images', (form.images || []).map((img, idx) => idx === i ? val : img));

  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const setUploading = (i: number, v: boolean) => setUploadingMap((p) => ({ ...p, [i]: v }));

  // SEO image upload state
  type UploadSlot = { uploading: boolean; progress: number; error: string };
  const emptySlot = (): UploadSlot => ({ uploading: false, progress: 0, error: '' });
  const [ogImageUpload, setOgImageUpload]           = useState<UploadSlot>(emptySlot());
  const [twitterImageUpload, setTwitterImageUpload] = useState<UploadSlot>(emptySlot());

  const handleSelectImage = (i: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const f = e.target.files ? e.target.files[0] : null;
      if (f) handleUploadImage(f, i);
    };
    input.click();
  };

  const handleDropImage = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleUploadImage(f, i);
  };

  const handleUploadImage = async (file: File, i: number) => {
    // Require celebrity and title before uploading
    if (!String(form.celebrity).trim()) {
      showToast('error', 'Please select a celebrity before uploading images');
      return;
    }
    if (!form.title.trim()) {
      showToast('error', 'Please enter the outfit title before uploading images');
      return;
    }
    const validation = validateImageFile(file);
    if (validation) { showToast('error', validation); return; }

    // Build structured path: outfits/{celebrity-slug}/{outfit-slug}
    const celebSlug = celebrities.find((c) => c.id === String(form.celebrity))?.slug
      || slugify(getCelebrityName(form.celebrity as any));
    const outfitSlug = form.slug?.trim() || slugify(form.title.trim());
    const uploadPath = `outfits/${celebSlug}/${outfitSlug}`;

    setUploading(i, true);
    try {
      const old = (form.images || [])[i];
      const url = await uploadImage(file, uploadPath);
      if (old) {
        try { await deleteImage(old); } catch (err) { /* ignore delete errors */ }
      }
      updateImage(i, url);
      showToast('success', 'Image uploaded');
    } catch (err) {
      showToast('error', 'Failed to upload image');
    } finally {
      setUploading(i, false);
    }
  };

  // ─── SEO image upload helpers ─────────────────────────────────────────────
  const outfitFolder = () => {
    const celebSlug = celebrities.find((c) => c.id === String(form.celebrity))?.slug || 'celebrity';
    const outfitSlug = form.slug?.trim() || slugify(form.title.trim()) || 'outfit';
    return `outfits/${celebSlug}/${outfitSlug}`;
  };

  const handleOgImageUpload = async (file: File) => {
    setOgImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `${outfitFolder()}/og`);
      setSeoField('ogImage', url);
      setOgImageUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setOgImageUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
    }
  };

  const handleTwitterImageUpload = async (file: File) => {
    setTwitterImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `${outfitFolder()}/twitter`);
      setSeoField('twitterImage', url);
      setTwitterImageUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setTwitterImageUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
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

  const setSeoField = <K extends keyof IOutfitSEO>(k: K, v: IOutfitSEO[K]) =>
    setForm((f) => ({ ...f, seo: { ...(f.seo || EMPTY_SEO), [k]: v } }));

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
              onChange={(e) => {
                const v = e.target.value;
                setField('title', v);
                if (!isSlugEditedRef.current) setField('slug', slugify(v));
              }}
              placeholder="e.g. Ayushmann Khurrana's Karwa Chauth Kurta Look"
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

          {/* Celebrity (select from existing profiles) */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Celebrity <span className="text-yellow-400">*</span>
            </label>
            <select value={String(form.celebrity)} onChange={(e) => setField('celebrity', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${errBorder('celebrity')}`}>
              <option value="">Select a celebrity...</option>
              {celebrities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.slug ? ` — ${c.slug}` : ''}</option>
              ))}
            </select>
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

          <LabeledInput label="Outfit Type" value={form.outfitType || ''} onChange={(v) => setField('outfitType', v)} placeholder="e.g. Saree, Gown, Lehenga, Suit" required />

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
              Excerpt
            </label>
            <textarea
              value={form.excerpt || ''}
              onChange={(e) => setField('excerpt', e.target.value)}
              rows={3}
              placeholder="Short public summary for listing cards and meta descriptions"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-y"
            />
          </div>

          {/* Color */}
          <LabeledInput label="Color" value={form.color || ''} onChange={(v) => setField('color', v)} placeholder="e.g. Beige" />

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Price</label>
            <div className="flex gap-2">
              <select
                value={form.price?.match(/^[₹$€£¥]/) ? form.price.charAt(0) : '₹'}
                onChange={(e) => {
                  const sym = e.target.value;
                  const num = (form.price || '').replace(/^[₹$€£¥]/, '');
                  setField('price', num ? sym + num : '');
                }}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer shrink-0"
              >
                <option value="₹" style={{ background: '#2b1433' }}>₹ INR</option>
                <option value="$" style={{ background: '#2b1433' }}>$ USD</option>
                <option value="€" style={{ background: '#2b1433' }}>€ EUR</option>
                <option value="£" style={{ background: '#2b1433' }}>£ GBP</option>
                <option value="¥" style={{ background: '#2b1433' }}>¥ JPY</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(form.price || '').replace(/^[₹$€£¥]/, '')}
                onChange={(e) => {
                  const sym = form.price?.match(/^[₹$€£¥]/)?.[0] || '₹';
                  const val = e.target.value;
                  setField('price', val ? sym + val : '');
                }}
                placeholder="e.g. 26500"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Live preview */}
            {form.price && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
                <span className="text-[10px] text-neutral-500 font-montserrat uppercase tracking-wider">Preview:</span>
                <span className="text-yellow-300 font-bold font-montserrat text-sm">
                  {(() => {
                    const sym = form.price.match(/^[₹$€£¥]/)?.[0] || '₹';
                    const num = parseFloat(form.price.replace(/^[₹$€£¥]/, ''));
                    if (isNaN(num)) return form.price;
                    const localeMap: Record<string, string> = { '₹': 'en-IN', '$': 'en-US', '€': 'de-DE', '£': 'en-GB', '¥': 'ja-JP' };
                    const currMap: Record<string, string>   = { '₹': 'INR',   '$': 'USD',   '€': 'EUR',   '£': 'GBP',   '¥': 'JPY'   };
                    return new Intl.NumberFormat(localeMap[sym], { style: 'currency', currency: currMap[sym], maximumFractionDigits: 2 }).format(num);
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Purchase Link */}
          <div className="md:col-span-2">
            <LabeledInput label="Purchase Link" value={form.purchaseLink || ''} onChange={(v) => setField('purchaseLink', v)} type="url" placeholder="https://..." />
          </div>

          {/* Size */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">Size Availability</label>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', '28', '30', '32', '34', '36', '38', '40', '42', '44', '6', '7', '8', '9', '10'].map((s) => {
                const selected = (form.size || '').split(',').map((x) => x.trim()).includes(s);
                return (
                  <button
                    key={s} type="button"
                    onClick={() => {
                      const current = (form.size || '').split(',').map((x) => x.trim()).filter(Boolean);
                      const next = selected ? current.filter((x) => x !== s) : [...current, s];
                      setField('size', next.join(', '));
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-montserrat font-semibold transition-all ${
                      selected
                        ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-yellow-500/40 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {form.size && (
              <p className="text-neutral-500 text-xs font-montserrat mt-2">Selected: <span className="text-white">{form.size}</span></p>
            )}
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
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-montserrat text-neutral-300">Trending</span>
              <button type="button" onClick={() => setField('isTrending', !form.isTrending)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.isTrending ? 'bg-yellow-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isTrending ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-montserrat text-neutral-300">Editor Pick</span>
              <button type="button" onClick={() => setField('isEditorPick', !form.isEditorPick)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.isEditorPick ? 'bg-yellow-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isEditorPick ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
      );

      // ── IMAGES (Gallery) ───────────────────────────────────────────────
      case 'media': {
        const canUpload = !!String(form.celebrity).trim() && !!form.title.trim();
        const celebSlugForPath = canUpload
          ? (celebrities.find((c) => c.id === String(form.celebrity))?.slug || slugify(getCelebrityName(form.celebrity as any)))
          : null;
        const outfitSlugForPath = canUpload ? (form.slug?.trim() || slugify(form.title.trim())) : null;
        return (
        <div className="space-y-5">
          {/* Upload path warning */}
          {!canUpload && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300 text-xs font-montserrat leading-relaxed">
                <span className="font-semibold">Select a celebrity and enter the outfit title first.</span>{' '}
                Images will be organised in a dedicated folder once both fields are filled.
              </p>
            </div>
          )}
          {canUpload && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <Icon name="FolderIcon" size={14} className="text-green-400 shrink-0" />
              <p className="text-green-300 text-xs font-montserrat truncate">
                Upload path: <span className="font-semibold">outfits / {celebSlugForPath} / {outfitSlugForPath}</span>
              </p>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-montserrat font-semibold">Image Gallery</p>
              <p className="text-neutral-500 text-xs font-montserrat mt-0.5">
                First image is the primary thumbnail · Upload from device or paste a URL
              </p>
            </div>
            <button type="button" onClick={addImageField}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 font-montserrat text-sm font-medium transition-all"
            >
              <Icon name="PlusIcon" size={14} /> Add Slot
            </button>
          </div>

          {formErrors.images && (
            <p className="text-red-400 text-xs font-montserrat bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{formErrors.images}</p>
          )}

          <LabeledInput
            label="Featured Image Alt Text"
            value={form.featuredImageAlt || ''}
            onChange={(v) => setField('featuredImageAlt', v)}
            placeholder="e.g. Celebrity wearing a red saree at the premiere"
            required
          />

          {/* Empty state — first visit */}
          {(form.images || []).length === 0 && (
            <button type="button" onClick={canUpload ? addImageField : undefined}
              disabled={!canUpload}
              className={`w-full py-14 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group ${
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
                <p className="text-neutral-600 text-xs font-montserrat mt-0.5">or drag & drop files anywhere on this panel</p>
              </div>
            </button>
          )}

          {/* Image cards grid */}
          {(form.images || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(form.images || []).map((img, i) => {
                const isUploading = !!uploadingMap[i];
                return (
                  <div key={i}
                    onDrop={(e) => handleDropImage(e, i)}
                    onDragOver={(e) => e.preventDefault()}
                    className={`relative rounded-2xl border transition-all overflow-hidden group ${
                      isUploading
                        ? 'border-yellow-500/50 bg-yellow-500/5'
                        : img
                          ? 'border-white/10 bg-white/3 hover:border-yellow-500/30'
                          : 'border-dashed border-white/15 bg-white/3 hover:border-yellow-500/40 hover:bg-yellow-500/5'
                    }`}
                  >
                    {/* Badge */}
                    {i === 0 && (
                      <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold font-montserrat tracking-wide shadow-lg">
                        Primary
                      </span>
                    )}

                    {/* Remove */}
                    {(form.images || []).length > 1 && (
                      <button type="button" onClick={() => removeImageField(i)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Icon name="TrashIcon" size={13} />
                      </button>
                    )}

                    {/* Preview area */}
                    <div className="relative w-full min-h-44">
                      {isUploading ? (
                        <div className="w-full h-44 flex flex-col items-center justify-center gap-3">
                          <Icon name="ArrowPathIcon" size={28} className="text-yellow-400 animate-spin" />
                          <p className="text-yellow-400 text-xs font-montserrat font-medium">Uploading…</p>
                        </div>
                      ) : img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={`outfit-${i}`} className="w-full h-auto object-contain" />
                      ) : (
                        <button type="button" onClick={() => canUpload && handleSelectImage(i)}
                          disabled={!canUpload}
                          title={!canUpload ? 'Select a celebrity and enter a title first' : undefined}
                          className={`w-full h-44 flex flex-col items-center justify-center gap-2 transition-colors ${
                            canUpload
                              ? 'text-neutral-600 hover:text-yellow-400 cursor-pointer'
                              : 'text-neutral-700 cursor-not-allowed'
                          }`}
                        >
                          <Icon name="ArrowUpTrayIcon" size={28} />
                          <p className="text-xs font-montserrat">Click or drop to upload</p>
                        </button>
                      )}

                      {/* Overlay actions when image exists */}
                      {img && !isUploading && canUpload && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button type="button" onClick={() => handleSelectImage(i)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-black text-xs font-bold font-montserrat hover:bg-yellow-400 transition-all"
                          >
                            <Icon name="ArrowUpTrayIcon" size={13} /> Replace
                          </button>
                        </div>
                      )}
                    </div>

                    {/* URL input */}
                    <div className="px-3 py-3 border-t border-white/10 bg-black/20 flex items-center gap-2">
                      <input
                        type="url"
                        value={img}
                        onChange={(e) => updateImage(i, e.target.value)}
                        placeholder="Paste URL or upload above…"
                        className="flex-1 min-w-0 bg-transparent text-white text-xs font-montserrat placeholder-neutral-600 focus:outline-none truncate"
                      />
                      <button type="button" onClick={() => handleSelectImage(i)} disabled={isUploading || !canUpload}
                        title={!canUpload ? 'Select a celebrity and enter a title first' : 'Upload image'}
                        className="shrink-0 p-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/30 transition-all disabled:opacity-40"
                      >
                        <Icon name="ArrowUpTrayIcon" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* "Add another" ghost card */}
              <button type="button" onClick={addImageField}
                className="rounded-2xl border-2 border-dashed border-white/10 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all flex flex-col items-center justify-center gap-2 h-full min-h-[220px] text-neutral-600 hover:text-yellow-400 group"
              >
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-yellow-500/10 transition-all">
                  <Icon name="PlusIcon" size={20} />
                </div>
                <p className="text-xs font-montserrat">Add image</p>
              </button>
            </div>
          )}
        </div>
      );
      }

      // ── META / DETAILS ─────────────────────────────────────────────────
      case 'source':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput label="Source Type" value={form.sourceType || ''} onChange={(v) => setField('sourceType', v)} placeholder="Official, Instagram, Brand, Interview" required />
          <LabeledInput label="Source Name" value={form.sourceName || ''} onChange={(v) => setField('sourceName', v)} placeholder="Publication, brand, or platform" required />
          <div className="md:col-span-2">
            <LabeledInput label="Source URL" value={form.sourceUrl || ''} onChange={(v) => setField('sourceUrl', v)} type="url" placeholder="https://..." required />
          </div>
          <p className="md:col-span-2 text-xs text-neutral-500 font-montserrat">
            Published outfits require at least one source. Credits are displayed on the public outfit detail page.
          </p>
        </div>
      );

      case 'celebrity':
      case 'look':
      case 'products':
      case 'publishing':
      case 'schema':
      return (
        <div className="space-y-7">

          {/* ── Tags ──────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <p className="text-sm font-semibold text-white font-montserrat">Tags</p>
            </div>
            <p className="text-xs text-neutral-500 font-montserrat mb-3">Used for search filtering and related outfit suggestions.</p>
            <textarea
              value={joinLines(form.tags)}
              onChange={(v) => setField('tags', splitLines(v.target.value))}
              rows={4}
              placeholder={"Gopi Vaid kurta set\nceleb ethnic wear\nBeige kurta for men"}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
            />
            <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(form.tags || []).length} tags</p>
          </section>

          <div className="border-t border-white/8" />

          {/* ── Styling Details ───────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <p className="text-sm font-semibold text-white font-montserrat">Styling Details</p>
            </div>
            <p className="text-xs text-neutral-500 font-montserrat mb-4">Help users discover outfits by occasion, season and aesthetic.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Occasion */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Occasion</label>
                <select
                  value={(form as any).occasion || ''}
                  onChange={(e) => setField('event' as any, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                >
                  {['', 'Wedding', 'Festive', 'Casual', 'Party', 'Red Carpet', 'Airport', 'Promotional', 'Gym / Sports', 'Date Night', 'Formal / Business', 'Beach / Resort'].map((o) => (
                    <option key={o} value={o} style={{ background: '#2b1433' }}>{o || 'Select occasion…'}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Season</label>
                <div className="flex flex-wrap gap-2">
                  {['Summer', 'Monsoon', 'Winter', 'All Season'].map((s) => (
                    <button key={s} type="button"
                      onClick={() => setField('color' as any, s)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-montserrat font-medium transition-all ${
                        (form as any).season === s
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Style Aesthetic */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Style Aesthetic</label>
                <select
                  value={(form as any).aesthetic || ''}
                  onChange={(e) => (form as any).aesthetic = e.target.value}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                >
                  {['', 'Ethnic / Traditional', 'Western', 'Fusion', 'Streetwear', 'Athleisure', 'Glamorous', 'Minimalist', 'Boho', 'Vintage', 'Smart Casual'].map((a) => (
                    <option key={a} value={a} style={{ background: '#2b1433' }}>{a || 'Select aesthetic…'}</option>
                  ))}
                </select>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Best For Body Type</label>
                <input
                  type="text"
                  value={(form as any).bodyType || ''}
                  placeholder="e.g. Hourglass, Pear, Rectangle…"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  onChange={(e) => (form as any).bodyType = e.target.value}
                />
              </div>

              {/* Styling Tips */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Styling Tips</label>
                <textarea
                  rows={3}
                  value={(form as any).stylingTips || ''}
                  placeholder="e.g. Pair with kolhapuris and a potli bag for a complete festive look…"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  onChange={(e) => (form as any).stylingTips = e.target.value}
                />
                <p className="text-neutral-600 text-xs mt-1 font-montserrat">Shown as a tip card on the outfit detail page.</p>
              </div>
            </div>
          </section>

          <div className="border-t border-white/8" />

          {/* ── Commerce ──────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-sm font-semibold text-white font-montserrat">Commerce</p>
            </div>
            <p className="text-xs text-neutral-500 font-montserrat mb-4">Shopping availability and affiliate tracking details.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Availability */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">Availability</label>
                <div className="flex gap-2">
                  {(['In Stock', 'Out of Stock', 'Limited', 'Pre-order'] as const).map((s) => (
                    <button key={s} type="button"
                      onClick={() => setField('size' as any, s)}
                      className={`flex-1 px-2 py-2 rounded-xl border text-[11px] font-montserrat font-medium transition-all ${
                        (form as any).availability === s
                          ? s === 'In Stock'   ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : s === 'Out of Stock' ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : s === 'Limited'    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          :                      'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Discount / Offer</label>
                <input
                  type="text"
                  placeholder="e.g. 20% off · Use code CELEB20"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                />
              </div>

              {/* Affiliate ID */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Affiliate / Partner ID</label>
                <input
                  type="text"
                  placeholder="e.g. CP_GOPIVAID_001"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                />
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Material / Fabric</label>
                <input
                  type="text"
                  value={(form as any).material || ''}
                  placeholder="e.g. Pure Silk, Cotton Blend, Georgette"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  onChange={(e) => (form as any).material = e.target.value}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/8" />

          {/* ── Engagement Stats (read-only) ──────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-sm font-semibold text-white font-montserrat">Engagement Stats</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold font-playfair text-red-400">{form.likesCount ?? 0}</p>
                <p className="text-neutral-500 text-xs font-montserrat mt-1.5">❤️ Likes</p>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold font-playfair text-blue-400">{form.commentsCount ?? 0}</p>
                <p className="text-neutral-500 text-xs font-montserrat mt-1.5">💬 Comments</p>
              </div>
            </div>
          </section>

        </div>
      );

      // ── DESCRIPTION ───────────────────────────────────────────────────────
      case 'article': return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-3 font-montserrat uppercase tracking-wider">
              Description
            </label>
            <RichTextEditor
              label=""
              value={form.description || ''}
              onChange={(v) => setField('description', v)}
              placeholder="Describe the outfit in detail — fabric, style, occasion, styling tips…"
              minHeight={300}
            />
          </div>
        </div>
      );

      // ── SEO ───────────────────────────────────────────────────────────────
      case 'seo': {
        const seo = form.seo || EMPTY_SEO;
        const setSeo = <K extends keyof IOutfitSEO>(k: K, v: IOutfitSEO[K]) =>
          setSeoField(k, v);

        const metaTitleLen = (seo.metaTitle       || '').length;
        const metaDescLen  = (seo.metaDescription || '').length;
        const titleScore   = metaTitleLen === 0 ? 'empty' : metaTitleLen <= 60  ? 'good' : 'long';
        const descScore    = metaDescLen  === 0 ? 'empty' : metaDescLen  <= 160 ? 'good' : 'long';
        const scoreColor   = (s: string) =>
          s === 'good' ? 'text-emerald-400' : s === 'long' ? 'text-amber-400' : 'text-neutral-600';
        const scoreLabel   = (s: string, len: number, max: number) =>
          s === 'empty' ? 'Not set' : s === 'good' ? `${len}/${max} ✓ Good` : `${len}/${max} — Too long`;

        // Completion %
        const filledCount = [seo.focusKeyword, seo.metaTitle, seo.metaDescription, seo.canonicalUrl,
          seo.ogTitle, seo.ogImage, seo.twitterTitle, seo.twitterImage, seo.schemaType].filter(Boolean).length;
        const filledPct = Math.round((filledCount / 9) * 100);

        return (
          <div className="space-y-7">

            {/* ── Score bar ──────────────────────────────────── */}
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

            {/* ── On-Page SEO ─────────────────────────────────── */}
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
                    placeholder="e.g. Bollywood celebrity outfit"
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
                    placeholder={`${form.title || 'Outfit Title'} — Celebrity Persona`}
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${
                      titleScore === 'long' ? 'border-amber-500/40 focus:border-amber-500/60' :
                      titleScore === 'good' ? 'border-emerald-500/30 focus:border-emerald-500/60' : 'border-white/10 focus:border-yellow-500/60'
                    }`}
                  />
                  <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        titleScore === 'good' ? 'bg-emerald-500' : titleScore === 'long' ? 'bg-amber-500' : 'bg-neutral-700'
                      }`}
                      style={{ width: `${Math.min(100, (metaTitleLen / 60) * 100)}%` }}
                    />
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
                    <div
                      className={`h-full rounded-full transition-all ${
                        descScore === 'good' ? 'bg-emerald-500' : descScore === 'long' ? 'bg-amber-500' : 'bg-neutral-700'
                      }`}
                      style={{ width: `${Math.min(100, (metaDescLen / 160) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Secondary keywords */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Secondary Keywords (one per line)</label>
                  <textarea
                    rows={3} value={joinLines(seo.metaKeywords)}
                    onChange={(e) => setSeo('metaKeywords', splitLines(e.target.value))}
                    placeholder={"beige kurta set\ncelebrity outfit\nGopi Vaid designer"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(seo.metaKeywords || []).length} keywords</p>
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Canonical URL</label>
                  <input
                    type="url" value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeo('canonicalUrl', e.target.value)}
                    placeholder={`https://yoursite.com/fashion-gallery/${form.slug || 'outfit-slug'}`}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Prevents duplicate-content penalties. Leave blank to use the page URL.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Open Graph (Facebook / LinkedIn) ─────────── */}
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
                    placeholder={seo.metaTitle || `${form.title || 'Outfit Title'} — Fashion`}
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
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-all">
                        ✕
                      </button>
                    </div>
                  )}
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to default to outfit primary image.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Twitter / X Card ─────────────────────────── */}
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
                      <button
                        key={type} type="button"
                        onClick={() => setSeo('twitterCard', type)}
                        className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-montserrat font-medium transition-all ${
                          seo.twitterCard === type
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
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
                    placeholder={seo.metaTitle || `${form.title || 'Outfit Title'}`}
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
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-all">
                        ✕
                      </button>
                    </div>
                  )}
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to fall back to OG Image.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Structured Data / Schema.org ─────────────── */}
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
                    value={seo.schemaType || 'Product'}
                    onChange={(e) => setSeo('schemaType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                  >
                    {['Product', 'Article', 'BlogPosting', 'CreativeWork', 'ItemList'].map((t) => (
                      <option key={t} value={t} style={{ background: '#2b1433' }}>{t}</option>
                    ))}
                  </select>
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Fashion outfits = Product. Use Article for editorial posts.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Article Section</label>
                  <input
                    type="text" value={seo.articleSection || ''}
                    onChange={(e) => setSeo('articleSection', e.target.value)}
                    placeholder="Fashion, Bollywood, Wedding…"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Robots / Crawling ───────────────────────── */}
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
                    <button
                      type="button" onClick={() => setSeo('robotsIndex', !(seo.robotsIndex !== false))}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsIndex !== false ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsIndex !== false ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsIndex !== false ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {seo.robotsIndex !== false ? 'index' : 'noindex'}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${
                  seo.robotsFollow !== false ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-amber-500/8 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-montserrat text-white">Follow links</p>
                      <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Allow crawlers to follow links on this page</p>
                    </div>
                    <button
                      type="button" onClick={() => setSeo('robotsFollow', !(seo.robotsFollow !== false))}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsFollow !== false ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsFollow !== false ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsFollow !== false ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {seo.robotsFollow !== false ? 'follow' : 'nofollow'}
                  </p>
                </div>
              </div>
              {/* robots meta preview */}
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
          {[
            { label: 'Total',     value: total,                                                      icon: 'ShoppingBagIcon',   color: 'text-yellow-400'  },
            { label: 'Published', value: outfits.filter((o) => o.status === 'published').length,     icon: 'CheckBadgeIcon',    color: 'text-emerald-400' },
            { label: 'Draft',     value: outfits.filter((o) => o.status === 'draft').length,         icon: 'DocumentTextIcon',  color: 'text-yellow-300'  },
            { label: 'Featured',  value: outfits.filter((o) => o.isFeatured).length,                 icon: 'SparklesIcon',      color: 'text-purple-400'  },
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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchList(1); }}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer w-full md:w-36"
          >
            <option value="" style={{ background: '#2b1433' }}>All Statuses</option>
            <option value="published" style={{ background: '#2b1433' }}>Published</option>
            <option value="draft" style={{ background: '#2b1433' }}>Draft</option>
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
              <Icon name="PlusIcon" size={16} /> Add Outfit
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
                  {panelMode === 'add' ? 'Add New Outfit' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in outfit details across tabs' : 'Update outfit details'}
                </p>
              </div>
            </div>
            <button onClick={closePanel} className="self-end sm:self-auto p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <p className="text-neutral-600 text-xs font-montserrat">* Required fields</p>
                  {form.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-montserrat capitalize ${STATUS_COLORS[form.status] || STATUS_COLORS.draft}`}>
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
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20 font-montserrat text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
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
                      : (panelMode === 'add' ? 'Publish Outfit' : 'Save & Publish')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table */}
      {!panelMode && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
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
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Outfit</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden md:table-cell">Celebrity</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden lg:table-cell">Brand / Category</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Price</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3.5 px-3"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 200 }} /></td>
                        <td className="py-3.5 px-3 hidden md:table-cell"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 140 }} /></td>
                        <td className="py-3.5 px-3 hidden lg:table-cell"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 120 }} /></td>
                        <td className="py-3.5 px-3 hidden sm:table-cell"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 70 }} /></td>
                        <td className="py-3.5 px-3 hidden sm:table-cell"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 80 }} /></td>
                        <td className="py-3.5 px-3"><div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: 80 }} /></td>
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
                        <td className="py-3.5 px-3 hidden md:table-cell">
                          <p className="text-neutral-300 text-sm font-montserrat">{getCelebrityName(o.celebrity)}</p>
                          {o.designer && <p className="text-neutral-600 text-xs font-montserrat">by {o.designer}</p>}
                        </td>
                        {/* Brand / Category */}
                        <td className="py-3.5 px-3 hidden lg:table-cell">
                          {o.brand && <p className="text-neutral-300 text-sm font-montserrat">{o.brand}</p>}
                          {o.category && <p className="text-neutral-500 text-xs font-montserrat">{o.category}</p>}
                          {!o.brand && !o.category && <span className="text-neutral-600 text-xs font-montserrat">—</span>}
                        </td>
                        {/* Price */}
                        <td className="py-3.5 px-3 hidden sm:table-cell">
                          <span className="text-yellow-400 font-bold font-montserrat text-sm">{o.price || '—'}</span>
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-3 hidden sm:table-cell">
                          <div className="flex flex-col gap-1.5">
                            <div className="inline-flex rounded-lg overflow-hidden border border-white/10">
                              <button
                                onClick={() => handleStatusToggle(o, 'draft')}
                                disabled={!!busyMap[o.id]}
                                title="Set to Draft"
                                className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                                  (o.status || 'draft') === 'draft'
                                    ? 'bg-yellow-500/25 text-yellow-300'
                                    : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                                }`}
                              >
                                Draft
                              </button>
                              <button
                                onClick={() => handleStatusToggle(o, 'published')}
                                disabled={!!busyMap[o.id]}
                                title="Set to Published"
                                className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                                  o.status === 'published'
                                    ? 'bg-emerald-500/25 text-emerald-300'
                                    : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                                }`}
                              >
                                Published
                              </button>
                            </div>
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
