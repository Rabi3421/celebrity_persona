"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CelebrityRow {
  id: string;
  name: string;
  slug: string;
  nationality?: string;
  occupation?: string[];
  profileImage?: string;
  status?: 'draft' | 'published' | 'archived';
  isActive: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  popularity?: number;
  createdAt?: string;
}

interface CelebrityFull extends CelebrityRow {
  born?: string;
  birthPlace?: string;
  died?: string;
  age?: number;
  citizenship?: string[];
  yearsActive?: string;
  height?: string;
  weight?: string;
  bodyMeasurements?: string;
  eyeColor?: string;
  hairColor?: string;
  spouse?: string;
  children?: string[];
  parents?: string[];
  siblings?: string[];
  relatives?: string[];
  education?: string[];
  netWorth?: string;
  introduction?: string;
  earlyLife?: string;
  career?: string;
  personalLife?: string;
  achievements?: string[];
  controversies?: string[];
  philanthropy?: string[];
  trivia?: string[];
  works?: string[];
  quotes?: string[];
  tags?: string[];
  categories?: string[];
  language?: string;
  coverImage?: string;
  galleryImages?: string[];
  contentQuality?: 'draft' | 'review' | 'published' | 'archived';
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
}

type FormTab = 'basic' | 'physical' | 'family' | 'bio' | 'social' | 'meta';
type Toast   = { type: 'success' | 'error'; message: string } | null;
type PanelMode = 'add' | 'edit' | null;

const EMPTY_FORM: CelebrityFull = {
  id: '', name: '', slug: '', born: '', birthPlace: '', died: '', age: undefined,
  nationality: '', citizenship: [], occupation: [], yearsActive: '', height: '',
  weight: '', bodyMeasurements: '', eyeColor: '', hairColor: '', spouse: '',
  children: [], parents: [], siblings: [], relatives: [], education: [],
  netWorth: '', introduction: '', earlyLife: '', career: '', personalLife: '',
  achievements: [], controversies: [], philanthropy: [], trivia: [], works: [],
  quotes: [], tags: [], categories: [], language: 'en', profileImage: '',
  coverImage: '', galleryImages: [],
  status: 'draft', contentQuality: 'draft', isActive: true, isFeatured: false, isVerified: false,
  socialMedia: { instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', website: '' },
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  draft:     'bg-neutral-500/20 text-neutral-400',
  archived:  'bg-red-500/20 text-red-400',
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',    label: 'Basic',    icon: 'IdentificationIcon' },
  { key: 'physical', label: 'Physical', icon: 'UserCircleIcon'     },
  { key: 'family',   label: 'Family',   icon: 'UsersIcon'          },
  { key: 'bio',      label: 'Biography',icon: 'DocumentTextIcon'   },
  { key: 'social',   label: 'Social',   icon: 'GlobeAltIcon'       },
  { key: 'meta',     label: 'Meta',     icon: 'TagIcon'            },
];

const PAGE_SIZES = [10, 20, 50];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toSlug = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const splitLines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const joinLines  = (arr?: string[]) => (arr || []).join('\n');

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LabeledInput({ label, value, onChange, placeholder, type = 'text', hint }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
      />
      {hint && <p className="text-neutral-600 text-xs mt-1 font-montserrat">{hint}</p>}
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, placeholder, rows = 4 }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
      />
    </div>
  );
}

function LabeledMultiline({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
      />
    </div>
  );
}

function ToggleField({ label, value, onChange }:
  { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2 px-3 rounded-xl hover:bg-white/5 transition-all">
      <span className="text-sm font-montserrat text-neutral-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${value ? 'bg-yellow-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CelebrityManagementSection() {
  const { authHeaders } = useAuth();

  // List state
  const [celebrities, setCelebrities] = useState<CelebrityRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [limit, setLimit]             = useState(20);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Row actions
  const [busyMap, setBusyMap]         = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<CelebrityRow | null>(null);
  const [toast, setToast]             = useState<Toast>(null);

  // Panel (add / edit inline)
  const [panelMode, setPanelMode]     = useState<PanelMode>(null);
  const [formTab, setFormTab]         = useState<FormTab>('basic');
  const [form, setForm]               = useState<CelebrityFull>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Partial<Record<keyof CelebrityFull, string>>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // ─── helpers ────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };
  const setBusy = (id: string, v: boolean) => setBusyMap((p) => ({ ...p, [id]: v }));
  const setField = <K extends keyof CelebrityFull>(k: K, v: CelebrityFull[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ─── fetch list ──────────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 1, lim = limit) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/superadmin/celebrities?${params}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setCelebrities(data.data);
      setTotal(data.total);
      setPage(p);
      setLimit(lim);
      setPages(data.pages);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load celebrities');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, searchQuery, statusFilter, limit]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  // ─── open add panel ──────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    setFormTab('basic');
    setPanelMode('add');
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ─── open edit panel ─────────────────────────────────────────────────────
  const openEdit = async (row: CelebrityRow) => {
    setFormErrors({});
    setFormApiError('');
    setFormTab('basic');
    setPanelMode('edit');
    setLoadingDetail(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res  = await fetch(`/api/superadmin/celebrities/${row.id}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load celebrity');
      const d: any = data.data;
      setForm({
        id:               d.id,
        name:             d.name             || '',
        slug:             d.slug             || '',
        born:             d.born             || '',
        birthPlace:       d.birthPlace       || '',
        died:             d.died             || '',
        age:              d.age,
        nationality:      d.nationality      || '',
        citizenship:      d.citizenship      || [],
        occupation:       d.occupation       || [],
        yearsActive:      d.yearsActive      || '',
        height:           d.height           || '',
        weight:           d.weight           || '',
        bodyMeasurements: d.bodyMeasurements || '',
        eyeColor:         d.eyeColor         || '',
        hairColor:        d.hairColor        || '',
        spouse:           d.spouse           || '',
        children:         d.children         || [],
        parents:          d.parents          || [],
        siblings:         d.siblings         || [],
        relatives:        d.relatives        || [],
        education:        d.education        || [],
        netWorth:         d.netWorth         || '',
        introduction:     d.introduction     || '',
        earlyLife:        d.earlyLife        || '',
        career:           d.career           || '',
        personalLife:     d.personalLife     || '',
        achievements:     d.achievements     || [],
        controversies:    d.controversies    || [],
        philanthropy:     d.philanthropy     || [],
        trivia:           d.trivia           || [],
        works:            d.works            || [],
        quotes:           d.quotes           || [],
        tags:             d.tags             || [],
        categories:       d.categories       || [],
        language:         d.language         || 'en',
        profileImage:     d.profileImage     || '',
        coverImage:       d.coverImage       || '',
        galleryImages:    d.galleryImages    || [],
        status:           d.status           || 'draft',
        contentQuality:   d.contentQuality   || 'draft',
        isActive:         d.isActive         ?? true,
        isFeatured:       d.isFeatured       ?? false,
        isVerified:       d.isVerified       ?? false,
        socialMedia: {
          instagram: d.socialMedia?.instagram || '',
          twitter:   d.socialMedia?.twitter   || '',
          facebook:  d.socialMedia?.facebook  || '',
          youtube:   d.socialMedia?.youtube   || '',
          tiktok:    d.socialMedia?.tiktok    || '',
          website:   d.socialMedia?.website   || '',
        },
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load celebrity details');
      setPanelMode(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePanel = () => { setPanelMode(null); };

  // ─── validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof CelebrityFull, string>> = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!form.slug || form.slug.trim().length < 2) errs.slug = 'Slug is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── build payload ────────────────────────────────────────────────────────
  const buildPayload = () => ({
    name:             form.name.trim(),
    slug:             form.slug.trim(),
    born:             form.born?.trim()             || '',
    birthPlace:       form.birthPlace?.trim()       || '',
    died:             form.died?.trim()             || '',
    age:              form.age || undefined,
    nationality:      form.nationality?.trim()      || '',
    citizenship:      form.citizenship              || [],
    occupation:       form.occupation               || [],
    yearsActive:      form.yearsActive?.trim()      || '',
    height:           form.height?.trim()           || '',
    weight:           form.weight?.trim()           || '',
    bodyMeasurements: form.bodyMeasurements?.trim() || '',
    eyeColor:         form.eyeColor?.trim()         || '',
    hairColor:        form.hairColor?.trim()        || '',
    spouse:           form.spouse?.trim()           || '',
    children:         form.children                 || [],
    parents:          form.parents                  || [],
    siblings:         form.siblings                 || [],
    relatives:        form.relatives                || [],
    education:        form.education                || [],
    netWorth:         form.netWorth?.trim()         || '',
    introduction:     form.introduction?.trim()     || '',
    earlyLife:        form.earlyLife?.trim()        || '',
    career:           form.career?.trim()           || '',
    personalLife:     form.personalLife?.trim()     || '',
    achievements:     form.achievements             || [],
    controversies:    form.controversies            || [],
    philanthropy:     form.philanthropy             || [],
    trivia:           form.trivia                   || [],
    works:            form.works                    || [],
    quotes:           form.quotes                   || [],
    tags:             form.tags                     || [],
    categories:       form.categories               || [],
    language:         form.language                 || 'en',
    profileImage:     form.profileImage?.trim()     || '',
    coverImage:       form.coverImage?.trim()       || '',
    galleryImages:    form.galleryImages            || [],
    status:           form.status,
    contentQuality:   form.contentQuality,
    isActive:         form.isActive,
    isFeatured:       form.isFeatured,
    isVerified:       form.isVerified,
    socialMedia:      form.socialMedia,
  });

  // ─── create ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true); setFormApiError('');
    try {
      const res  = await fetch('/api/superadmin/celebrities', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create');
      closePanel();
      showToast('success', `"${form.name.trim()}" created successfully`);
      fetchList(1);
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to create celebrity');
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
      const res  = await fetch(`/api/superadmin/celebrities/${form.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      closePanel();
      showToast('success', `"${form.name.trim()}" updated`);
      fetchList(page);
    } catch (err: any) {
      setFormApiError(err.message || 'Update failed');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (c: CelebrityRow) => {
    setConfirmDelete(null);
    setBusy(c.id, true);
    try {
      const res  = await fetch(`/api/superadmin/celebrities/${c.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setCelebrities((prev) => prev.filter((x) => x.id !== c.id));
      setTotal((t) => t - 1);
      showToast('success', `"${c.name}" deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    } finally {
      setBusy(c.id, false);
    }
  };

  // ─── quick toggle ────────────────────────────────────────────────────────
  const handleToggle = async (c: CelebrityRow, field: 'isActive' | 'isFeatured') => {
    setBusy(c.id, true);
    const newVal = !c[field];
    try {
      const res  = await fetch(`/api/superadmin/celebrities/${c.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setCelebrities((prev) => prev.map((x) => x.id === c.id ? { ...x, [field]: newVal } : x));
      showToast('success', `${c.name} ${field === 'isActive' ? (newVal ? 'activated' : 'deactivated') : (newVal ? 'featured' : 'unfeatured')}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(c.id, false);
    }
  };

  const skeletonRows = Array.from({ length: Math.min(limit, 8) });

  // ─────────────────────────────────────────────────────────────────────────
  // Form Tab Content
  // ─────────────────────────────────────────────────────────────────────────

  const renderFormTab = () => {
    switch (formTab) {
      // ── BASIC ──────────────────────────────────────────────────────────
      case 'basic': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setField('name', e.target.value); setField('slug', toSlug(e.target.value)); }}
              placeholder="e.g. Dwayne Johnson"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${formErrors.name ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60'}`}
            />
            {formErrors.name && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">URL Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setField('slug', toSlug(e.target.value))}
              placeholder="e.g. dwayne-johnson"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${formErrors.slug ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/60'}`}
            />
            {formErrors.slug && <p className="text-red-400 text-xs mt-1 font-montserrat">{formErrors.slug}</p>}
          </div>

          <LabeledInput label="Nationality"     value={form.nationality  || ''} onChange={(v) => setField('nationality', v)}  placeholder="e.g. American" />
          <LabeledInput label="Years Active"    value={form.yearsActive  || ''} onChange={(v) => setField('yearsActive', v)}  placeholder="e.g. 1999–present" />
          <LabeledInput label="Date of Birth"   value={form.born         || ''} onChange={(v) => setField('born', v)}         placeholder="e.g. 2 May 1972" />
          <LabeledInput label="Birth Place"     value={form.birthPlace   || ''} onChange={(v) => setField('birthPlace', v)}   placeholder="e.g. Hayward, California" />
          <LabeledInput label="Date of Death"   value={form.died         || ''} onChange={(v) => setField('died', v)}         placeholder="Leave blank if alive" />
          <LabeledInput label="Age"             value={String(form.age ?? '')}  onChange={(v) => setField('age', v ? Number(v) : undefined)} type="number" placeholder="e.g. 51" />
          <LabeledInput label="Net Worth"       value={form.netWorth     || ''} onChange={(v) => setField('netWorth', v)}     placeholder="e.g. $800M" />
          <LabeledInput label="Language Code"   value={form.language     || 'en'} onChange={(v) => setField('language', v)}  placeholder="en" />

          <div className="md:col-span-2">
            <LabeledMultiline
              label="Occupation (one per line)"
              value={joinLines(form.occupation)}
              onChange={(v) => setField('occupation', splitLines(v))}
              placeholder={"Actor\nProducer\nFilmmaker"}
            />
          </div>
          <div className="md:col-span-2">
            <LabeledMultiline
              label="Citizenship (one per line)"
              value={joinLines(form.citizenship)}
              onChange={(v) => setField('citizenship', splitLines(v))}
              placeholder="American"
            />
          </div>

          <LabeledInput label="Profile Image URL" value={form.profileImage || ''} onChange={(v) => setField('profileImage', v)} placeholder="https://..." type="url" />
          <LabeledInput label="Cover Image URL"   value={form.coverImage   || ''} onChange={(v) => setField('coverImage', v)}   placeholder="https://..." type="url" />

          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">Status & Quality</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-montserrat">Publish Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value as CelebrityFull['status'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-montserrat">Content Quality</label>
                <select
                  value={form.contentQuality}
                  onChange={(e) => setField('contentQuality', e.target.value as CelebrityFull['contentQuality'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-1">
            <ToggleField label="Active"   value={form.isActive}            onChange={(v) => setField('isActive', v)}   />
            <ToggleField label="Featured" value={form.isFeatured  ?? false} onChange={(v) => setField('isFeatured', v)} />
            <ToggleField label="Verified" value={form.isVerified  ?? false} onChange={(v) => setField('isVerified', v)} />
          </div>
        </div>
      );

      // ── PHYSICAL ───────────────────────────────────────────────────────
      case 'physical': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput label="Height"            value={form.height           || ''} onChange={(v) => setField('height', v)}           placeholder="e.g. 6 ft 5 in" />
          <LabeledInput label="Weight"            value={form.weight           || ''} onChange={(v) => setField('weight', v)}           placeholder="e.g. 118 kg" />
          <LabeledInput label="Body Measurements" value={form.bodyMeasurements || ''} onChange={(v) => setField('bodyMeasurements', v)} placeholder="e.g. 48-34-48" />
          <LabeledInput label="Eye Color"         value={form.eyeColor         || ''} onChange={(v) => setField('eyeColor', v)}         placeholder="e.g. Brown" />
          <LabeledInput label="Hair Color"        value={form.hairColor        || ''} onChange={(v) => setField('hairColor', v)}        placeholder="e.g. Black" />
        </div>
      );

      // ── FAMILY ────────────────────────────────────────────────────────
      case 'family': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <LabeledInput label="Spouse" value={form.spouse || ''} onChange={(v) => setField('spouse', v)} placeholder="e.g. Lauren Hashian" />
          </div>
          <LabeledMultiline label="Children (one per line)"  value={joinLines(form.children)}  onChange={(v) => setField('children',  splitLines(v))} placeholder="Simone Alexandra Johnson" />
          <LabeledMultiline label="Parents (one per line)"   value={joinLines(form.parents)}   onChange={(v) => setField('parents',   splitLines(v))} placeholder="Rocky Johnson" />
          <LabeledMultiline label="Siblings (one per line)"  value={joinLines(form.siblings)}  onChange={(v) => setField('siblings',  splitLines(v))} placeholder="Curtis Bowles" />
          <LabeledMultiline label="Relatives (one per line)" value={joinLines(form.relatives)} onChange={(v) => setField('relatives', splitLines(v))} placeholder="" />
          <div className="md:col-span-2">
            <LabeledMultiline label="Education (one per line)" value={joinLines(form.education)} onChange={(v) => setField('education', splitLines(v))} placeholder="University of Miami" />
          </div>
        </div>
      );

      // ── BIO ───────────────────────────────────────────────────────────
      case 'bio': return (
        <div className="space-y-4">
          <LabeledTextarea label="Introduction"  value={form.introduction || ''} onChange={(v) => setField('introduction', v)}  rows={4} placeholder="A brief introduction..." />
          <LabeledTextarea label="Early Life"    value={form.earlyLife    || ''} onChange={(v) => setField('earlyLife', v)}     rows={4} placeholder="Childhood and early years..." />
          <LabeledTextarea label="Career"        value={form.career       || ''} onChange={(v) => setField('career', v)}        rows={4} placeholder="Career highlights..." />
          <LabeledTextarea label="Personal Life" value={form.personalLife || ''} onChange={(v) => setField('personalLife', v)}  rows={4} placeholder="Personal life details..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledMultiline label="Achievements (one per line)"  value={joinLines(form.achievements)}  onChange={(v) => setField('achievements',  splitLines(v))} placeholder="Oscar Award..." />
            <LabeledMultiline label="Controversies (one per line)" value={joinLines(form.controversies)} onChange={(v) => setField('controversies', splitLines(v))} placeholder="" />
            <LabeledMultiline label="Philanthropy (one per line)"  value={joinLines(form.philanthropy)}  onChange={(v) => setField('philanthropy',  splitLines(v))} placeholder="Project Rock foundation..." />
            <LabeledMultiline label="Trivia (one per line)"        value={joinLines(form.trivia)}        onChange={(v) => setField('trivia',        splitLines(v))} placeholder="Fun facts..." />
            <LabeledMultiline label="Works (one per line)"         value={joinLines(form.works)}         onChange={(v) => setField('works',         splitLines(v))} placeholder="Movies, books, etc." />
            <LabeledMultiline label="Quotes (one per line)"        value={joinLines(form.quotes)}        onChange={(v) => setField('quotes',        splitLines(v))} placeholder="Famous quotes..." />
          </div>
        </div>
      );

      // ── SOCIAL ────────────────────────────────────────────────────────
      case 'social': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/...' },
            { key: 'twitter'   as const, label: 'Twitter/X', placeholder: 'https://twitter.com/...'  },
            { key: 'facebook'  as const, label: 'Facebook',  placeholder: 'https://facebook.com/...' },
            { key: 'youtube'   as const, label: 'YouTube',   placeholder: 'https://youtube.com/...'  },
            { key: 'tiktok'    as const, label: 'TikTok',    placeholder: 'https://tiktok.com/@...'  },
            { key: 'website'   as const, label: 'Website',   placeholder: 'https://example.com'      },
          ]).map(({ key, label, placeholder }) => (
            <LabeledInput
              key={key}
              label={label}
              value={form.socialMedia?.[key] || ''}
              onChange={(v) => setField('socialMedia', { ...form.socialMedia, [key]: v })}
              placeholder={placeholder}
              type="url"
            />
          ))}
        </div>
      );

      // ── META ──────────────────────────────────────────────────────────
      case 'meta': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledMultiline label="Tags (one per line)"        value={joinLines(form.tags)}       onChange={(v) => setField('tags',       splitLines(v))} placeholder="bollywood&#10;actor&#10;dramatic" />
          <LabeledMultiline label="Categories (one per line)"  value={joinLines(form.categories)} onChange={(v) => setField('categories', splitLines(v))} placeholder="Bollywood&#10;Entertainment" />
          <div className="md:col-span-2">
            <LabeledMultiline
              label="Gallery Images (one URL per line)"
              value={joinLines(form.galleryImages)}
              onChange={(v) => setField('galleryImages', splitLines(v))}
              placeholder="https://image1.jpg"
            />
          </div>
        </div>
      );

      default: return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination helper
  // ─────────────────────────────────────────────────────────────────────────

  const pageNumbers = (): (number | '...')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const arr: (number | '...')[] = [1];
    if (page > 3)         arr.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) arr.push(i);
    if (page < pages - 2) arr.push('...');
    arr.push(pages);
    return arr;
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

      {/* Stats — hidden while the Add form is open */}
      {panelMode !== 'add' && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: total,                                                      icon: 'StarIcon',         color: 'text-yellow-400'  },
          { label: 'Published', value: celebrities.filter((c) => c.status === 'published').length,  icon: 'CheckBadgeIcon',   color: 'text-emerald-400' },
          { label: 'Featured',  value: celebrities.filter((c) => c.isFeatured).length,              icon: 'SparklesIcon',     color: 'text-yellow-400'  },
          { label: 'Draft',     value: celebrities.filter((c) => c.status === 'draft').length,      icon: 'DocumentTextIcon', color: 'text-neutral-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <Icon name={s.icon as any} size={20} className={s.color} />
            <p className="font-playfair text-3xl font-bold text-white mt-3">
              {loading ? <span className="block h-8 w-10 rounded bg-white/10 animate-pulse" /> : s.value}
            </p>
            <p className="text-neutral-400 text-sm font-montserrat mt-1">{s.label}</p>
          </div>
        ))}
      </div>}

      {/* Controls */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, nationality..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={limit}
            onChange={(e) => fetchList(1, Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
          <button
            onClick={() => fetchList(page)}
            disabled={loading}
            title="Refresh"
            className="px-3 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <Icon name="ArrowPathIcon" size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {panelMode === 'add' ? (
            <button
              onClick={closePanel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 font-semibold font-montserrat text-sm hover:bg-white/20 transition-all"
            >
              <Icon name="ChevronLeftIcon" size={16} />
              Back to List
            </button>
          ) : (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all"
            >
              <Icon name="PlusIcon" size={16} />
              Add Celebrity
            </button>
          )}
        </div>
      </div>

      {/* Error — hidden while the Add form is open */}
      {panelMode !== 'add' && fetchError && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/20 bg-red-500/10 flex items-center gap-3">
          <Icon name="ExclamationCircleIcon" size={18} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm font-montserrat flex-1">{fetchError}</p>
          <button onClick={() => fetchList(1)} className="text-xs text-yellow-400 hover:underline font-montserrat">Retry</button>
        </div>
      )}

      {/* ── Inline Add / Edit Panel ── */}
      {panelMode && (
        <div ref={panelRef} className="glass-card rounded-2xl border border-yellow-500/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Icon name={panelMode === 'add' ? 'UserPlusIcon' : 'PencilSquareIcon'} size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-white">
                  {panelMode === 'add' ? 'Add New Celebrity' : `Editing — ${form.name || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat">
                  {panelMode === 'add' ? 'Fill in details across tabs — only Name and Slug are required' : 'Update celebrity profile details'}
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
              <span className="text-neutral-400 font-montserrat text-sm">Loading celebrity details...</span>
            </div>
          ) : (
            <form onSubmit={panelMode === 'add' ? handleCreate : handleUpdate}>
              {/* Tab bar */}
              <div className="flex gap-1 px-6 pt-5 pb-1 overflow-x-auto border-b border-white/10">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFormTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium font-montserrat whitespace-nowrap transition-all ${
                      formTab === t.key
                        ? 'bg-yellow-500 text-black'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon name={t.icon as any} size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-5 min-h-[360px]">
                {formApiError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-montserrat text-center">{formApiError}</p>
                  </div>
                )}
                {renderFormTab()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-white/2">
                <p className="text-neutral-600 text-xs font-montserrat">* Name and Slug are required</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {formLoading
                      ? (panelMode === 'add' ? 'Creating...' : 'Saving...')
                      : (panelMode === 'add' ? 'Create Celebrity' : 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table — hidden while the Add form is open */}
      {panelMode !== 'add' && <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-playfair text-xl font-bold text-white">Celebrity Profiles</h3>
          {!loading && (
            <span className="text-neutral-400 text-sm font-montserrat">
              {total > 0
                ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`
                : '0 results'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Celebrity', 'Nationality / Occupation', 'Status', 'Active', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletonRows.map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[180, 140, 80, 60, 60, 80].map((w, j) => (
                        <td key={j} className="py-3.5 px-3">
                          <div className="h-5 rounded-lg bg-white/10 animate-pulse" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : celebrities.map((c) => (
                    <tr key={c.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${busyMap[c.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {c.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.profileImage} alt={c.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold font-playfair text-sm shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium font-montserrat text-sm">{c.name}</p>
                            <p className="text-neutral-600 text-xs font-montserrat">{c.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-neutral-300 text-sm font-montserrat">{c.nationality || '—'}</p>
                        <p className="text-neutral-600 text-xs font-montserrat">{(c.occupation || []).slice(0, 2).join(', ') || '—'}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium font-montserrat capitalize ${STATUS_COLORS[c.status || 'draft']}`}>
                          {c.status || 'draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggle(c, 'isActive')}
                          title={c.isActive ? 'Deactivate' : 'Activate'}
                          className={`w-10 h-5 rounded-full transition-all relative ${c.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${c.isActive ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggle(c, 'isFeatured')}
                          title={c.isFeatured ? 'Unfeature' : 'Feature'}
                          className={`w-10 h-5 rounded-full transition-all relative ${c.isFeatured ? 'bg-yellow-400' : 'bg-white/10'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${c.isFeatured ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(c)}
                            title="Edit"
                            className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                          >
                            <Icon name="PencilSquareIcon" size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(c)}
                            title="Delete"
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <Icon name="TrashIcon" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

              {!loading && !fetchError && celebrities.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Icon name="StarIcon" size={40} className="mx-auto mb-3 text-neutral-700" />
                    <p className="text-neutral-500 font-montserrat text-sm">No celebrities found</p>
                    <button onClick={openAdd} className="mt-3 text-yellow-400 text-sm font-montserrat hover:underline">
                      + Add the first celebrity
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
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30" title="First">
                <Icon name="ChevronDoubleLeftIcon" size={14} />
              </button>
              <button onClick={() => fetchList(page - 1)} disabled={page <= 1 || loading}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30" title="Prev">
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
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30" title="Next">
                <Icon name="ChevronRightIcon" size={14} />
              </button>
              <button onClick={() => fetchList(pages)} disabled={page >= pages || loading}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30" title="Last">
                <Icon name="ChevronDoubleRightIcon" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-5 border border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Icon name="ExclamationTriangleIcon" size={26} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-white">Delete Celebrity</h3>
                <p className="text-neutral-400 text-sm font-montserrat mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-neutral-300 font-montserrat text-sm leading-relaxed">
              Permanently delete{' '}
              <span className="text-white font-semibold">"{confirmDelete.name}"</span>?
              All associated data will be removed.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-montserrat text-sm font-medium transition-all border border-red-500/20">
                Delete Celebrity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
