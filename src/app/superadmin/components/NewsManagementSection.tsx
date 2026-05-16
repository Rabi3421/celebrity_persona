"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/imageUpload';
import Icon from '@/components/ui/AppIcon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface INewsSEO {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  metaKeywords?: string[];
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  noindex?: boolean;
  nofollow?: boolean;
  // form-friendly fields
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
  structuredData?: string;
  structuredDataDepth?: string;
  alternateLangs?: string[];
  prevUrl?: string;
  nextUrl?: string;
  contentTags?: string[];
}

interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  images?: string[];
  author?: string;
  authorName?: string;
  reviewerName?: string;
  category?: string;
  newsType?: string;
  celebrity?: any;
  primaryCelebrity?: any;
  primaryCelebritySlug?: string;
  relatedCelebrities?: RelatedCelebrity[];
  tags?: string[];
  publishDate?: string;
  publishedAt?: string;
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  featured: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  createdAt?: string;
}

interface NewsFull extends NewsRow {
  content: string;
  introduction?: string;
  body?: string;
  backgroundContext?: string;
  whatHappened?: string;
  whyItMatters?: string;
  publicReaction?: string;
  officialStatement?: string;
  celebrityQuote?: string;
  conclusion?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  galleryImages?: GalleryImage[];
  videoEmbedUrl?: string;
  instagramEmbedUrl?: string;
  youtubeEmbedUrl?: string;
  xEmbedUrl?: string;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  isSourceVerified?: boolean;
  sourceCreditText?: string;
  additionalReferences?: NewsReference[];
  factCheckNotes?: string;
  readingTime?: number;
  schema?: NewsSchema;
  seo?: INewsSEO;
}

interface RelatedCelebrity {
  name: string;
  slug?: string;
  image?: string;
  profileUrl?: string;
}

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

interface NewsReference {
  title?: string;
  url?: string;
  sourceName?: string;
}

interface NewsSchema {
  schemaType?: 'NewsArticle' | 'Article' | 'BlogPosting';
  schemaHeadline?: string;
  schemaDescription?: string;
  schemaImage?: string;
  schemaArticleSection?: string;
  schemaKeywords?: string[];
  publisherName?: string;
  publisherLogo?: string;
  mainEntityOfPage?: string;
}

type FormTab   = 'basic' | 'celebrities' | 'content' | 'media' | 'sources' | 'seo' | 'schema' | 'publishing';
type PanelMode = 'add' | 'edit' | null;
type Toast     = { type: 'success' | 'error'; message: string } | null;

const PAGE_SIZES = [10, 20, 50];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
  draft:     'bg-yellow-500/20 text-yellow-400',
  archived:  'bg-red-500/20 text-red-400',
};

const EMPTY_SEO: INewsSEO = {
  metaTitle: '', metaDescription: '', focusKeyword: '',
  metaKeywords: [], canonicalUrl: '', robots: 'index,follow',
  noindex: false, nofollow: false,
  ogImage: '', ogTitle: '', ogDescription: '', ogType: 'article', ogSiteName: '', ogUrl: '', ogImages: [],
  robotsIndex: true, robotsFollow: true,
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '',
  twitterImage: '', twitterSite: '', twitterCreator: '',
  authorName: '', authorUrl: '', section: '', articleSection: '', relatedTopics: [],
  schemaType: 'NewsArticle', structuredData: '', structuredDataDepth: 'basic',
  alternateLangs: [], prevUrl: '', nextUrl: '',
};

const EMPTY_FORM: NewsFull = {
  id: '', title: '', slug: '', content: '', excerpt: '',
  thumbnail: '', images: [], author: '', category: '', celebrity: '',
  authorName: '', reviewerName: '', newsType: 'Entertainment', primaryCelebrity: '', primaryCelebritySlug: '',
  relatedCelebrities: [], tags: [], publishDate: '', publishedAt: '', scheduledAt: '',
  status: 'draft' as const, featured: false, isFeatured: false, isTrending: false, isBreaking: false,
  introduction: '', body: '', backgroundContext: '', whatHappened: '', whyItMatters: '',
  publicReaction: '', officialStatement: '', celebrityQuote: '', conclusion: '',
  featuredImage: '', featuredImageAlt: '', featuredImageCaption: '', imageCredit: '', imageSourceUrl: '',
  galleryImages: [], videoEmbedUrl: '', instagramEmbedUrl: '', youtubeEmbedUrl: '', xEmbedUrl: '',
  sourceType: '', sourceName: '', sourceUrl: '', sourcePublishedAt: '', isSourceVerified: false,
  sourceCreditText: '', additionalReferences: [], factCheckNotes: '', readingTime: undefined,
  schema: {
    schemaType: 'NewsArticle', schemaHeadline: '', schemaDescription: '', schemaImage: '',
    schemaArticleSection: '', schemaKeywords: [], publisherName: 'CelebrityPersona',
    publisherLogo: '', mainEntityOfPage: '',
  },
  seo: { ...EMPTY_SEO },
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',       label: 'Basic Info',             icon: 'InformationCircleIcon'  },
  { key: 'celebrities', label: 'Celebrities',             icon: 'StarIcon'               },
  { key: 'content',     label: 'Content',                 icon: 'DocumentTextIcon'       },
  { key: 'media',       label: 'Media',                   icon: 'PhotoIcon'              },
  { key: 'sources',     label: 'Sources & Verification', icon: 'CheckBadgeIcon'         },
  { key: 'seo',         label: 'SEO',                     icon: 'MagnifyingGlassIcon'    },
  { key: 'schema',      label: 'Schema',                  icon: 'CodeBracketIcon'        },
  { key: 'publishing',  label: 'Publishing',              icon: 'PaperAirplaneIcon'      },
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

const NEWS_TYPES = ['Breaking News', 'Exclusive', 'Interview', 'Feature', 'Rumor', 'Update', 'Analysis', 'Entertainment'];
const SOURCE_TYPES = ['Official Statement', 'Interview', 'Social Media', 'News Outlet', 'Press Release', 'Public Record', 'Other'];

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
  const [statusFilter, setStatusFilter]     = useState('');

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
  const [draftLoading, setDraftLoading]   = useState(false);
  const [formApiError, setFormApiError]   = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const isSlugEditedRef = useRef(false);
  const [celebrities, setCelebrities] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const setUploading = (i: number, v: boolean) => setUploadingMap((p) => ({ ...p, [i]: v }));

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
      if (statusFilter)   params.set('status',   statusFilter);
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
  }, [authHeaders, searchQuery, categoryFilter, authorFilter, statusFilter, limit]);

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
    if (!form.title.trim()) {
      showToast('error', 'Please enter the article title before uploading the thumbnail');
      return;
    }
    const validation = validateImageFile(file);
    if (validation) { showToast('error', validation); return; }
    setUploadingThumbnail(true);
    try {
      const slug = form.slug?.trim() || slugify(form.title.trim()) || 'article';
      const url = await uploadImage(file, `news/${slug}`);
      if (form.thumbnail) {
        try { await deleteImage(form.thumbnail); } catch { /* ignore */ }
      }
      setField('thumbnail', url);
      setField('featuredImage', url);
      if (!form.seo?.ogImage) setSeoField('ogImage', url);
      if (!form.seo?.twitterImage) setSeoField('twitterImage', url);
      setForm((f) => ({ ...f, schema: { ...(f.schema || {}), schemaImage: f.schema?.schemaImage || url } }));
      showToast('success', 'Thumbnail uploaded');
    } catch {
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

  // Gallery handlers
  const addGalleryImage    = () => setField('images', [...(form.images || []), '']);
  const removeGalleryImage = (i: number) => setField('images', (form.images || []).filter((_, idx) => idx !== i));
  const updateGalleryImage = (i: number, val: string) =>
    setField('images', (form.images || []).map((img, idx) => (idx === i ? val : img)));

  const newsFolder = () => {
    const slug = form.slug?.trim() || slugify(form.title.trim()) || 'article';
    return `news/${slug}`;
  };

  const handleSelectGalleryImage = (i: number) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => {
      const f = e.target.files?.[0];
      if (f) handleUploadGalleryImage(f, i);
    };
    input.click();
  };

  const handleDropGalleryImage = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleUploadGalleryImage(f, i);
  };

  const handleUploadGalleryImage = async (file: File, i: number) => {
    if (!form.title.trim()) {
      showToast('error', 'Please enter the article title before uploading images');
      return;
    }
    const validation = validateImageFile(file);
    if (validation) { showToast('error', validation); return; }
    setUploading(i, true);
    try {
      const old = (form.images || [])[i];
      const url = await uploadImage(file, newsFolder());
      if (old) { try { await deleteImage(old); } catch { /* ignore */ } }
      updateGalleryImage(i, url);
      showToast('success', 'Image uploaded');
    } catch {
      showToast('error', 'Failed to upload image');
    } finally {
      setUploading(i, false);
    }
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
        content:     d.body || d.content || '',
        body:        d.body || d.content || '',
        introduction: d.introduction || '',
        backgroundContext: d.backgroundContext || '',
        whatHappened: d.whatHappened || '',
        whyItMatters: d.whyItMatters || '',
        publicReaction: d.publicReaction || '',
        officialStatement: d.officialStatement || '',
        celebrityQuote: d.celebrityQuote || '',
        conclusion: d.conclusion || '',
        excerpt:     d.excerpt     || '',
        thumbnail:   d.featuredImage || d.thumbnail || '',
        featuredImage: d.featuredImage || d.thumbnail || '',
        featuredImageAlt: d.featuredImageAlt || '',
        featuredImageCaption: d.featuredImageCaption || '',
        imageCredit: d.imageCredit || '',
        imageSourceUrl: d.imageSourceUrl || '',
        images:      Array.isArray(d.images) ? d.images : [],
        galleryImages: Array.isArray(d.galleryImages) ? d.galleryImages : [],
        videoEmbedUrl: d.videoEmbedUrl || '',
        instagramEmbedUrl: d.instagramEmbedUrl || '',
        youtubeEmbedUrl: d.youtubeEmbedUrl || '',
        xEmbedUrl: d.xEmbedUrl || '',
        author:      d.authorName || d.author || '',
        authorName:  d.authorName || d.author || '',
        reviewerName: d.reviewerName || '',
        category:    d.category    || '',
        newsType:    d.newsType    || 'Entertainment',
        celebrity:   (function() {
                        if (!d.celebrity) return '';
                        if (typeof d.celebrity === 'string') return d.celebrity;
                        if (d.celebrity._id) return String(d.celebrity._id);
                        if (d.celebrity.id) return String(d.celebrity.id);
                        return '';
                      })(),
        primaryCelebrity: (function() {
                        const pc = d.primaryCelebrity || d.celebrity;
                        if (!pc) return '';
                        if (typeof pc === 'string') return pc;
                        if (pc._id) return String(pc._id);
                        if (pc.id) return String(pc.id);
                        return '';
                      })(),
        primaryCelebritySlug: d.primaryCelebritySlug || d.primaryCelebrity?.slug || '',
        relatedCelebrities: Array.isArray(d.relatedCelebrities) ? d.relatedCelebrities : [],
        tags:        d.tags        || [],
        publishDate: toDateInputValue(d.publishedAt || d.publishDate),
        publishedAt: toDateInputValue(d.publishedAt || d.publishDate),
        scheduledAt: toDateInputValue(d.scheduledAt),
        status:      (['draft', 'scheduled', 'published', 'archived'].includes(d.status) ? d.status : 'draft') as NewsFull['status'],
        featured:    d.isFeatured ?? d.featured ?? false,
        isFeatured:  d.isFeatured ?? d.featured ?? false,
        isTrending:  d.isTrending ?? false,
        isBreaking:  d.isBreaking ?? false,
        sourceType: d.sourceType || '',
        sourceName: d.sourceName || '',
        sourceUrl: d.sourceUrl || '',
        sourcePublishedAt: toDateInputValue(d.sourcePublishedAt),
        isSourceVerified: d.isSourceVerified || false,
        sourceCreditText: d.sourceCreditText || '',
        additionalReferences: Array.isArray(d.additionalReferences) ? d.additionalReferences : [],
        factCheckNotes: d.factCheckNotes || '',
        readingTime: d.readingTime || undefined,
        schema: { ...EMPTY_FORM.schema, ...(d.schema || {}) },
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

  // ─── SEO image upload state ───────────────────────────────────────────────
  type UploadSlot = { uploading: boolean; progress: number; error: string };
  const emptySlot = (): UploadSlot => ({ uploading: false, progress: 0, error: '' });
  const [ogImageUpload, setOgImageUpload]           = useState<UploadSlot>(emptySlot());
  const [twitterImageUpload, setTwitterImageUpload] = useState<UploadSlot>(emptySlot());

  const handleOgImageUpload = async (file: File) => {
    setOgImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const slug = form.slug?.trim() || slugify(form.title.trim()) || 'article';
      const url  = await uploadImage(file, `news/${slug}/og`);
      setSeoField('ogImage', url);
      setOgImageUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setOgImageUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
    }
  };

  const handleTwitterImageUpload = async (file: File) => {
    setTwitterImageUpload({ uploading: true, progress: 10, error: '' });
    try {
      const slug = form.slug?.trim() || slugify(form.title.trim()) || 'article';
      const url  = await uploadImage(file, `news/${slug}/twitter`);
      setSeoField('twitterImage', url);
      setTwitterImageUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setTwitterImageUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
    }
  };

  // ─── validate draft (title required) ────────────────────────────────────
  const validateDraft = () => {
    const errs: Partial<Record<keyof NewsFull, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required to save as draft';
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
        res = await fetch(`/api/superadmin/news/${form.id}`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/superadmin/news', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save draft');
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

  // ─── quick status toggle ─────────────────────────────────────────────────
  const handleStatusToggle = async (n: NewsRow, newStatus: NewsRow['status']) => {
    if (n.status === newStatus) return;
    setBusy(n.id, true);
    try {
      const res  = await fetch(`/api/superadmin/news/${n.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setNews((prev) => prev.map((x) => x.id === n.id ? { ...x, status: newStatus } : x));
      showToast('success', `"${n.title}" set to ${newStatus}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    } finally {
      setBusy(n.id, false);
    }
  };

  // ─── validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof NewsFull, string>> = {};
    if (!form.title.trim())   errs.title   = 'Title is required';
    if (!form.slug.trim())    errs.slug    = 'Slug is required';
    if (!form.excerpt?.trim()) errs.excerpt = 'Excerpt is required';
    if (!form.category?.trim()) errs.category = 'Category is required';
    if (!form.newsType?.trim()) errs.newsType = 'News type is required';
    if (!form.content.trim()) errs.content = 'Body is required';
    if (!form.featuredImage?.trim() && !form.thumbnail?.trim()) errs.featuredImage = 'Featured image is required';
    if (!form.featuredImageAlt?.trim()) errs.featuredImageAlt = 'Featured image alt text is required';
    if (!form.sourceType?.trim()) errs.sourceType = 'Source type is required';
    if (!form.sourceName?.trim()) errs.sourceName = 'Source name is required';
    if (!form.sourceUrl?.trim()) errs.sourceUrl = 'Source URL is required';
    if (!form.seo?.focusKeyword?.trim()) errs.seo = 'Focus keyword is required';
    if (!form.seo?.metaTitle?.trim()) errs.seo = 'Meta title is required';
    if (!form.seo?.metaDescription?.trim()) errs.seo = 'Meta description is required';
    if (form.status === 'published' && !form.publishedAt && !form.publishDate) errs.publishedAt = 'Published date is required';
    if (form.status === 'scheduled' && !form.scheduledAt) errs.scheduledAt = 'Scheduled date is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── payload ─────────────────────────────────────────────────────────────
  const setSeoField = <K extends keyof INewsSEO>(k: K, v: INewsSEO[K]) =>
    setForm((f) => ({ ...f, seo: { ...(f.seo || EMPTY_SEO), [k]: v } }));

  const setSchemaField = <K extends keyof NewsSchema>(k: K, v: NewsSchema[K]) =>
    setForm((f) => ({ ...f, schema: { ...(f.schema || EMPTY_FORM.schema || {}), [k]: v } }));

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f,
      title: v,
      slug: isSlugEditedRef.current ? f.slug : slugify(v),
      seo: {
        ...(f.seo || EMPTY_SEO),
        metaTitle: f.seo?.metaTitle || v,
        ogTitle: f.seo?.ogTitle || v,
        twitterTitle: f.seo?.twitterTitle || v,
      },
      schema: {
        ...(f.schema || EMPTY_FORM.schema || {}),
        schemaHeadline: f.schema?.schemaHeadline || v,
      },
    }));
  };

  const handleExcerptChange = (v: string) => {
    setForm((f) => ({
      ...f,
      excerpt: v,
      seo: {
        ...(f.seo || EMPTY_SEO),
        metaDescription: f.seo?.metaDescription || v,
        ogDescription: f.seo?.ogDescription || v,
        twitterDescription: f.seo?.twitterDescription || v,
      },
      schema: {
        ...(f.schema || EMPTY_FORM.schema || {}),
        schemaDescription: f.schema?.schemaDescription || v,
      },
    }));
  };

  const handleFeaturedImageChange = (v: string) => {
    setForm((f) => ({
      ...f,
      thumbnail: v,
      featuredImage: v,
      seo: {
        ...(f.seo || EMPTY_SEO),
        ogImage: f.seo?.ogImage || v,
        twitterImage: f.seo?.twitterImage || v,
      },
      schema: {
        ...(f.schema || EMPTY_FORM.schema || {}),
        schemaImage: f.schema?.schemaImage || v,
      },
    }));
  };

  const buildPayload = () => ({
    title:       form.title.trim(),
    slug:        form.slug?.trim() || undefined,
    content:     form.content.trim(),
    body:        form.content.trim(),
    introduction: form.introduction || undefined,
    backgroundContext: form.backgroundContext || undefined,
    whatHappened: form.whatHappened || undefined,
    whyItMatters: form.whyItMatters || undefined,
    publicReaction: form.publicReaction || undefined,
    officialStatement: form.officialStatement || undefined,
    celebrityQuote: form.celebrityQuote || undefined,
    conclusion: form.conclusion || undefined,
    excerpt:     form.excerpt?.trim()     || undefined,
    thumbnail:   (form.featuredImage || form.thumbnail)?.trim()   || undefined,
    featuredImage: (form.featuredImage || form.thumbnail)?.trim() || undefined,
    featuredImageAlt: form.featuredImageAlt || undefined,
    featuredImageCaption: form.featuredImageCaption || undefined,
    imageCredit: form.imageCredit || undefined,
    imageSourceUrl: form.imageSourceUrl || undefined,
    images:      (form.images || []).filter((u) => u.trim()),
    galleryImages: form.galleryImages || [],
    videoEmbedUrl: form.videoEmbedUrl || undefined,
    instagramEmbedUrl: form.instagramEmbedUrl || undefined,
    youtubeEmbedUrl: form.youtubeEmbedUrl || undefined,
    xEmbedUrl: form.xEmbedUrl || undefined,
    author:      (form.authorName || form.author)?.trim()      || undefined,
    authorName:  (form.authorName || form.author)?.trim()      || undefined,
    reviewerName: form.reviewerName || undefined,
    category:    form.category?.trim()    || undefined,
    newsType:    form.newsType || undefined,
    celebrity:   form.primaryCelebrity || form.celebrity || null,
    primaryCelebrity: form.primaryCelebrity || form.celebrity || null,
    primaryCelebritySlug: form.primaryCelebritySlug || undefined,
    relatedCelebrities: form.relatedCelebrities || [],
    tags:        form.tags || [],
    publishDate: form.publishedAt || form.publishDate || undefined,
    publishedAt: form.publishedAt || form.publishDate || undefined,
    scheduledAt: form.scheduledAt || undefined,
    status:      form.status,
    featured:    form.isFeatured ?? form.featured,
    isFeatured:  form.isFeatured ?? form.featured,
    isTrending:  form.isTrending,
    isBreaking:  form.isBreaking,
    sourceType: form.sourceType || undefined,
    sourceName: form.sourceName || undefined,
    sourceUrl: form.sourceUrl || undefined,
    sourcePublishedAt: form.sourcePublishedAt || undefined,
    isSourceVerified: form.isSourceVerified,
    sourceCreditText: form.sourceCreditText || undefined,
    additionalReferences: form.additionalReferences || [],
    factCheckNotes: form.factCheckNotes || undefined,
    readingTime: form.readingTime || undefined,
    schema: form.schema,
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
                handleTitleChange(e.target.value);
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
              onChange={(e) => { setField('author', e.target.value); setField('authorName', e.target.value); }}
              placeholder="e.g. Rabinarayan Pradhan"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Reviewer</label>
            <input type="text" value={form.reviewerName || ''}
              onChange={(e) => setField('reviewerName', e.target.value)}
              placeholder="Optional editorial reviewer"
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

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">News Type <span className="text-yellow-400">*</span></label>
            <select
              value={form.newsType || ''}
              onChange={(e) => setField('newsType', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm ${errBorder('newsType')}`}
            >
              <option value="">Select type</option>
              {NEWS_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {formErrors.newsType && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.newsType}</p>}
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

          {/* Excerpt */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Excerpt</label>
            <textarea value={form.excerpt || ''} rows={3}
              onChange={(e) => handleExcerptChange(e.target.value)}
              placeholder="Brief summary of the article..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['isFeatured', 'Featured'],
              ['isTrending', 'Trending'],
              ['isBreaking', 'Breaking'],
            ].map(([key, label]) => (
              <button key={key} type="button"
                onClick={() => {
                  const next = !(form as any)[key];
                  setField(key as keyof NewsFull, next as any);
                  if (key === 'isFeatured') setField('featured', next as any);
                }}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all ${
                  (form as any)[key] ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-montserrat font-medium">{label}</span>
                <span className={`h-5 w-10 rounded-full relative ${(form as any)[key] ? 'bg-yellow-500' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${(form as any)[key] ? 'left-5' : 'left-0.5'}`} />
                </span>
              </button>
            ))}
          </div>
        </div>
      );

      // ── CELEBRITIES ────────────────────────────────────────────────────
      case 'celebrities': return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Primary Celebrity</label>
              <select value={form.primaryCelebrity || ''}
                onChange={(e) => {
                  const selected = celebrities.find((c) => c.id === e.target.value);
                  setField('primaryCelebrity', e.target.value || '');
                  setField('celebrity', e.target.value || '');
                  setField('primaryCelebritySlug', selected?.name ? slugify(selected.name) : '');
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              >
                <option value="">None</option>
                {celebrities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1 font-montserrat">Used for related profile links and celebrity filters.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Primary Celebrity Slug</label>
              <input type="text" value={form.primaryCelebritySlug || ''}
                onChange={(e) => setField('primaryCelebritySlug', e.target.value)}
                placeholder="celebrity-profile-slug"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white font-montserrat">Related Celebrities</p>
                <p className="text-xs text-neutral-500 font-montserrat">Add celebrity chips/cards that should appear on the public article.</p>
              </div>
              <button type="button" onClick={() => setField('relatedCelebrities', [...(form.relatedCelebrities || []), { name: '', slug: '', image: '', profileUrl: '' }])}
                className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-montserrat hover:bg-yellow-500/20">
                + Add Celebrity
              </button>
            </div>
            <div className="space-y-3">
              {(form.relatedCelebrities || []).map((item, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  {(['name', 'slug', 'image', 'profileUrl'] as const).map((key) => (
                    <input key={key} value={item[key] || ''}
                      onChange={(e) => {
                        const next = [...(form.relatedCelebrities || [])];
                        next[i] = { ...next[i], [key]: e.target.value };
                        setField('relatedCelebrities', next);
                      }}
                      placeholder={key}
                      className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                    />
                  ))}
                  <button type="button" onClick={() => setField('relatedCelebrities', (form.relatedCelebrities || []).filter((_, idx) => idx !== i))}
                    className="md:col-span-4 justify-self-start px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-montserrat hover:bg-red-500/20">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      // ── MEDIA ──────────────────────────────────────────────────────────
      case 'media': {
        const canUpload = !!form.title.trim();
        const articleSlug = form.slug?.trim() || slugify(form.title.trim()) || 'article';
        return (
          <div className="space-y-6">

            {/* Upload path notice */}
            {!canUpload ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-300 text-xs font-montserrat leading-relaxed">
                  <span className="font-semibold">Enter the article title first.</span>{' '}
                  Images will be organised in a dedicated folder once the title is filled.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <Icon name="FolderIcon" size={14} className="text-green-400 shrink-0" />
                <p className="text-green-300 text-xs font-montserrat truncate">
                  Upload path: <span className="font-semibold">news / {articleSlug}</span>
                </p>
              </div>
            )}

            {/* ── Thumbnail ── */}
            <div>
              <p className="text-white text-sm font-montserrat font-semibold mb-1">Thumbnail</p>
              <p className="text-neutral-500 text-xs font-montserrat mb-3">Cover image shown in article cards and social previews.</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setThumbnailDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setThumbnailDragActive(false); }}
                onDrop={(e) => { setThumbnailDragActive(false); handleDropThumbnail(e); }}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all group ${
                  thumbnailDragActive
                    ? 'border-yellow-400/60 bg-yellow-500/5'
                    : form.thumbnail
                      ? 'border-white/10 hover:border-yellow-500/30'
                      : 'border-dashed border-white/15 hover:border-yellow-500/40 hover:bg-yellow-500/5'
                }`}
              >
                {uploadingThumbnail ? (
                  <div className="h-44 flex flex-col items-center justify-center gap-3">
                    <Icon name="ArrowPathIcon" size={28} className="text-yellow-400 animate-spin" />
                    <p className="text-yellow-400 text-xs font-montserrat">Uploading…</p>
                  </div>
                ) : form.thumbnail ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.thumbnail} alt="thumbnail" className="w-full max-h-64 object-cover" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={handleSelectThumbnail} disabled={!canUpload}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-black text-xs font-bold font-montserrat hover:bg-yellow-400 transition-all disabled:opacity-50">
                        <Icon name="ArrowUpTrayIcon" size={13} /> Replace
                      </button>
                      <button type="button" onClick={handleDeleteThumbnail}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-montserrat hover:bg-red-500/30 hover:text-red-300 transition-all">
                        <Icon name="TrashIcon" size={13} /> Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => canUpload && handleSelectThumbnail()}
                    disabled={!canUpload}
                    className={`w-full h-44 flex flex-col items-center justify-center gap-2 transition-colors ${
                      canUpload ? 'text-neutral-600 hover:text-yellow-400 cursor-pointer' : 'text-neutral-700 cursor-not-allowed'
                    }`}
                  >
                    <Icon name="ArrowUpTrayIcon" size={28} />
                    <p className="text-xs font-montserrat">Click or drop to upload thumbnail</p>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input
                  type="url"
                  value={form.featuredImage || form.thumbnail || ''}
                  onChange={(e) => handleFeaturedImageChange(e.target.value)}
                  placeholder="Featured image URL"
                  className={`px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm ${errBorder('featuredImage')}`}
                />
                <input
                  value={form.featuredImageAlt || ''}
                  onChange={(e) => setField('featuredImageAlt', e.target.value)}
                  placeholder="Featured image alt text"
                  className={`px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm ${errBorder('featuredImageAlt')}`}
                />
                <input
                  value={form.featuredImageCaption || ''}
                  onChange={(e) => setField('featuredImageCaption', e.target.value)}
                  placeholder="Image caption"
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <input
                  value={form.imageCredit || ''}
                  onChange={(e) => setField('imageCredit', e.target.value)}
                  placeholder="Image credit"
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
                <input
                  type="url"
                  value={form.imageSourceUrl || ''}
                  onChange={(e) => setField('imageSourceUrl', e.target.value)}
                  placeholder="Image source URL"
                  className="md:col-span-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                />
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* ── Gallery ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-white text-sm font-montserrat font-semibold">Gallery Images</p>
                  <p className="text-neutral-500 text-xs font-montserrat mt-0.5">Additional images shown in the article · Upload or paste a URL</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['videoEmbedUrl', 'Video Embed URL'],
                ['instagramEmbedUrl', 'Instagram Embed URL'],
                ['youtubeEmbedUrl', 'YouTube Embed URL'],
                ['xEmbedUrl', 'X / Twitter Embed URL'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
                  <input
                    type="url"
                    value={(form as any)[field] || ''}
                    onChange={(e) => setField(field as keyof NewsFull, e.target.value as any)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }


      // ── CONTENT ────────────────────────────────────────────────────────
      case 'content': return (
        <div className="space-y-5">
          {[
            ['introduction', 'Introduction', 'Open the article with a concise setup.'],
            ['content', 'Body', 'Main article body. Required for publishing.'],
            ['backgroundContext', 'Background Context', 'Useful history or prior context.'],
            ['whatHappened', 'What Happened', 'Describe the core news event.'],
            ['whyItMatters', 'Why It Matters', 'Explain audience impact and significance.'],
            ['publicReaction', 'Public Reaction', 'Social/media/fan response.'],
            ['officialStatement', 'Official Statement', 'Verified public statement or response.'],
            ['conclusion', 'Conclusion', 'Close with next steps or summary.'],
          ].map(([field, label, helper]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
                {label} {field === 'content' && <span className="text-yellow-400">*</span>}
              </label>
              <div className={`rounded-xl border overflow-hidden ${field === 'content' ? errBorder('content') : 'border-white/10'}`}>
                <RichTextEditor
                  label=""
                  value={(form as any)[field] || ''}
                  onChange={(html) => {
                    setField(field as keyof NewsFull, html as any);
                    if (field === 'content') setField('body', html);
                  }}
                  minHeight={field === 'content' ? 260 : 150}
                />
              </div>
              <p className="text-neutral-600 text-xs mt-1 font-montserrat">{helper}</p>
              {field === 'content' && formErrors.content && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.content}</p>}
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Celebrity Quote</label>
            <textarea
              value={form.celebrityQuote || ''}
              onChange={(e) => setField('celebrityQuote', e.target.value)}
              rows={3}
              placeholder="Optional short quote to highlight in the article..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none"
            />
          </div>
        </div>
      );

      // ── SOURCES ────────────────────────────────────────────────────────
      case 'sources': return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Source Type <span className="text-yellow-400">*</span></label>
              <select value={form.sourceType || ''} onChange={(e) => setField('sourceType', e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none font-montserrat text-sm ${errBorder('sourceType')}`}>
                <option value="">Select source type</option>
                {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Source Name <span className="text-yellow-400">*</span></label>
              <input value={form.sourceName || ''} onChange={(e) => setField('sourceName', e.target.value)}
                placeholder="Publication, account, official body..."
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm ${errBorder('sourceName')}`} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Source URL <span className="text-yellow-400">*</span></label>
              <input type="url" value={form.sourceUrl || ''} onChange={(e) => setField('sourceUrl', e.target.value)}
                placeholder="https://..."
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm ${errBorder('sourceUrl')}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Source Published At</label>
              <input type="date" value={form.sourcePublishedAt || ''} onChange={(e) => setField('sourcePublishedAt', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm" />
            </div>
            <button type="button" onClick={() => setField('isSourceVerified', !form.isSourceVerified)}
              className={`self-end rounded-xl border px-4 py-2.5 text-sm font-montserrat transition-all ${
                form.isSourceVerified ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-neutral-400'
              }`}>
              {form.isSourceVerified ? 'Verified Source' : 'Mark Source Verified'}
            </button>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Source Credit Text</label>
              <input value={form.sourceCreditText || ''} onChange={(e) => setField('sourceCreditText', e.target.value)}
                placeholder="Source: Official Instagram / Press release..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white font-montserrat">Additional References</p>
              <button type="button" onClick={() => setField('additionalReferences', [...(form.additionalReferences || []), { title: '', url: '', sourceName: '' }])}
                className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-montserrat hover:bg-yellow-500/20">+ Add Reference</button>
            </div>
            <div className="space-y-3">
              {(form.additionalReferences || []).map((item, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  {(['title', 'url', 'sourceName'] as const).map((key) => (
                    <input key={key} value={item[key] || ''}
                      onChange={(e) => {
                        const next = [...(form.additionalReferences || [])];
                        next[i] = { ...next[i], [key]: e.target.value };
                        setField('additionalReferences', next);
                      }}
                      placeholder={key}
                      className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm" />
                  ))}
                  <button type="button" onClick={() => setField('additionalReferences', (form.additionalReferences || []).filter((_, idx) => idx !== i))}
                    className="md:col-span-3 justify-self-start px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-montserrat hover:bg-red-500/20">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Fact Check Notes</label>
            <textarea value={form.factCheckNotes || ''} onChange={(e) => setField('factCheckNotes', e.target.value)}
              rows={5} placeholder="Private verification notes for editors..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none" />
          </div>
        </div>
      );

      // ── SCHEMA ─────────────────────────────────────────────────────────
      case 'schema': {
        const schema = form.schema || EMPTY_FORM.schema || {};
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Schema Type <span className="text-yellow-400">*</span></label>
              <select value={schema.schemaType || 'NewsArticle'} onChange={(e) => setSchemaField('schemaType', e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm">
                {['NewsArticle', 'Article', 'BlogPosting'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {[
              ['schemaHeadline', 'Schema Headline'],
              ['schemaDescription', 'Schema Description'],
              ['schemaImage', 'Schema Image'],
              ['schemaArticleSection', 'Article Section'],
              ['publisherName', 'Publisher Name'],
              ['publisherLogo', 'Publisher Logo'],
              ['mainEntityOfPage', 'Main Entity Of Page'],
            ].map(([field, label]) => (
              <div key={field} className={field === 'schemaDescription' || field === 'mainEntityOfPage' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
                <input value={(schema as any)[field] || ''} onChange={(e) => setSchemaField(field as keyof NewsSchema, e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Schema Keywords (one per line)</label>
              <textarea value={joinLines(schema.schemaKeywords)} onChange={(e) => setSchemaField('schemaKeywords', splitLines(e.target.value))}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm resize-none" />
            </div>
          </div>
        );
      }

      // ── PUBLISHING ─────────────────────────────────────────────────────
      case 'publishing': return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['draft', 'scheduled', 'published', 'archived'] as const).map((status) => (
              <button key={status} type="button" onClick={() => setField('status', status)}
                className={`rounded-2xl border px-4 py-3 text-sm font-montserrat capitalize transition-all ${
                  form.status === status ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}>
                {status}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Published At</label>
              <input type="date" value={form.publishedAt || form.publishDate || ''} onChange={(e) => { setField('publishedAt', e.target.value); setField('publishDate', e.target.value); }}
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none font-montserrat text-sm ${errBorder('publishedAt')}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Scheduled At</label>
              <input type="date" value={form.scheduledAt || ''} onChange={(e) => setField('scheduledAt', e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none font-montserrat text-sm ${errBorder('scheduledAt')}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Reading Time</label>
              <input type="number" value={form.readingTime || ''} onChange={(e) => setField('readingTime', Number(e.target.value) || undefined)}
                placeholder="Auto if empty"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {form.slug && (
              <a href={`/celebrity-news/${form.slug}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-neutral-200 hover:text-white hover:bg-white/15 font-montserrat text-sm">
                <Icon name="EyeIcon" size={15} /> Preview
              </a>
            )}
            <button type="button" onClick={handleSaveDraft} disabled={draftLoading || formLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-neutral-200 hover:text-white hover:bg-white/15 font-montserrat text-sm disabled:opacity-50">
              <Icon name="DocumentTextIcon" size={15} /> Save Draft
            </button>
            <button type="submit" disabled={formLoading || draftLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 disabled:opacity-50">
              <Icon name="PaperAirplaneIcon" size={15} /> Publish / Save
            </button>
            {panelMode === 'edit' && (
              <button type="button" onClick={() => setField('status', 'archived')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-montserrat text-sm">
                <Icon name="ArchiveBoxIcon" size={15} /> Archive
              </button>
            )}
          </div>
        </div>
      );

      // ── SEO ────────────────────────────────────────────────────────────
      case 'seo': {
        const seo = form.seo || EMPTY_SEO;
        const setSeo = <K extends keyof INewsSEO>(k: K, v: INewsSEO[K]) => setSeoField(k, v);

        const metaTitleLen = (seo.metaTitle       || '').length;
        const metaDescLen  = (seo.metaDescription || '').length;
        const titleScore   = metaTitleLen === 0 ? 'empty' : metaTitleLen <= 60  ? 'good' : 'long';
        const descScore    = metaDescLen  === 0 ? 'empty' : metaDescLen  <= 160 ? 'good' : 'long';
        const scoreColor   = (s: string) =>
          s === 'good' ? 'text-emerald-400' : s === 'long' ? 'text-amber-400' : 'text-neutral-600';
        const scoreLabel   = (s: string, len: number, max: number) =>
          s === 'empty' ? 'Not set' : s === 'good' ? `${len}/${max} ✓ Good` : `${len}/${max} — Too long`;
        const focus = (seo.focusKeyword || '').trim().toLowerCase();
        const focusTargets = [
          ['title', form.title],
          ['slug', form.slug],
          ['excerpt', form.excerpt],
          ['meta title', seo.metaTitle],
          ['meta description', seo.metaDescription],
          ['body', form.content],
        ];
        const missingFocus = focus
          ? focusTargets.filter(([, value]) => !String(value || '').toLowerCase().includes(focus)).map(([label]) => label)
          : [];

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
                    placeholder="e.g. Dhanush new movie 2026"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">The single phrase you most want to rank for.</p>
                  {missingFocus.length > 0 && (
                    <p className="text-amber-400 text-xs mt-1 font-montserrat">
                      Focus keyword missing from: {missingFocus.join(', ')}.
                    </p>
                  )}
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
                    placeholder={`${form.title || 'Article Title'} — Celebrity Persona`}
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
                    rows={3} value={joinLines(seo.secondaryKeywords || seo.metaKeywords)}
                    onChange={(e) => { const list = splitLines(e.target.value); setSeo('secondaryKeywords', list); setSeo('metaKeywords', list); }}
                    placeholder={"sai pallavi new movie\ntamil cinema news\nkollywood casting news 2026"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">{(seo.metaKeywords || []).length} keywords</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Content Tags (one per line)</label>
                  <textarea
                    rows={4} value={joinLines(seo.contentTags || form.tags)}
                    onChange={(e) => { const list = splitLines(e.target.value); setSeo('contentTags', list); setField('tags', list); }}
                    placeholder={"celebrity news\nmovie update\ntrending entertainment"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Canonical URL</label>
                  <input
                    type="url" value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeo('canonicalUrl', e.target.value)}
                    placeholder={`https://yoursite.com/celebrity-news/${form.slug || 'article-slug'}`}
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
                    placeholder={seo.metaTitle || `${form.title || 'Article Title'} — Celebrity Persona`}
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
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Leave blank to default to the article thumbnail.</p>
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
                    placeholder={seo.metaTitle || `${form.title || 'Article Title'}`}
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
                    value={seo.schemaType || 'NewsArticle'}
                    onChange={(e) => setSeo('schemaType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                  >
                    {['NewsArticle', 'Article', 'BlogPosting', 'ReportageNewsArticle'].map((t) => (
                      <option key={t} value={t} style={{ background: '#2b1433' }}>{t}</option>
                    ))}
                  </select>
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Use NewsArticle for news, Article for features/blogs.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Article Section</label>
                  <input
                    type="text" value={seo.articleSection || seo.section || ''}
                    onChange={(e) => setSeo('articleSection', e.target.value)}
                    placeholder="Tamil Cinema, Bollywood, Fashion…"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Author Name</label>
                  <input
                    type="text" value={seo.authorName || ''}
                    onChange={(e) => setSeo('authorName', e.target.value)}
                    placeholder="e.g. Rabinarayan Pradhan"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Author URL</label>
                  <input
                    type="url" value={seo.authorUrl || ''}
                    onChange={(e) => setSeo('authorUrl', e.target.value)}
                    placeholder="https://example.com/author/rabi"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Related Topics (one per line)</label>
                  <textarea
                    rows={3} value={joinLines(seo.relatedTopics)}
                    onChange={(e) => setSeo('relatedTopics', splitLines(e.target.value))}
                    placeholder={"Sai Pallavi\nDhanush\nTamil cinema casting"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Used for semantic SEO connections.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Robots / Crawlability ───────────────────────── */}
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
            { label: 'Total',     value: total,                                                     icon: 'NewspaperIcon',     color: 'text-yellow-400'  },
            { label: 'Published', value: news.filter((n) => n.status === 'published').length,        icon: 'CheckBadgeIcon',    color: 'text-emerald-400' },
            { label: 'Draft',     value: news.filter((n) => (n.status || 'draft') === 'draft').length, icon: 'DocumentTextIcon',  color: 'text-yellow-300'  },
            { label: 'Featured',  value: news.filter((n) => n.featured).length,                     icon: 'SparklesIcon',      color: 'text-purple-400'  },
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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchList(1); }}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer w-full md:w-36"
          >
            <option value="" style={{ background: '#2b1433' }}>All Statuses</option>
            <option value="published" style={{ background: '#2b1433' }}>Published</option>
            <option value="scheduled" style={{ background: '#2b1433' }}>Scheduled</option>
            <option value="draft" style={{ background: '#2b1433' }}>Draft</option>
            <option value="archived" style={{ background: '#2b1433' }}>Archived</option>
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
              <Icon name="PlusIcon" size={16} /> Add Article
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
                  {panelMode === 'add' ? 'Add News Article' : `Editing — ${form.title || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in article details across tabs' : 'Update article details'}
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
                      : (panelMode === 'add' ? 'Publish Article' : 'Save & Publish')}
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-white flex-1">Celebrity News</h3>
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
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Article</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden md:table-cell">Author</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden lg:table-cell">Published</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">Actions</th>
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
                        <td className="py-3.5 px-3 hidden md:table-cell">
                          <p className="text-neutral-300 text-sm font-montserrat">{n.author || '—'}</p>
                        </td>
                        {/* Category */}
                        <td className="py-3.5 px-3 hidden sm:table-cell">
                          {n.category
                            ? <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-montserrat">{n.category}</span>
                            : <span className="text-neutral-600 text-xs font-montserrat">—</span>
                          }
                        </td>
                        {/* Published */}
                        <td className="py-3.5 px-3 hidden lg:table-cell">
                          <p className="text-neutral-400 text-xs font-montserrat">{formatDate(n.publishDate || n.createdAt)}</p>
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-3 hidden sm:table-cell">
                          <div className="flex flex-col gap-1.5">
                            <div className="inline-flex rounded-lg overflow-hidden border border-white/10">
                              <button
                                onClick={() => handleStatusToggle(n, 'draft')}
                                disabled={!!busyMap[n.id]}
                                title="Set to Draft"
                                className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                                  (n.status || 'draft') === 'draft'
                                    ? 'bg-yellow-500/25 text-yellow-300'
                                    : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                                }`}
                              >
                                Draft
                              </button>
                              <button
                                onClick={() => handleStatusToggle(n, 'published')}
                                disabled={!!busyMap[n.id]}
                                title="Set to Published"
                                className={`px-2.5 py-1 text-xs font-medium font-montserrat transition-all disabled:opacity-50 ${
                                  n.status === 'published'
                                    ? 'bg-emerald-500/25 text-emerald-300'
                                    : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                                }`}
                              >
                                Published
                              </button>
                            </div>
                            <button onClick={() => handleToggleFeatured(n)} title={n.featured ? 'Unfeature' : 'Feature'}
                              className={`w-10 h-5 rounded-full transition-all relative ${n.featured ? 'bg-yellow-500' : 'bg-white/10'}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${n.featured ? 'left-5' : 'left-0.5'}`} />
                            </button>
                            {n.featured && (
                              <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-montserrat">
                                <Icon name="SparklesIcon" size={10} /> Featured
                              </span>
                            )}
                          </div>
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
