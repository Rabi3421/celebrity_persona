"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { buildNetWorthString, parseNetWorthString } from '@/lib/netWorth';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, deleteImage } from '@/lib/imageUpload';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CelebrityMovie {
  _id?: string;
  name: string;
  role: string;
  year: string;
  director: string;
  genre: string;
  description: string;
}

interface CelebrityAward {
  _id?: string;
  title: string;
  category: string;
  year: string;
  organization: string;
  work: string;
  description: string;
}

interface CelebrityRow {
  id: string;
  name: string;
  slug: string;
  nationality?: string;
  occupation?: string[];
  profileImage?: string;
  status?: 'draft' | 'published';
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
  yearsActiveFrom?: string;
  yearsActiveTo?: string;
  yearsActivePresent?: boolean;
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
  netWorthAmount?: string;
  netWorthUnit?: string;
  introduction?: string;
  earlyLife?: string;
  career?: string;
  personalLife?: string;
  achievements?: string[];
  controversies?: string[];
  achievementsHtml?: string;
  controversiesHtml?: string;
  philanthropy?: string[];
  trivia?: string[];
  works?: string[];
  movies?: CelebrityMovie[];
  awards?: CelebrityAward[];
  quotes?: string[];
  tags?: string[];
  categories?: string[];
  language?: string;
  coverImage?: string;
  galleryImages?: string[];
  // contentQuality removed — only status: draft | published is used
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    threads?: string;
    imdb?: string;
    wikipedia?: string;
    website?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    twitterCreator?: string;
    schemaType?: string;
    breadcrumbTitle?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    articleSection?: string;
    readingTime?: string;
  };
  marriages?: { name?: string; marriedYear?: string; divorcedYear?: string; currentlyMarried?: boolean }[];
}

type FormTab = 'basic' | 'biography' | 'social' | 'movies' | 'awards' | 'meta' | 'images';
type Toast   = { type: 'success' | 'error'; message: string } | null;
type PanelMode = 'add' | 'edit' | null;

const EMPTY_FORM: CelebrityFull = {
  id: '', name: '', slug: '', born: '', birthPlace: '', died: '', age: undefined,
  nationality: '', citizenship: [], occupation: [], yearsActive: '', yearsActiveFrom: '', yearsActiveTo: '', yearsActivePresent: false, height: '',
  weight: '', bodyMeasurements: '', eyeColor: '', hairColor: '', spouse: '',
  children: [], parents: [], siblings: [], relatives: [], education: [],
  netWorth: '', introduction: '', earlyLife: '', career: '', personalLife: '',
  netWorthAmount: '', netWorthUnit: 'USD',
  achievements: [], controversies: [], achievementsHtml: '', controversiesHtml: '',
  philanthropy: [], trivia: [], works: [], movies: [], awards: [],
  marriages: [],
  quotes: [], tags: [], categories: [], language: 'en', profileImage: '',
  coverImage: '', galleryImages: [],
  status: 'draft', isFeatured: false, isVerified: false,
  socialMedia: { instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', threads: '', imdb: '', wikipedia: '', website: '' },
  seo: {
    metaTitle: '', metaDescription: '', focusKeyword: '', keywords: [],
    canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '',
    twitterCard: 'summary_large_image', twitterCreator: '',
    schemaType: 'Person', breadcrumbTitle: '',
    robotsIndex: true, robotsFollow: true,
    articleSection: '', readingTime: '',
  },
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  draft:     'bg-yellow-500/20 text-yellow-400',
};

const TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic',      label: 'Basic',     icon: 'IdentificationIcon' },
  { key: 'social',     label: 'Social',    icon: 'GlobeAltIcon'       },
  { key: 'biography',  label: 'Biography', icon: 'BookOpenIcon'       },
  { key: 'images',     label: 'Images',    icon: 'PhotoIcon'          },
  { key: 'movies',     label: 'Movies',    icon: 'FilmIcon'           },
  { key: 'awards',     label: 'Awards',    icon: 'TrophyIcon'         },
  { key: 'meta',       label: 'Meta',      icon: 'TagIcon'            },
];

const PAGE_SIZES = [10, 20, 50];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toSlug = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const splitLines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const joinLines  = (arr?: string[]) => (arr || []).join('\n');
const splitComma = (v: string) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const joinComma  = (arr?: string[]) => (arr || []).join(', ');

const formatForDisplay = (d?: string) => {
  if (!d) return '';
  // if iso date like YYYY-MM-DD, show only year for compactness
  const m = d.match(/^(\d{4})-\d{2}-\d{2}/);
  if (m) return m[1];
  return d;
};

const computeYearsActive = (from?: string, to?: string, present?: boolean) => {
  if (!from) return '';
  const f = formatForDisplay(from);
  if (present) return `${f}–present`;
  if (to) return `${f}–${formatForDisplay(to)}`;
  return f;
};

const computeAge = (born?: string) => {
  if (!born) return undefined;
  const dt = new Date(born);
  if (isNaN(dt.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - dt.getFullYear();
  const m = today.getMonth() - dt.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dt.getDate())) age--;
  return age >= 0 ? age : undefined;
};

const computeNetWorthString = buildNetWorthString;
const parseNetWorth = parseNetWorthString;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LabeledInput({ label, value, onChange, placeholder, type = 'text', hint }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
      />
      {hint && <p className="text-neutral-600 text-xs mt-1 font-montserrat">{hint}</p>}
    </div>
  );
}

function HeightInput({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [unit, setUnit] = useState<'cm'|'in'|'ft'>('cm');
  const [cm, setCm] = useState('');
  const [inch, setInch] = useState('');
  const [feet, setFeet] = useState('');

  useEffect(() => {
    const v = (value || '').trim();
    if (!v) { setUnit('cm'); setCm(''); setFeet(''); setInch(''); return; }
    const mCm = v.match(/(\d+(?:\.\d+)?)\s*cm/i);
    const mFt = v.match(/(\d+)\s*ft(?:\s*(\d+)\s*in)?/i);
    const mIn = v.match(/(\d+(?:\.\d+)?)\s*in(?:ches)?/i);
    if (mCm) { setUnit('cm'); setCm(mCm[1]); setFeet(''); setInch(''); return; }
    if (mFt) { setUnit('ft'); setFeet(mFt[1] || ''); setInch(mFt[2] || ''); setCm(''); return; }
    if (mIn) { setUnit('in'); setInch(mIn[1]); setFeet(''); setCm(''); return; }
    // fallback: try numeric as cm
    const num = (v.match(/\d+(?:\.\d+)?/) || [''])[0];
    setUnit('cm'); setCm(num || ''); setFeet(''); setInch('');
  }, [value]);

  useEffect(() => {
    let out = '';
    if (unit === 'cm') { if (cm) out = `${cm} cm`; }
    else if (unit === 'in') { if (inch) out = `${inch} in`; }
    else { const f = feet || ''; const i = inch || ''; out = `${f}${f && i ? ' ft ' : f ? ' ft' : ''}${i ? ` ${i} in` : ''}`.trim(); }
    onChange(out);
  }, [unit, cm, feet, inch]);

  const inputClass = "w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all";

  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none font-montserrat text-sm">
          <option value="cm" style={{ color: '#111' }}>cm</option>
          <option value="in" style={{ color: '#111' }}>in</option>
          <option value="ft" style={{ color: '#111' }}>ft + in</option>
        </select>
        {unit === 'ft' ? (
          <>
            <input type="number" value={feet} onChange={(e) => setFeet(e.target.value.replace(/[^0-9]/g, ''))} placeholder="ft" className={`${inputClass} col-span-1`} />
            <input type="number" value={inch} onChange={(e) => setInch(e.target.value.replace(/[^0-9]/g, ''))} placeholder="in" className={`${inputClass} col-span-1`} />
          </>
        ) : (
          <input type="text" value={unit === 'cm' ? cm : inch} onChange={(e) => unit === 'cm' ? setCm(e.target.value.replace(/[^0-9.]/g, '')) : setInch(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={placeholder} className={`${inputClass} sm:col-span-2`} />
        )}
      </div>
    </div>
  );
}

function WeightInput({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [unit, setUnit] = useState<'kg'|'lb'>('kg');
  const [val, setVal] = useState('');

  useEffect(() => {
    const v = (value || '').trim();
    if (!v) { setUnit('kg'); setVal(''); return; }
    const mKg = v.match(/(\d+(?:\.\d+)?)\s*kg/i);
    const mLb = v.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/i);
    if (mKg) { setUnit('kg'); setVal(mKg[1]); return; }
    if (mLb) { setUnit('lb'); setVal(mLb[1]); return; }
    const num = (v.match(/\d+(?:\.\d+)?/) || [''])[0]; setUnit('kg'); setVal(num || '');
  }, [value]);

  useEffect(() => { onChange(val ? `${val} ${unit}` : ''); }, [unit, val]);

  const inputClass = "w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all";

  return (
    <div className="min-w-0 mt-4">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none font-montserrat text-sm">
          <option value="kg" style={{ color: '#111' }}>kg</option>
          <option value="lb" style={{ color: '#111' }}>lb</option>
        </select>
        <input type="text" value={val} onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={placeholder} className={`${inputClass} sm:col-span-2`} />
      </div>
    </div>
  );
}

function BodyMeasurementsInput({ label, value, onChange }:
  { label: string; value: string; onChange: (v: string) => void }) {
  const [gender, setGender] = useState<'Boy'|'Girl'>('Boy');
  const [unit, setUnit] = useState<'cm'|'in'>('cm');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [bust, setBust] = useState('');

  // Parse stored value back into fields on load/edit
  useEffect(() => {
    const v = (value || '').trim();
    if (!v) { setGender('Boy'); setUnit('cm'); setChest(''); setWaist(''); setHips(''); setBust(''); return; }
    // detect unit
    setUnit(/\bin\b|inches/i.test(v) ? 'in' : 'cm');
    if (/girl|female|bust/i.test(v)) {
      setGender('Girl');
      const mBust  = v.match(/bust[:\s]*(\d+(?:\.\d+)?)/i);
      const mWaist = v.match(/waist[:\s]*(\d+(?:\.\d+)?)/i);
      const mHips  = v.match(/hips[:\s]*(\d+(?:\.\d+)?)/i);
      setBust(mBust?.[1] || ''); setWaist(mWaist?.[1] || ''); setHips(mHips?.[1] || '');
      setChest('');
    } else {
      setGender('Boy');
      const mChest = v.match(/chest[:\s]*(\d+(?:\.\d+)?)/i);
      const mWaist = v.match(/waist[:\s]*(\d+(?:\.\d+)?)/i);
      const mHips  = v.match(/hips[:\s]*(\d+(?:\.\d+)?)/i);
      setChest(mChest?.[1] || ''); setWaist(mWaist?.[1] || ''); setHips(mHips?.[1] || '');
      setBust('');
    }
  }, [value]);

  // Build stored string whenever any field changes
  useEffect(() => {
    const u = unit === 'cm' ? 'cm' : 'in';
    let out = '';
    if (gender === 'Boy') {
      const parts: string[] = [];
      if (chest) parts.push(`Chest:${chest}${u}`);
      if (waist) parts.push(`Waist:${waist}${u}`);
      if (hips)  parts.push(`Hips:${hips}${u}`);
      out = parts.join(', ');
    } else {
      const parts: string[] = [];
      if (bust)  parts.push(`Bust:${bust}${u}`);
      if (waist) parts.push(`Waist:${waist}${u}`);
      if (hips)  parts.push(`Hips:${hips}${u}`);
      out = parts.join(', ');
    }
    const prefix = gender === 'Boy' ? 'BoyMeasurements' : 'GirlMeasurements';
    onChange(out ? `${prefix}| ${out}` : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, unit, chest, waist, hips, bust]);

  const selectClass = "w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer transition-all";
  const inputClass  = "w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all";
  const unitLabel   = unit === 'cm' ? 'cm' : 'in';

  return (
    <div className="min-w-0 mt-4">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>

      {/* Controls row: Gender + Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center mb-2">
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as 'Boy'|'Girl')}
          className={`${selectClass} sm:col-span-2`}
        >
          <option value="Boy"  style={{ background: '#1c1033', color: '#fff' }}>Boy</option>
          <option value="Girl" style={{ background: '#1c1033', color: '#fff' }}>Girl</option>
        </select>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as 'cm'|'in')}
          className={`${selectClass} w-full`}
        >
          <option value="cm" style={{ background: '#1c1033', color: '#fff' }}>cm</option>
          <option value="in" style={{ background: '#1c1033', color: '#fff' }}>inches (in)</option>
        </select>
      </div>

      {/* Measurement fields */}
      {gender === 'Boy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <input className={inputClass} placeholder={`Chest (${unitLabel})`} value={chest} onChange={(e) => setChest(e.target.value.replace(/[^0-9.]/g, ''))} />
          <input className={inputClass} placeholder={`Waist (${unitLabel})`} value={waist} onChange={(e) => setWaist(e.target.value.replace(/[^0-9.]/g, ''))} />
          <input className={inputClass} placeholder={`Hips (${unitLabel})`}  value={hips}  onChange={(e) => setHips(e.target.value.replace(/[^0-9.]/g, ''))} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <input className={inputClass} placeholder={`Bust (${unitLabel})`}  value={bust}  onChange={(e) => setBust(e.target.value.replace(/[^0-9.]/g, ''))} />
          <input className={inputClass} placeholder={`Waist (${unitLabel})`} value={waist} onChange={(e) => setWaist(e.target.value.replace(/[^0-9.]/g, ''))} />
          <input className={inputClass} placeholder={`Hips (${unitLabel})`}  value={hips}  onChange={(e) => setHips(e.target.value.replace(/[^0-9.]/g, ''))} />
        </div>
      )}
    </div>
  );
}


function LabeledTextarea({ label, value, onChange, placeholder, rows = 4 }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
      />
    </div>
  );
}

function LabeledMultiline({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all resize-none"
      />
    </div>
  );
}

type MarriageEntry = { name?: string; marriedYear?: string; divorcedYear?: string; currentlyMarried?: boolean };

function MarriagesInput({ label, value, onChange }:
  { label: string; value: MarriageEntry[]; onChange: (v: MarriageEntry[]) => void }) {
  const inputClass = "w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  const [local, setLocal] = useState<MarriageEntry[]>(value || []);

  useEffect(() => { setLocal(value || []); }, [value]);

  const propagate = (arr: MarriageEntry[]) => { setLocal(arr); onChange(arr); };

  const update = (idx: number, patch: Partial<MarriageEntry>) => {
    const copy = local.map((m) => ({ ...m }));
    copy[idx] = { ...copy[idx], ...patch };
    propagate(copy);
  };

  const add = () => propagate([...local, { name: '', marriedYear: '', divorcedYear: '', currentlyMarried: false }]);
  const remove = (idx: number) => propagate(local.filter((_, i) => i !== idx));

  const lastIdx = local.length - 1;

  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">{label}</label>
      <div className="space-y-3">
        {local.map((m, idx) => {
          const isLast = idx === lastIdx;
          const isCurrent = isLast && !!m.currentlyMarried;
          return (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              {/* Row: name + years */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                <input
                  value={m.name || ''}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Spouse name"
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  value={m.marriedYear || ''}
                  onChange={(e) => update(idx, { marriedYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="Married (year)"
                  className={`${inputClass} sm:col-span-1`}
                  inputMode="numeric"
                />
                <input
                  value={m.divorcedYear || ''}
                  onChange={(e) => update(idx, { divorcedYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="Divorced (year)"
                  className={`${inputClass} sm:col-span-1`}
                  inputMode="numeric"
                  disabled={isCurrent}
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-xs text-red-400 hover:text-red-300 text-left sm:text-center"
                >
                  Remove
                </button>
              </div>
              {/* "Married till now" checkbox — only on last entry */}
              {isLast && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      update(idx, { currentlyMarried: checked, divorcedYear: checked ? '' : m.divorcedYear });
                    }}
                    className="w-4 h-4 accent-yellow-400 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-300 font-montserrat">Married till now</span>
                </label>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
        >
          + Add marriage
        </button>
      </div>
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
  const [draftLoading, setDraftLoading] = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Image upload state
  type UploadSlot = { uploading: boolean; progress: number; error: string };
  const emptySlot = (): UploadSlot => ({ uploading: false, progress: 0, error: '' });
  const [profileUpload, setProfileUpload] = useState<UploadSlot>(emptySlot());
  const [coverUpload,   setCoverUpload]   = useState<UploadSlot>(emptySlot());
  const [galleryUploads, setGalleryUploads] = useState<Record<number, UploadSlot>>({});

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef   = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      // parse yearsActive into from/to/present if possible
      let yFrom = '' as string;
      let yTo = '' as string;
      let yPresent = false;
      if (d.yearsActive) {
        const ya: string = String(d.yearsActive);
        if (ya.toLowerCase().includes('present')) {
          yPresent = true;
          const parts = ya.split(/–|-/);
          yFrom = (parts[0] || '').trim();
        } else if (ya.includes('–') || ya.includes('-')) {
          const parts = ya.split(/–|-/);
          yFrom = (parts[0] || '').trim();
          yTo   = (parts[1] || '').trim();
        } else {
          yFrom = ya.trim();
        }
      }
      setForm({
        id:               d.id,
        name:             d.name             || '',
        slug:             d.slug             || '',
        born:             (function(){
                            const raw = d.born || '';
                            if (!raw) return '';
                            const dt = new Date(raw);
                            if (!isNaN(dt.getTime())) {
                              const yyyy = dt.getFullYear();
                              const mm = String(dt.getMonth() + 1).padStart(2, '0');
                              const dd = String(dt.getDate()).padStart(2, '0');
                              return `${yyyy}-${mm}-${dd}`;
                            }
                            return raw;
                          })(),
        birthPlace:       d.birthPlace       || '',
        died:             d.died             || '',
        age:              d.age ?? computeAge(d.born),
        nationality:      d.nationality      || '',
        citizenship:      d.citizenship      || [],
        occupation:       d.occupation       || [],
        yearsActive:      d.yearsActive      || '',
        yearsActiveFrom:  yFrom,
        yearsActiveTo:    yTo,
        yearsActivePresent: yPresent,
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
        netWorthAmount:   (function(){ const p = parseNetWorth(d.netWorth || ''); return p.amount; })(),
        netWorthUnit:     (function(){ const p = parseNetWorth(d.netWorth || ''); return p.unit; })(),
        introduction:     d.introduction     || '',
        earlyLife:        d.earlyLife        || '',
        career:           d.career           || '',
        personalLife:     d.personalLife     || '',
        achievements:     d.achievements     || [],
        controversies:    d.controversies    || [],
        // Stored as HTML in achievements[0] / controversies[0]
        achievementsHtml:  (d.achievements  || [])[0] || '',
        controversiesHtml: (d.controversies || [])[0] || '',
        philanthropy:     d.philanthropy     || [],
        trivia:           d.trivia           || [],
        works:            d.works            || [],
        movies:           d.movies           || [],
        quotes:           d.quotes           || [],
        tags:             d.tags             || [],
        categories:       d.categories       || [],
        language:         d.language         || 'en',
        profileImage:     d.profileImage     || '',
        coverImage:       d.coverImage       || '',
        galleryImages:    d.galleryImages    || [],
        status:           (d.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
        isFeatured:       d.isFeatured       ?? false,
        isVerified:       d.isVerified       ?? false,
        awards:    d.awards    || [],
        marriages: (d.marriages || []).map((m: any) => ({
          name:             m.name             || '',
          marriedYear:      m.marriedYear      || '',
          divorcedYear:     m.divorcedYear     || '',
          currentlyMarried: m.currentlyMarried ?? false,
        })),
        socialMedia: {
          instagram: d.socialMedia?.instagram || '',
          twitter:   d.socialMedia?.twitter   || '',
          facebook:  d.socialMedia?.facebook  || '',
          youtube:   d.socialMedia?.youtube   || '',
          tiktok:    d.socialMedia?.tiktok    || '',
          threads:   d.socialMedia?.threads   || '',
          imdb:      d.socialMedia?.imdb      || '',
          wikipedia: d.socialMedia?.wikipedia || '',
          website:   d.socialMedia?.website   || '',
        },
        seo: {
          metaTitle:       d.seo?.metaTitle       || '',
          metaDescription: d.seo?.metaDescription || '',
          focusKeyword:    d.seo?.focusKeyword    || '',
          keywords:        d.seo?.metaKeywords    || [],          // DB: metaKeywords
          canonicalUrl:    d.seo?.canonicalUrl    || '',
          ogTitle:         d.seo?.ogTitle         || '',
          ogDescription:   d.seo?.ogDescription   || '',
          ogImage:         (d.seo?.ogImages || [])[0] || '',      // DB: ogImages[]
          twitterCard:     d.seo?.twitterCard     || 'summary_large_image',
          twitterCreator:  d.seo?.twitterCreator  || '',
          schemaType:      d.seo?.schemaType      || 'Person',
          breadcrumbTitle: '',
          robotsIndex:     !(d.seo?.noindex  ?? false),          // DB: noindex (inverted)
          robotsFollow:    !(d.seo?.nofollow ?? false),          // DB: nofollow (inverted)
          articleSection:  d.seo?.section         || '',          // DB: section
          readingTime:     '',
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

  // ─── validate (full — requires name + slug) ──────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof CelebrityFull, string>> = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!form.slug || form.slug.trim().length < 2) errs.slug = 'Slug is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── validate draft (only name + slug required) ───────────────────────────
  const validateDraft = () => {
    const errs: Partial<Record<keyof CelebrityFull, string>> = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required to save as draft';
    if (!form.slug || form.slug.trim().length < 2) errs.slug = 'Slug is required to save as draft';
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
    // Store the rich-text HTML as the first (and only) element of the array
    achievements:     form.achievementsHtml  ? [form.achievementsHtml]  : (form.achievements  || []),
    controversies:    form.controversiesHtml ? [form.controversiesHtml] : (form.controversies || []),
    philanthropy:     form.philanthropy             || [],
    trivia:           form.trivia                   || [],
    works:            form.works                    || [],
    movies:           form.movies                   || [],
    awards:           form.awards                   || [],
    marriages:        (form.marriages || []).map((m) => ({
                        name:             m.name             || '',
                        marriedYear:      m.marriedYear      || '',
                        divorcedYear:     m.currentlyMarried ? '' : (m.divorcedYear || ''),
                        currentlyMarried: m.currentlyMarried ?? false,
                      })),
    quotes:           form.quotes                   || [],
    tags:             form.tags                     || [],
    categories:       form.categories               || [],
    language:         form.language                 || 'en',
    profileImage:     form.profileImage?.trim()     || '',
    coverImage:       form.coverImage?.trim()       || '',
    galleryImages:    form.galleryImages            || [],
    status:           form.status,
    isFeatured:       form.isFeatured,
    isVerified:       form.isVerified,
    socialMedia:      form.socialMedia,
    // Map form-friendly SEO keys → DB schema keys
    seo: {
      metaTitle:       form.seo?.metaTitle       || '',
      metaDescription: form.seo?.metaDescription || '',
      focusKeyword:    form.seo?.focusKeyword    || '',
      metaKeywords:    form.seo?.keywords        || [],          // form: keywords → DB: metaKeywords
      canonicalUrl:    form.seo?.canonicalUrl    || '',
      ogTitle:         form.seo?.ogTitle         || '',
      ogDescription:   form.seo?.ogDescription   || '',
      ogImages:        form.seo?.ogImage ? [form.seo.ogImage] : [],  // form: ogImage → DB: ogImages[]
      twitterCard:     form.seo?.twitterCard     || 'summary_large_image',
      twitterCreator:  form.seo?.twitterCreator  || '',
      schemaType:      form.seo?.schemaType      || 'Person',
      noindex:         !(form.seo?.robotsIndex  ?? true),        // form: robotsIndex → DB: noindex (inverted)
      nofollow:        !(form.seo?.robotsFollow ?? true),        // form: robotsFollow → DB: nofollow (inverted)
      section:         form.seo?.articleSection  || '',          // form: articleSection → DB: section
    },
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

  // ─── save as draft ─────────────────────────────────────────────────────
  // Works for both add (creates new) and edit (updates existing).
  // Only name + slug are required. All other fields can be partially filled.
  const handleSaveDraft = async () => {
    if (!validateDraft()) return;
    setDraftLoading(true); setFormApiError('');
    const payload = { ...buildPayload(), status: 'draft' as const };
    try {
      let res: Response;
      if (panelMode === 'edit' && form.id) {
        res = await fetch(`/api/superadmin/celebrities/${form.id}`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/superadmin/celebrities', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save draft');
      // If we just created a new draft, switch the panel to edit mode so
      // subsequent "Save as Draft" calls update the same record.
      if (panelMode === 'add' && data.data?.id) {
        setForm((f) => ({ ...f, id: data.data.id, status: 'draft' }));
        setPanelMode('edit');
      }
      showToast('success', `Draft saved — "${form.name.trim()}"`);
      fetchList(page === 1 ? 1 : page);
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to save draft');
    } finally {
      setDraftLoading(false);
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
  const handleToggle = async (c: CelebrityRow, field: 'isFeatured') => {
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
      showToast('success', `${c.name} ${newVal ? 'featured' : 'unfeatured'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    } finally {
      setBusy(c.id, false);
    }
  };

  // ─── image upload helpers ────────────────────────────────────────────────
  const celebFolder = () =>
    (form.slug || form.name || 'celebrity').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'celebrity';

  const handleProfileUpload = async (file: File) => {
    setProfileUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `celebrities/${celebFolder()}/profile`);
      setField('profileImage', url);
      setProfileUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setProfileUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUpload({ uploading: true, progress: 10, error: '' });
    try {
      const url = await uploadImage(file, `celebrities/${celebFolder()}/cover`);
      setField('coverImage', url);
      setCoverUpload({ uploading: false, progress: 100, error: '' });
    } catch (e: any) {
      setCoverUpload({ uploading: false, progress: 0, error: e.message || 'Upload failed' });
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    const arr = Array.from(files);
    const startIdx = (form.galleryImages || []).length;
    for (let i = 0; i < arr.length; i++) {
      const idx = startIdx + i;
      setGalleryUploads((p) => ({ ...p, [idx]: { uploading: true, progress: 10, error: '' } }));
      try {
        const url = await uploadImage(arr[i], `celebrities/${celebFolder()}/gallery`);
        setField('galleryImages', [...(form.galleryImages || []), url]);
        setGalleryUploads((p) => ({ ...p, [idx]: { uploading: false, progress: 100, error: '' } }));
      } catch (e: any) {
        setGalleryUploads((p) => ({ ...p, [idx]: { uploading: false, progress: 0, error: e.message || 'Upload failed' } }));
      }
    }
  };

  const removeGalleryImage = async (idx: number) => {
    const url = (form.galleryImages || [])[idx];
    if (url) { try { await deleteImage(url); } catch {} }
    setField('galleryImages', (form.galleryImages || []).filter((_, i) => i !== idx));
  };

  const removeProfileImage = async () => {
    if (form.profileImage) { try { await deleteImage(form.profileImage); } catch {} }
    setField('profileImage', '');
  };

  const removeCoverImage = async () => {
    if (form.coverImage) { try { await deleteImage(form.coverImage); } catch {} }
    setField('coverImage', '');
  };

  const skeletonRows = Array.from({ length: Math.min(limit, 8) });

  // ─────────────────────────────────────────────────────────────────────────
  // Form Tab Content
  // ─────────────────────────────────────────────────────────────────────────

  const renderFormTab = () => {
    switch (formTab) {
      // ── BASIC ──────────────────────────────────────────────────────────
      case 'basic': return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 [&>*]:min-w-0">
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
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Years Active</label>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">From</label>
                <select
                  value={form.yearsActiveFrom || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setField('yearsActiveFrom', v);
                    setField('yearsActive', computeYearsActive(v, form.yearsActiveTo, form.yearsActivePresent));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-neutral-900 text-neutral-400">Select year</option>
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                    <option key={yr} value={String(yr)} className="bg-neutral-900">{yr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">To</label>
                <select
                  value={form.yearsActiveTo || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setField('yearsActiveTo', v);
                    setField('yearsActive', computeYearsActive(form.yearsActiveFrom, v, form.yearsActivePresent));
                  }}
                  disabled={form.yearsActivePresent}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-neutral-900 text-neutral-400">Select year</option>
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                    <option key={yr} value={String(yr)} className="bg-neutral-900">{yr}</option>
                  ))}
                </select>
              </div>
              <div className="pt-1">
                <ToggleField
                  label="Present"
                  value={form.yearsActivePresent ?? false}
                  onChange={(v) => {
                    setField('yearsActivePresent', v);
                    if (v) {
                      setField('yearsActiveTo', '');
                      setField('yearsActive', computeYearsActive(form.yearsActiveFrom, '', true));
                    } else {
                      setField('yearsActive', computeYearsActive(form.yearsActiveFrom, form.yearsActiveTo, false));
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Date of Birth</label>
            <input
              type="date"
              value={form.born || ''}
              onChange={(e) => {
                const v = e.target.value;
                setField('born', v);
                const a = computeAge(v);
                setField('age', a === undefined ? undefined : a);
              }}
              placeholder="e.g. 2 May 1972"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
            />
          </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Age</label>
              <input
                type="number"
                value={form.age ?? ''}
                readOnly
                disabled
                placeholder="e.g. 51"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 font-montserrat text-sm transition-all disabled:opacity-60"
              />
            </div>

          <LabeledInput label="Date of Death"   value={form.died         || ''} onChange={(v) => setField('died', v)}         placeholder="Leave blank if alive" />
          <LabeledInput label="Birth Place"     value={form.birthPlace   || ''} onChange={(v) => setField('birthPlace', v)}   placeholder="e.g. Hayward, California" />
          <div>
            <HeightInput label="Height" value={form.height || ''} onChange={(v) => setField('height', v)} placeholder="e.g. 6 ft 5 in" />
            <WeightInput label="Weight" value={form.weight || ''} onChange={(v) => setField('weight', v)} placeholder="e.g. 118 kg" />
            <BodyMeasurementsInput label="Body Measurements" value={form.bodyMeasurements || ''} onChange={(v) => setField('bodyMeasurements', v)} />
          </div>

          <div className="xl:col-start-2 space-y-2 min-w-0">
            <LabeledInput label="Eye Color" value={form.eyeColor || ''} onChange={(v) => setField('eyeColor', v)} placeholder="e.g. Brown" />
            <LabeledInput label="Hair Color" value={form.hairColor || ''} onChange={(v) => setField('hairColor', v)} placeholder="e.g. Black" />

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Net Worth</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.netWorthAmount || ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '');
                    setField('netWorthAmount', v);
                    setField('netWorth', computeNetWorthString(v, form.netWorthUnit));
                  }}
                  placeholder="e.g. 800"
                  className="w-full min-w-0 box-border sm:col-span-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                />
                <select
                  value={form.netWorthUnit || 'USD'}
                  onChange={(e) => {
                    const v = e.target.value;
                    setField('netWorthUnit', v);
                    setField('netWorth', computeNetWorthString(form.netWorthAmount, v));
                  }}
                  className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all cursor-pointer"
                >
                  <option value="USD" style={{ background: '#2b1433', color: '#fff' }}>USD</option>
                  <option value="INR" style={{ background: '#2b1433', color: '#fff' }}>INR</option>
                  <option value="M" style={{ background: '#2b1433', color: '#fff' }}>Million (M)</option>
                  <option value="B" style={{ background: '#2b1433', color: '#fff' }}>Billion (B)</option>
                </select>
              </div>
              <p className="text-neutral-500 text-xs mt-2">Preview: <span className="text-white">{form.netWorth}</span></p>
            </div>
          </div>
          <div className="md:col-span-1">
            <LabeledInput
              label="Occupation (comma separated)"
              value={(form.occupation || []).join(', ')}
              onChange={(v) => setField('occupation', v.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder={"Actor, Producer, Filmmaker"}
            />
          </div>
          <div className="md:col-span-1">
            <LabeledInput
              label="Citizenship (comma separated)"
              value={(form.citizenship || []).join(', ')}
              onChange={(v) => setField('citizenship', v.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder={"American, Canadian"}
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-yellow-400/90 font-montserrat mb-1">Family</h3>
            <p className="text-xs text-neutral-500">Add family members and marriage timeline. You can add multiple marriages with married/divorced years.</p>
          </div>
          <div className="md:col-span-2">
            <MarriagesInput
              label="Marriages"
              value={(form.marriages || [])}
              onChange={(v) => { setField('marriages', v); setField('spouse', (v && v.length) ? (v[v.length-1].name || '') : ''); }}
            />
          </div>
          <LabeledInput label="Children (comma separated)"  value={joinComma(form.children)}  onChange={(v) => setField('children',  splitComma(v))} placeholder="Simone Alexandra Johnson, Ava Johnson" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LabeledInput
              label="Father"
              value={(form.parents && form.parents[0]) || ''}
              onChange={(v) => {
                const mother = (form.parents && form.parents[1]) || '';
                const arr = [v, mother].filter(Boolean);
                setField('parents', arr);
              }}
              placeholder="Father's name"
            />
            <LabeledInput
              label="Mother"
              value={(form.parents && form.parents[1]) || ''}
              onChange={(v) => {
                const father = (form.parents && form.parents[0]) || '';
                const arr = [father, v].filter(Boolean);
                setField('parents', arr);
              }}
              placeholder="Mother's name"
            />
          </div>
          <LabeledInput label="Siblings (comma separated)"  value={joinComma(form.siblings)}  onChange={(v) => setField('siblings',  splitComma(v))} placeholder="Curtis Bowles, John Doe" />
          <LabeledInput label="Relatives (comma separated)" value={joinComma(form.relatives)} onChange={(v) => setField('relatives', splitComma(v))} placeholder="Uncle Bob, Cousin Jane" />
          <div className="md:col-span-2">
            <LabeledInput label="Education (comma separated)" value={joinComma(form.education)} onChange={(v) => setField('education', splitComma(v))} placeholder="University of Miami, Harvard University" />
          </div>


        </div>
      );

      

      

      // ── INTRO ─────────────────────────────────────────────────────────
      // ── BIOGRAPHY (Intro · Early Life · Career · Personal · Achievements · Controversies) ──
      case 'biography': return (
        <div className="space-y-8">
          {/* Introduction */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Introduction</h3>
            <RichTextEditor label="" value={form.introduction || ''} onChange={(v) => setField('introduction', v)} placeholder="A brief introduction about the celebrity…" minHeight={200} />
          </div>

          <div className="border-t border-white/8" />

          {/* Early Life */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Early Life</h3>
            <RichTextEditor label="" value={form.earlyLife || ''} onChange={(v) => setField('earlyLife', v)} placeholder="Childhood, family background, early years…" minHeight={200} />
          </div>

          <div className="border-t border-white/8" />

          {/* Career */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Career</h3>
            <RichTextEditor label="" value={form.career || ''} onChange={(v) => setField('career', v)} placeholder="Career highlights, milestones, achievements…" minHeight={200} />
          </div>

          <div className="border-t border-white/8" />

          {/* Personal Life */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Personal Life</h3>
            <RichTextEditor label="" value={form.personalLife || ''} onChange={(v) => setField('personalLife', v)} placeholder="Relationships, hobbies, personal interests…" minHeight={200} />
          </div>

          <div className="border-t border-white/8" />

          {/* Achievements */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Achievements</h3>
            <RichTextEditor label="" value={form.achievementsHtml || ''} onChange={(v) => setField('achievementsHtml', v)} placeholder="List awards, honors, milestones, records…" minHeight={200} />
          </div>

          <div className="border-t border-white/8" />

          {/* Controversies */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Controversies</h3>
            <RichTextEditor label="" value={form.controversiesHtml || ''} onChange={(v) => setField('controversiesHtml', v)} placeholder="Describe controversies, legal issues, public disputes…" minHeight={200} />
          </div>
        </div>
      );

      // philanthropy/trivia/works/quotes tabs removed

      // ── IMAGES ───────────────────────────────────────────────────────
      case 'images': {
        const gallery = form.galleryImages || [];

        // reusable drag-over state
        const DropZone = ({
          label, hint, accept = 'image/*', onFiles, uploading, progress, error, preview, onRemove, inputRef, tall = false,
        }: {
          label: string; hint: string; accept?: string;
          onFiles: (f: FileList) => void; uploading: boolean; progress: number; error: string;
          preview?: string; onRemove?: () => void; inputRef: React.RefObject<HTMLInputElement | null>; tall?: boolean;
        }) => (
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-2 font-montserrat uppercase tracking-wider">{label}</p>
            {preview ? (
              <div className={`relative group rounded-2xl overflow-hidden border border-white/10 ${tall ? 'h-44 w-full' : 'h-44 w-44'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500 text-black text-xs font-semibold font-montserrat hover:bg-yellow-400 transition-all">
                    <Icon name="ArrowUpTrayIcon" size={12} /> Replace
                  </button>
                  <button type="button" onClick={onRemove}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/80 text-white text-xs font-semibold font-montserrat hover:bg-red-500 transition-all">
                    <Icon name="TrashIcon" size={12} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()}
                className={`w-full ${tall ? 'h-44' : 'h-44 max-w-xs'} rounded-2xl border-2 border-dashed border-white/15 hover:border-yellow-500/40 bg-white/3 hover:bg-yellow-500/5 transition-all flex flex-col items-center justify-center gap-3 group`}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
                    <p className="text-yellow-400 text-xs font-montserrat">Uploading…</p>
                    <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-yellow-500/10 flex items-center justify-center transition-all border border-white/10 group-hover:border-yellow-500/30">
                      <Icon name="ArrowUpTrayIcon" size={20} className="text-neutral-500 group-hover:text-yellow-400 transition-all" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-300 font-montserrat font-medium group-hover:text-white transition-all">Click to upload</p>
                      <p className="text-xs text-neutral-600 font-montserrat mt-0.5">{hint}</p>
                    </div>
                  </>
                )}
              </button>
            )}
            {error && <p className="text-red-400 text-xs mt-1 font-montserrat">{error}</p>}
            {uploading && !preview && (
              <div className="mt-2 w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          </div>
        );

        return (
          <div className="space-y-8">
            {/* Notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/8 border border-yellow-500/20">
              <Icon name="PhotoIcon" size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 text-sm font-semibold font-montserrat">Firebase Storage</p>
                <p className="text-neutral-400 text-xs font-montserrat mt-0.5">
                  Images are stored at <code className="text-yellow-300/80 bg-yellow-400/10 px-1 rounded text-[10px]">celebrities/{celebFolder()}/</code> — set the celebrity&apos;s name or slug first to get the right folder.
                </p>
              </div>
            </div>

            {/* Profile + Cover side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Image */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <p className="text-sm font-semibold text-white font-montserrat">Profile Photo</p>
                  <span className="text-[10px] text-neutral-500 font-montserrat ml-auto">1:1 · Portrait</span>
                </div>
                <DropZone
                  label="" hint="JPG, PNG, WEBP · Max 5 MB"
                  onFiles={(f) => handleProfileUpload(f[0])}
                  uploading={profileUpload.uploading} progress={profileUpload.progress} error={profileUpload.error}
                  preview={form.profileImage || undefined} onRemove={removeProfileImage}
                  inputRef={profileInputRef}
                />
                {form.profileImage && (
                  <p className="text-[10px] text-neutral-600 font-montserrat break-all leading-relaxed">{form.profileImage}</p>
                )}
              </div>

              {/* Cover Image */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <p className="text-sm font-semibold text-white font-montserrat">Cover / Banner</p>
                  <span className="text-[10px] text-neutral-500 font-montserrat ml-auto">16:9 · Wide</span>
                </div>
                <DropZone
                  label="" hint="JPG, PNG, WEBP · Max 5 MB" tall
                  onFiles={(f) => handleCoverUpload(f[0])}
                  uploading={coverUpload.uploading} progress={coverUpload.progress} error={coverUpload.error}
                  preview={form.coverImage || undefined} onRemove={removeCoverImage}
                  inputRef={coverInputRef}
                />
                {form.coverImage && (
                  <p className="text-[10px] text-neutral-600 font-montserrat break-all leading-relaxed">{form.coverImage}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/8" />

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <p className="text-sm font-semibold text-white font-montserrat">Photo Gallery</p>
                  <span className="text-xs text-neutral-500 font-montserrat">({gallery.length} photos)</span>
                </div>
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 text-xs font-semibold font-montserrat transition-all">
                  <Icon name="PlusIcon" size={13} /> Add Photos
                </button>
              </div>

              {/* Gallery grid */}
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-square bg-white/3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                        <span className="text-[9px] text-white/70 font-montserrat bg-black/40 rounded-lg px-1.5 py-0.5">#{i + 1}</span>
                        <button type="button" onClick={() => removeGalleryImage(i)}
                          className="p-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-all">
                          <Icon name="TrashIcon" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* uploading placeholders */}
                  {Object.entries(galleryUploads)
                    .filter(([, s]) => s.uploading)
                    .map(([k]) => (
                      <div key={k} className="rounded-2xl border border-yellow-400/20 aspect-square bg-yellow-500/5 flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                        <p className="text-[10px] text-yellow-400 font-montserrat">Uploading…</p>
                      </div>
                    ))}
                  {/* add more card */}
                  <button type="button" onClick={() => galleryInputRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-white/10 hover:border-yellow-500/30 bg-white/3 hover:bg-yellow-500/5 aspect-square flex flex-col items-center justify-center gap-2 transition-all group">
                    <Icon name="PlusIcon" size={22} className="text-neutral-600 group-hover:text-yellow-400 transition-all" />
                    <span className="text-[10px] text-neutral-600 group-hover:text-neutral-400 font-montserrat transition-all">More</span>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-white/10 hover:border-yellow-500/30 bg-white/3 hover:bg-yellow-500/5 transition-all flex flex-col items-center justify-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-yellow-500/10 flex items-center justify-center transition-all border border-white/10 group-hover:border-yellow-500/30">
                    <Icon name="PhotoIcon" size={22} className="text-neutral-600 group-hover:text-yellow-400 transition-all" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-300 group-hover:text-white font-montserrat font-medium transition-all">Add gallery photos</p>
                    <p className="text-xs text-neutral-600 font-montserrat mt-0.5">Select multiple images at once</p>
                  </div>
                </button>
              )}
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && e.target.files.length > 0 && handleGalleryUpload(e.target.files)} />
            </div>
          </div>
        );
      }

      // ── MOVIES ────────────────────────────────────────────────────────
      case 'movies': {
        const movies = form.movies || [];
        const EMPTY_MOVIE: CelebrityMovie = { name: '', role: '', year: '', director: '', genre: '', description: '' };

        // Keep draft/edit state inside the main form object so it persists while editing.
        const draft: CelebrityMovie = (form as any).__movieDraft ?? { ...EMPTY_MOVIE };
        const editIndex = typeof (form as any).__movieEditIndex === 'number' ? (form as any).__movieEditIndex : null;
        const setDraft = (patch: Partial<CelebrityMovie>) =>
          setForm((f) => ({ ...f, __movieDraft: { ...((f as any).__movieDraft ?? EMPTY_MOVIE), ...patch } }));
        const clearDraft = () =>
          setForm((f) => {
            const next = { ...f };
            delete (next as any).__movieDraft;
            delete (next as any).__movieEditIndex;
            return next;
          });

        const commitMovie = () => {
          if (!draft.name.trim()) return;
          const nextMovie = {
            ...(editIndex !== null ? movies[editIndex] : {}),
            name: draft.name.trim(),
            role: draft.role.trim(),
            year: draft.year.trim(),
            director: draft.director.trim(),
            genre: draft.genre.trim(),
            description: draft.description.trim(),
          };
          setField(
            'movies',
            editIndex !== null
              ? movies.map((movie, index) => (index === editIndex ? nextMovie : movie))
              : [...movies, nextMovie]
          );
          clearDraft();
        };

        const editMovie = (i: number) =>
          setForm((f) => ({ ...f, __movieDraft: { ...movies[i] }, __movieEditIndex: i }));

        const removeMovie = (i: number) => {
          setField('movies', movies.filter((_, idx) => idx !== i));
          if (editIndex === i) clearDraft();
          if (editIndex !== null && editIndex > i) {
            setForm((f) => ({ ...f, __movieEditIndex: editIndex - 1 }));
          }
        };

        const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all';
        const labelCls = 'block text-[10px] font-medium text-neutral-500 mb-1.5 font-montserrat uppercase tracking-wider';

        return (
          <div className="space-y-6">

            {/* ── Add movie form ─────────────────────────────────── */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-yellow-400 font-montserrat uppercase tracking-wider flex items-center gap-2">
                  <Icon name="FilmIcon" size={13} /> {editIndex !== null ? 'Edit Movie' : 'Add a Movie'}
                </p>
                {editIndex !== null && (
                  <span className="text-[11px] text-neutral-400 font-montserrat">
                    Editing item #{editIndex + 1}
                  </span>
                )}
              </div>

              {/* Name + Year on one row */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Movie Name *</label>
                  <input type="text" value={draft.name} onChange={(e) => setDraft({ name: e.target.value })}
                    placeholder="e.g. Vicky Donor" className={inputCls} />
                </div>
                <div className="w-full sm:w-24 shrink-0">
                  <label className={labelCls}>Year</label>
                  <input type="text" value={draft.year}
                    onChange={(e) => setDraft({ year: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                    placeholder="2012" maxLength={4} className={inputCls} />
                </div>
              </div>

              {/* Role + Director */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Role</label>
                  <input type="text" value={draft.role} onChange={(e) => setDraft({ role: e.target.value })}
                    placeholder="e.g. Lead Actor" className={inputCls} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Director</label>
                  <input type="text" value={draft.director} onChange={(e) => setDraft({ director: e.target.value })}
                    placeholder="e.g. Shoojit Sircar" className={inputCls} />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className={labelCls}>Genre</label>
                <input type="text" value={draft.genre} onChange={(e) => setDraft({ genre: e.target.value })}
                  placeholder="e.g. Romantic Comedy, Drama" className={inputCls} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ description: e.target.value })}
                  placeholder="e.g. Ayushmann Khurrana made his Bollywood debut as Vicky Arora, a carefree…"
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" onClick={commitMovie}
                  disabled={!draft.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-black text-xs font-semibold font-montserrat hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Icon name={editIndex !== null ? 'PencilSquareIcon' : 'PlusIcon'} size={13} /> {editIndex !== null ? 'Save Changes' : 'Add to List'}
                </button>
                {(draft.name || draft.role || draft.year || draft.director || draft.genre || draft.description) && (
                  <button type="button" onClick={clearDraft}
                    className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white font-montserrat transition-all">
                    {editIndex !== null ? 'Cancel Edit' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Added movies list ──────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                <p className="text-xs font-semibold text-white font-montserrat uppercase tracking-wider">
                  Filmography
                </p>
                <span className="text-xs text-neutral-500 font-montserrat">
                  ({movies.length} film{movies.length !== 1 ? 's' : ''})
                </span>
              </div>

              {movies.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border border-dashed border-white/8 text-center">
                  <Icon name="FilmIcon" size={24} className="text-neutral-700" />
                  <p className="text-sm text-neutral-600 font-montserrat">No movies added yet</p>
                  <p className="text-xs text-neutral-700 font-montserrat">Fill in the form above and click &ldquo;Add to List&rdquo;</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movies.map((movie, i) => (
                    <div key={i}
                      className={`flex flex-col gap-3 px-4 py-3 rounded-xl border bg-white/3 transition-colors sm:flex-row sm:items-start ${editIndex === i ? 'border-primary/40 bg-primary/5' : 'border-white/6 hover:border-white/12'} group`}>
                      {/* Year pill */}
                      <span className="shrink-0 mt-0.5 text-xs font-bold text-primary font-montserrat w-10 text-left sm:text-center">
                        {movie.year || '—'}
                      </span>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white font-montserrat truncate">{movie.name}</span>
                          {movie.role && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-montserrat shrink-0">
                              {movie.role}
                            </span>
                          )}
                          {movie.genre && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-montserrat shrink-0">
                              {movie.genre}
                            </span>
                          )}
                        </div>
                        {movie.director && (
                          <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Dir. {movie.director}</p>
                        )}
                        {movie.description && (
                          <p className="text-xs text-neutral-600 font-montserrat mt-0.5 line-clamp-1">{movie.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => editMovie(i)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-primary/10 hover:text-primary transition-all"
                          title="Edit"
                        >
                          <Icon name="PencilSquareIcon" size={13} />
                        </button>
                        <button type="button" onClick={() => removeMovie(i)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-red-500/15 hover:text-red-400 transition-all"
                          title="Remove">
                          <Icon name="TrashIcon" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── AWARDS ───────────────────────────────────────────────────────
      case 'awards': {
        const awards = form.awards || [];
        const EMPTY_AWARD: CelebrityAward = { title: '', category: '', year: '', organization: '', work: '', description: '' };

        const awardDraft: CelebrityAward = (form as any).__awardDraft ?? { ...EMPTY_AWARD };
        const awardEditIndex = typeof (form as any).__awardEditIndex === 'number' ? (form as any).__awardEditIndex : null;
        const setAwardDraft = (patch: Partial<CelebrityAward>) =>
          setForm((f) => ({ ...f, __awardDraft: { ...((f as any).__awardDraft ?? EMPTY_AWARD), ...patch } }));
        const clearAwardDraft = () =>
          setForm((f) => {
            const next = { ...f };
            delete (next as any).__awardDraft;
            delete (next as any).__awardEditIndex;
            return next;
          });

        const commitAward = () => {
          if (!awardDraft.title.trim()) return;
          const nextAward = {
            ...(awardEditIndex !== null ? awards[awardEditIndex] : {}),
            title:        awardDraft.title.trim(),
            category:     awardDraft.category.trim(),
            year:         awardDraft.year.trim(),
            organization: awardDraft.organization.trim(),
            work:         awardDraft.work.trim(),
            description:  awardDraft.description.trim(),
          };
          setField(
            'awards',
            awardEditIndex !== null
              ? awards.map((a, idx) => (idx === awardEditIndex ? nextAward : a))
              : [...awards, nextAward]
          );
          clearAwardDraft();
        };

        const editAward = (i: number) =>
          setForm((f) => ({ ...f, __awardDraft: { ...awards[i] }, __awardEditIndex: i }));

        const removeAward = (i: number) => {
          setField('awards', awards.filter((_, idx) => idx !== i));
          if (awardEditIndex === i) clearAwardDraft();
          if (awardEditIndex !== null && awardEditIndex > i) {
            setForm((f) => ({ ...f, __awardEditIndex: awardEditIndex - 1 }));
          }
        };

        const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all';
        const labelCls = 'block text-[10px] font-medium text-neutral-500 mb-1.5 font-montserrat uppercase tracking-wider';

        return (
          <div className="space-y-6">

            {/* ── Add award form ─────────────────────────────── */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-yellow-400 font-montserrat uppercase tracking-wider flex items-center gap-2">
                  <Icon name="TrophyIcon" size={13} /> {awardEditIndex !== null ? 'Edit Award' : 'Add an Award'}
                </p>
                {awardEditIndex !== null && (
                  <span className="text-[11px] text-neutral-400 font-montserrat">
                    Editing item #{awardEditIndex + 1}
                  </span>
                )}
              </div>

              {/* Title + Year */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Title *</label>
                  <input type="text" value={awardDraft.title} onChange={(e) => setAwardDraft({ title: e.target.value })}
                    placeholder="e.g. SIIMA Awards" className={inputCls} />
                </div>
                <div className="w-full sm:w-24 shrink-0">
                  <label className={labelCls}>Year</label>
                  <input type="text" value={awardDraft.year}
                    onChange={(e) => setAwardDraft({ year: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                    placeholder="2017" maxLength={4} className={inputCls} />
                </div>
              </div>

              {/* Category + Organization */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Category</label>
                  <input type="text" value={awardDraft.category} onChange={(e) => setAwardDraft({ category: e.target.value })}
                    placeholder="e.g. Best Female Debut (Telugu) – Nominee" className={inputCls} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelCls}>Organization</label>
                  <input type="text" value={awardDraft.organization} onChange={(e) => setAwardDraft({ organization: e.target.value })}
                    placeholder="e.g. South Indian International Movie Awards" className={inputCls} />
                </div>
              </div>

              {/* Work */}
              <div>
                <label className={labelCls}>Work / Project</label>
                <input type="text" value={awardDraft.work} onChange={(e) => setAwardDraft({ work: e.target.value })}
                  placeholder="e.g. Krishna Gaadi Veera Prema Gaadha" className={inputCls} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={awardDraft.description} onChange={(e) => setAwardDraft({ description: e.target.value })}
                  placeholder="e.g. Mehreen received a nomination for her refreshing and expressive debut…"
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" onClick={commitAward}
                  disabled={!awardDraft.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-black text-xs font-semibold font-montserrat hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Icon name={awardEditIndex !== null ? 'PencilSquareIcon' : 'PlusIcon'} size={13} />
                  {awardEditIndex !== null ? 'Save Changes' : 'Add to List'}
                </button>
                {(awardDraft.title || awardDraft.category || awardDraft.year || awardDraft.organization || awardDraft.work || awardDraft.description) && (
                  <button type="button" onClick={clearAwardDraft}
                    className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white font-montserrat transition-all">
                    {awardEditIndex !== null ? 'Cancel Edit' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Awards list ────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded-full bg-yellow-400 inline-block" />
                <p className="text-xs font-semibold text-white font-montserrat uppercase tracking-wider">Awards &amp; Nominations</p>
                <span className="text-xs text-neutral-500 font-montserrat">({awards.length} entr{awards.length !== 1 ? 'ies' : 'y'})</span>
              </div>

              {awards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border border-dashed border-white/8 text-center">
                  <Icon name="TrophyIcon" size={24} className="text-neutral-700" />
                  <p className="text-sm text-neutral-600 font-montserrat">No awards added yet</p>
                  <p className="text-xs text-neutral-700 font-montserrat">Fill in the form above and click &ldquo;Add to List&rdquo;</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {awards.map((award, i) => (
                    <div key={i}
                      className={`flex flex-col gap-3 px-4 py-3 rounded-xl border bg-white/3 transition-colors sm:flex-row sm:items-start ${
                        awardEditIndex === i ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/6 hover:border-white/12'
                      } group`}>
                      {/* Year pill */}
                      <span className="shrink-0 mt-0.5 text-xs font-bold text-yellow-400 font-montserrat w-10 text-left sm:text-center">
                        {award.year || '—'}
                      </span>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white font-montserrat truncate">{award.title}</span>
                          {award.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-montserrat shrink-0">
                              {award.category}
                            </span>
                          )}
                        </div>
                        {award.organization && (
                          <p className="text-xs text-neutral-500 font-montserrat mt-0.5">{award.organization}</p>
                        )}
                        {award.work && (
                          <p className="text-xs text-neutral-600 font-montserrat mt-0.5">For: {award.work}</p>
                        )}
                        {award.description && (
                          <p className="text-xs text-neutral-600 font-montserrat mt-0.5 line-clamp-1">{award.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                        <button type="button" onClick={() => editAward(i)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all"
                          title="Edit">
                          <Icon name="PencilSquareIcon" size={13} />
                        </button>
                        <button type="button" onClick={() => removeAward(i)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-red-500/15 hover:text-red-400 transition-all"
                          title="Remove">
                          <Icon name="TrashIcon" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── SOCIAL ────────────────────────────────────────────────────────
      case 'social': return (
        <div className="space-y-6">
          {/* Social Platforms */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">Social Platforms</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { key: 'instagram' as const, label: 'Instagram',  placeholder: 'https://instagram.com/...'   },
                { key: 'twitter'   as const, label: 'Twitter / X', placeholder: 'https://twitter.com/...'    },
                { key: 'facebook'  as const, label: 'Facebook',   placeholder: 'https://facebook.com/...'   },
                { key: 'youtube'   as const, label: 'YouTube',    placeholder: 'https://youtube.com/...'    },
                { key: 'tiktok'    as const, label: 'TikTok',     placeholder: 'https://tiktok.com/@...'    },
                { key: 'threads'   as const, label: 'Threads',    placeholder: 'https://threads.net/@...'   },
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
          </div>

          <div className="border-t border-white/8" />

          {/* External Profiles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 font-montserrat mb-3">External Profiles</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { key: 'imdb'      as const, label: 'IMDb Profile',   placeholder: 'https://www.imdb.com/name/...' },
                { key: 'wikipedia' as const, label: 'Wikipedia Page', placeholder: 'https://en.wikipedia.org/wiki/...' },
                { key: 'website'   as const, label: 'Official Website', placeholder: 'https://example.com'          },
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
          </div>
        </div>
      );

      // ── META ──────────────────────────────────────────────────────────
      case 'meta': {
        const seo = form.seo || {};
        const setSeo = <K extends keyof NonNullable<CelebrityFull['seo']>>(k: K, v: NonNullable<CelebrityFull['seo']>[K]) =>
          setField('seo', { ...form.seo, [k]: v });

        const metaTitleLen   = (seo.metaTitle       || '').length;
        const metaDescLen    = (seo.metaDescription || '').length;
        const titleScore  = metaTitleLen === 0 ? 'empty' : metaTitleLen <= 60  ? 'good' : 'long';
        const descScore   = metaDescLen  === 0 ? 'empty' : metaDescLen  <= 160 ? 'good' : 'long';
        const scoreColor  = (s: string) =>
          s === 'good'  ? 'text-emerald-400' :
          s === 'long'  ? 'text-amber-400'   : 'text-neutral-600';
        const scoreLabel  = (s: string, len: number, max: number) =>
          s === 'empty' ? 'Not set' : s === 'good' ? `${len}/${max} ✓ Good` : `${len}/${max} — Too long`;

        return (
          <div className="space-y-7">

            {/* ── Classification ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Classification</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LabeledMultiline label="Tags (one per line)" value={joinLines(form.tags)} onChange={(v) => setField('tags', splitLines(v))} placeholder="bollywood&#10;actor&#10;dramatic" />
                <LabeledMultiline label="Categories (one per line)" value={joinLines(form.categories)} onChange={(v) => setField('categories', splitLines(v))} placeholder="Bollywood&#10;Entertainment" />
              </div>
            </section>

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
                    placeholder="e.g. Dwayne Johnson net worth"
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
                    placeholder={`${form.name || 'Celebrity Name'} — Biography, Age, Net Worth | CelebrityPersona`}
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all ${
                      titleScore === 'long' ? 'border-amber-500/40 focus:border-amber-500/60' :
                      titleScore === 'good' ? 'border-emerald-500/30 focus:border-emerald-500/60' : 'border-white/10 focus:border-yellow-500/60'
                    }`}
                  />
                  {/* Visual bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden w-full">
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
                    <label className="text-xs font-medium text-neutral-400 font-montserrat uppercase tracking-wider">Meta Description</label>
                    <span className={`text-[10px] font-montserrat ${scoreColor(descScore)}`}>
                      {scoreLabel(descScore, metaDescLen, 160)}
                    </span>
                  </div>
                  <textarea
                    rows={3} value={seo.metaDescription || ''}
                    onChange={(e) => setSeo('metaDescription', e.target.value)}
                    placeholder="A short, compelling summary of this celebrity page shown in Google results. Include the focus keyword naturally."
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-neutral-600 focus:outline-none font-montserrat text-sm transition-all resize-none ${
                      descScore === 'long' ? 'border-amber-500/40 focus:border-amber-500/60' :
                      descScore === 'good' ? 'border-emerald-500/30 focus:border-emerald-500/60' : 'border-white/10 focus:border-yellow-500/60'
                    }`}
                  />
                  <div className="mt-1.5 h-1 rounded-full bg-white/8 overflow-hidden w-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        descScore === 'good' ? 'bg-emerald-500' : descScore === 'long' ? 'bg-amber-500' : 'bg-neutral-700'
                      }`}
                      style={{ width: `${Math.min(100, (metaDescLen / 160) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Secondary Keywords (one per line)</label>
                  <textarea
                    rows={3} value={joinLines(seo.keywords)}
                    onChange={(e) => setSeo('keywords', splitLines(e.target.value))}
                    placeholder={"dwayne johnson movies\nthe rock wrestling\ndwayne johnson family"}
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
                    placeholder={`https://yoursite.com/celebrity-profiles/${form.slug || 'celebrity-slug'}`}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Prevents duplicate-content penalties. Leave blank to use the page URL.</p>
                </div>

                {/* Breadcrumb title */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Breadcrumb Title</label>
                  <input
                    type="text" value={seo.breadcrumbTitle || ''}
                    onChange={(e) => setSeo('breadcrumbTitle', e.target.value)}
                    placeholder={form.name || 'Celebrity Name'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Short label shown in breadcrumb navigation (used in structured data).</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Open Graph (Facebook / LinkedIn) ────────── */}
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
                    placeholder={seo.metaTitle || `${form.name || 'Celebrity Name'} — Biography`}
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
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">OG Image URL</label>
                  <input
                    type="url" value={seo.ogImage || ''}
                    onChange={(e) => setSeo('ogImage', e.target.value)}
                    placeholder={form.profileImage || 'https://... (1200×630 px recommended)'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Recommended: 1200 × 630 px. Leave blank to default to profile photo.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Twitter Card ────────────────────────────── */}
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
              </div>
            </section>

            <div className="border-t border-white/8" />

            {/* ── Structured Data / Schema.org ─────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <p className="text-sm font-semibold text-white font-montserrat">Structured Data (Schema.org)</p>
              </div>
              <p className="text-xs text-neutral-500 font-montserrat mb-4">Enables rich results, knowledge panels, and enhanced snippets in Google.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Schema Type</label>
                  <select
                    value={seo.schemaType || 'Person'}
                    onChange={(e) => setSeo('schemaType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm cursor-pointer"
                  >
                    {['Person', 'Athlete', 'MusicGroup', 'EntertainmentBusiness', 'Movie', 'TVSeries'].map((t) => (
                      <option key={t} value={t} style={{ background: '#2b1433' }}>{t}</option>
                    ))}
                  </select>
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Most celebrities = Person. Use Athlete for sportspeople.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Article Section</label>
                  <input
                    type="text" value={seo.articleSection || ''}
                    onChange={(e) => setSeo('articleSection', e.target.value)}
                    placeholder="Entertainment, Sports, Music…"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">Est. Reading Time</label>
                  <input
                    type="text" value={seo.readingTime || ''}
                    onChange={(e) => setSeo('readingTime', e.target.value)}
                    placeholder="5 min read"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/60 font-montserrat text-sm transition-all"
                  />
                  <p className="text-neutral-600 text-xs mt-1 font-montserrat">Shown in breadcrumb structured data.</p>
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
                  seo.robotsIndex ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-montserrat text-white">Index this page</p>
                      <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Allow Google to include it in search results</p>
                    </div>
                    <button
                      type="button" onClick={() => setSeo('robotsIndex', !seo.robotsIndex)}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsIndex ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsIndex ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsIndex ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {seo.robotsIndex ? 'index' : 'noindex'}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${
                  seo.robotsFollow ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-amber-500/8 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-montserrat text-white">Follow links</p>
                      <p className="text-xs text-neutral-500 font-montserrat mt-0.5">Allow crawlers to follow links on this page</p>
                    </div>
                    <button
                      type="button" onClick={() => setSeo('robotsFollow', !seo.robotsFollow)}
                      className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                        seo.robotsFollow ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        seo.robotsFollow ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className={`text-[10px] font-montserrat mt-2 font-semibold ${
                    seo.robotsFollow ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {seo.robotsFollow ? 'follow' : 'nofollow'}
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

      {/* Stats — hidden while the form panel is open */}
      {!panelMode && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row gap-3">
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
            className="w-full xl:w-auto min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={limit}
            onChange={(e) => fetchList(1, Number(e.target.value))}
            className="w-full xl:w-auto min-w-0 box-border px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-montserrat text-sm focus:outline-none focus:border-yellow-500/60 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
          <button
            onClick={() => fetchList(page)}
            disabled={loading}
            title="Refresh"
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <Icon name="ArrowPathIcon" size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {panelMode ? (
            <button
              onClick={closePanel}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 font-semibold font-montserrat text-sm hover:bg-white/20 transition-all"
            >
              <Icon name="ChevronLeftIcon" size={16} />
              Back to List
            </button>
          ) : (
            <button
              onClick={openAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all"
            >
              <Icon name="PlusIcon" size={16} />
              Add Celebrity
            </button>
          )}
        </div>
      </div>

      {/* Error — hidden while the form panel is open */}
      {!panelMode && fetchError && (
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
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 border-b border-white/10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Icon name={panelMode === 'add' ? 'UserPlusIcon' : 'PencilSquareIcon'} size={20} className="text-yellow-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-playfair text-base sm:text-lg font-bold text-white truncate">
                  {panelMode === 'add' ? 'Add New Celebrity' : `Editing — ${form.name || '...'}`}
                </h3>
                <p className="text-neutral-500 text-xs font-montserrat leading-relaxed">
                  {panelMode === 'add' ? 'Fill in details across tabs — only Name and Slug are required' : 'Update celebrity profile details'}
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
              <span className="text-neutral-400 font-montserrat text-sm">Loading celebrity details...</span>
            </div>
          ) : (
            <form onSubmit={panelMode === 'add' ? handleCreate : handleUpdate}>
              {/* Tab bar */}
              <div className="flex gap-1 px-3 pt-4 pb-1 sm:px-6 overflow-x-auto border-b border-white/10">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFormTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-medium font-montserrat whitespace-nowrap transition-all ${
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
              <div className="px-3 py-4 sm:px-6 sm:py-5 min-h-[360px] overflow-x-hidden">
                {formApiError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-montserrat text-center">{formApiError}</p>
                  </div>
                )}
                {renderFormTab()}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 px-3 py-4 sm:px-6 border-t border-white/10 bg-white/2">
                {/* Status + Toggles row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status pills */}
                  <div className="flex gap-2">
                    {(['draft', 'published'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField('status', s)}
                        className={`px-4 py-1.5 rounded-xl border font-montserrat text-xs font-semibold capitalize transition-all ${
                          form.status === s
                            ? s === 'published'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-white/5 border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300'
                        }`}
                      >
                        {s === 'draft' ? '📝 Draft' : '✅ Published'}
                      </button>
                    ))}
                  </div>
                  {/* Divider */}
                  <div className="h-5 w-px bg-white/10 hidden sm:block" />
                  {/* Featured & Verified toggles */}
                  <ToggleField label="Featured" value={form.isFeatured ?? false} onChange={(v) => setField('isFeatured', v)} />
                  <ToggleField label="Verified" value={form.isVerified ?? false} onChange={(v) => setField('isVerified', v)} />
                </div>
                {/* Actions row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-neutral-600 text-xs font-montserrat">* Name and Slug are required</p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  {/* Save as Draft — always visible, only needs name+slug */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={draftLoading || formLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 font-montserrat text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {draftLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {draftLoading ? 'Saving draft…' : '📝 Save as Draft'}
                  </button>
                  {/* Publish — requires full validation */}
                  <button
                    type="submit"
                    disabled={formLoading || draftLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold font-montserrat text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading && <Icon name="ArrowPathIcon" size={14} className="animate-spin" />}
                    {formLoading
                      ? (panelMode === 'add' ? 'Creating...' : 'Saving...')
                      : (panelMode === 'add' ? 'Create Celebrity' : 'Save Changes')}
                  </button>
                </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table — hidden while the form panel is open */}
      {!panelMode && <div className="glass-card rounded-2xl p-6">
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
                {['Celebrity', 'Nationality / Occupation', 'Status', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-neutral-500 text-xs font-medium font-montserrat uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletonRows.map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[180, 140, 80, 60, 80].map((w, j) => (
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
