"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Movie {
  _id?: string;
  name: string;
  role: string;
  year: string;
  director: string;
  genre: string;
  description: string;
}

interface WebSeries {
  _id?: string;
  name: string;
  role: string;
  seasons: string;
  year: string;
  platform: string;
  genre: string;
  description: string;
}

interface TvShow {
  _id?: string;
  name: string;
  role: string;
  seasons: string;
  year: string;
  channel: string;
  genre: string;
  description: string;
}

interface Award {
  _id?: string;
  title: string;
  category: string;
  year: string;
  organization: string;
  work: string;
  description: string;
}

interface Marriage {
  name?: string;
  marriedYear?: string;
  divorcedYear?: string;
  currentlyMarried?: boolean;
}

interface SocialMedia {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  threads?: string;
  imdb?: string;
  wikipedia?: string;
  website?: string;
}

export interface FullCelebrity {
  id: string;
  name: string;
  slug: string;
  born?: string;
  birthPlace?: string;
  died?: string;
  age?: number;
  nationality?: string;
  citizenship?: string[];
  occupation?: string[];
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
  movies?: Movie[];
  webSeries?: WebSeries[];
  tvShows?: TvShow[];
  awards?: Award[];
  marriages?: Marriage[];
  quotes?: string[];
  socialMedia?: SocialMedia;
  profileImage?: string;
  coverImage?: string;
  galleryImages?: string[];
  categories?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isVerified?: boolean;
  viewCount?: number;
  popularityScore?: number;
  likes?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function RichHtml({ html, className }: { html?: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`rich-editor-content ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function formatDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseBodyMeasurements(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/^(Girl|Boy)Measurements\|\s*/i, '');
}

function SectionHeading({
  children,
  icon,
  id,
}: {
  children: React.ReactNode;
  icon?: string;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="font-playfair text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3 scroll-mt-24"
    >
      <span className="w-1 h-8 rounded-full bg-primary inline-block flex-shrink-0" />
      {icon && <Icon name={icon as never} size={22} className="text-primary" />}
      {children}
    </h2>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | number;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-neutral-500 uppercase tracking-wider flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-right ${highlight ? 'text-primary' : 'text-neutral-200'}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Icon name={icon as never} size={15} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

const SOCIAL_ICONS: Record<string, { svg: React.ReactNode; color: string; hoverBg: string }> = {
  instagram: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.9 4.9 0 0 1 1.77 1.153 4.9 4.9 0 0 1 1.153 1.77c.163.46.35 1.26.403 2.43.058 1.266.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.9 4.9 0 0 1-1.153 1.77 4.9 4.9 0 0 1-1.77 1.153c-.46.163-1.26.35-2.43.403-1.266.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.9 4.9 0 0 1-1.77-1.153A4.9 4.9 0 0 1 1.597 19.28c-.163-.46-.35-1.26-.403-2.43C1.136 15.584 1.124 15.204 1.124 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43A4.9 4.9 0 0 1 2.75 2.95a4.9 4.9 0 0 1 1.77-1.153c.46-.163 1.26-.35 2.43-.403C8.216 1.336 8.596 1.324 12 1.324m0-1.161C8.735 1.163 8.332 1.176 7.052 1.234 5.775 1.292 4.902 1.486 4.14 1.772a6.06 6.06 0 0 0-2.19 1.427A6.06 6.06 0 0 0 .524 5.389C.238 6.151.044 7.024-.014 8.3-.072 9.58-.086 9.983-.086 13.247s.014 3.667.072 4.947c.058 1.276.252 2.149.538 2.911a6.06 6.06 0 0 0 1.427 2.19 6.06 6.06 0 0 0 2.19 1.427c.762.286 1.635.48 2.911.538 1.28.058 1.683.072 4.947.072s3.667-.014 4.947-.072c1.276-.058 2.149-.252 2.911-.538a6.06 6.06 0 0 0 2.19-1.427 6.06 6.06 0 0 0 1.427-2.19c.286-.762.48-1.635.538-2.911.058-1.28.072-1.683.072-4.947s-.014-3.667-.072-4.947c-.058-1.276-.252-2.149-.538-2.911a6.06 6.06 0 0 0-1.427-2.19A6.06 6.06 0 0 0 19.858 1.772C19.096 1.486 18.223 1.292 16.947 1.234 15.667 1.176 15.264 1.163 12 1.163zm0 3.23a5.607 5.607 0 1 0 0 11.213A5.607 5.607 0 0 0 12 4.393zm0 9.245a3.638 3.638 0 1 1 0-7.276 3.638 3.638 0 0 1 0 7.276zm7.115-9.468a1.31 1.31 0 1 1-2.621 0 1.31 1.31 0 0 1 2.621 0z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-pink-400',
    hoverBg: 'hover:bg-pink-500/10',
  },
  twitter: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-sky-400',
    hoverBg: 'hover:bg-sky-500/10',
  },
  facebook: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-blue-400',
    hoverBg: 'hover:bg-blue-500/10',
  },
  youtube: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-red-400',
    hoverBg: 'hover:bg-red-500/10',
  },
  tiktok: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-white',
    hoverBg: 'hover:bg-white/10',
  },
  threads: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.474 12.01v-.017c.027-3.579.875-6.43 2.521-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.594 12c.022 3.087.713 5.495 2.052 7.161 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.822-2.047 1.634-1.578 1.631-3.308 1.154-4.45-.298-.73-.899-1.338-1.82-1.662-.302 2.614-1.607 4.184-3.993 4.73-1.62.374-3.118.164-4.234-.585-1.266-.847-1.957-2.21-1.927-3.798.03-1.586.724-2.944 1.951-3.816 1.077-.762 2.473-1.15 4.14-1.15.414 0 .817.021 1.199.063-.066-.516-.22-.969-.477-1.342-.428-.617-1.138-.942-2.07-.965-1.045.023-1.712.366-2.132 1.075l-1.826-1.054c.76-1.31 2.085-2.074 3.958-2.074h.078c2.916.087 4.611 1.826 4.533 4.613a8.764 8.764 0 0 1-.065 1.01c.716.322 1.3.792 1.72 1.397.676.972.918 2.12.72 3.338-.325 1.99-1.552 3.54-3.549 4.476-1.407.657-3.01.972-4.806.972zm.666-8.956c-.314 0-.619.015-.91.044.062.924.393 1.636.98 2.08.517.394 1.207.537 2.015.42 1.215-.175 1.91-1.12 1.93-2.662a8.97 8.97 0 0 0-1.11-.154 12.5 12.5 0 0 0-.905-.067c-.648.226-1.4.339-2 .339z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-neutral-200',
    hoverBg: 'hover:bg-white/10',
  },
  imdb: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07v4.815c.27 0 .44-.057.5-.17.062-.115.093-.42.093-.914V10.7c0-.492-.022-.8-.068-.915a.338.338 0 0 0-.105-.197zM24 4.25v15.5A4.25 4.25 0 0 1 19.75 24H4.25A4.25 4.25 0 0 1 0 19.75V4.25A4.25 4.25 0 0 1 4.25 0h15.5A4.25 4.25 0 0 1 24 4.25zM4.02 15.64h1.993V8.36H4.02v7.28zm3.382 0h1.74l.01-4.852.623 4.852H11l.66-4.896v4.896h1.714V8.36h-2.53l-.548 3.686L9.77 8.36H7.402v7.28zm8.212.124c.355 0 .69-.08.988-.252.296-.17.507-.39.626-.66.12-.27.18-.698.18-1.284v-2.88c0-.604-.043-1.025-.13-1.257a.994.994 0 0 0-.51-.558c-.246-.13-.646-.195-1.198-.195H13.48v7.086h2.134zm3.376-.124h-1.96V8.36h1.96v2.67l.71-2.67h1.96l-.94 2.88.96 4.4h-2.03l-.66-3.344v3.344z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-yellow-400',
    hoverBg: 'hover:bg-yellow-500/10',
  },
  wikipedia: {
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
        <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c-.003.069-.096.129-.271.18-.286.077-.472.179-.559.295a.298.298 0 0 0-.04.16c0 .109.025.251.074.424.44 1.572 2.977 7.58 3.567 9.027l1.011-2.069c.498-.991 1.117-2.468 1.117-3.073 0-.78-.278-1.312-.833-1.598-.291-.147-.423-.251-.399-.312l.034-.034.04-.054c.09-.003 3.375 0 3.375 0l.046.045v.412c0 .073-.101.138-.295.196-.68.201-.963.735-1.09 1.073zm3.781 6.708c-.288.072-.443.167-.448.291l-.021.045v.408l.03.051s2.765-.005 4.487-.005l.037-.057v-.415c-.006-.13-.17-.233-.482-.3-.405-.085-.671-.185-.8-.3-.13-.117-.195-.292-.195-.528 0-.097.03-.275.093-.537l1.241-5.206.005-.018 1.495 6.079c.03.11.046.199.046.268 0 .206-.121.355-.363.45-.158.063-.278.12-.362.174l-.052.034v.381l.034.046c1.717.005 3.477.005 3.477.005l.034-.046v-.37c-.003-.123-.181-.228-.533-.315-.348-.087-.614-.255-.799-.505L19.48 8.772l-.034-.046c-.578.005-1.176.005-1.176.005l-.057.045-2.343 11.051z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-neutral-100',
    hoverBg: 'hover:bg-white/10',
  },
  website: {
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    color: 'text-neutral-400 hover:text-emerald-400',
    hoverBg: 'hover:bg-emerald-500/10',
  },
};

function SocialBtn({
  href,
  platform,
  label,
}: {
  href: string;
  platform: string;
  label: string;
}) {
  const meta = SOCIAL_ICONS[platform];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={`${label} profile`}
      className={`glass-card p-2.5 rounded-full ${meta?.color ?? 'text-neutral-400'} ${meta?.hoverBg ?? ''} transition-all backdrop-blur-md`}
    >
      {meta?.svg ?? <Icon name="GlobeAltIcon" size={17} />}
    </a>
  );
}

// ── Wikipedia-style table helpers ────────────────────────────────────────────
function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-white/5 border-b border-white/8 whitespace-nowrap ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 border-b border-white/5 align-top text-neutral-300 ${className ?? ''}`}>
      {children}
    </td>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CelebrityProfileDetail({
  celebrity: c,
}: {
  celebrity: FullCelebrity;
}) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [activeQuote, setActiveQuote] = useState(0);

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followChecked, setFollowChecked] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState((c.likes ?? []).length);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeChecked, setLikeChecked] = useState(false);

  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);

  // Auto-rotate quotes
  useEffect(() => {
    if ((c.quotes?.length ?? 0) <= 1) return;
    const t = setInterval(
      () => setActiveQuote((p) => (p + 1) % c.quotes!.length),
      6000,
    );
    return () => clearInterval(t);
  }, [c.quotes]);

  // Follow / like status
  useEffect(() => {
    fetch(`/api/user/celebrities/like-status/${c.slug}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setLikeCount(json.count); })
      .catch(() => { });

    if (!user) {
      setFollowChecked(true);
      setLikeChecked(true);
      return;
    }

    fetch(`/api/user/celebrities/like-status/${c.slug}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) { setLiked(json.liked); setLikeCount(json.count); }
      })
      .catch(() => { })
      .finally(() => setLikeChecked(true));

    fetch('/api/user/celebrities/following', { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success)
          setFollowing(json.celebrities.some((cel: any) => cel.slug === c.slug));
      })
      .catch(() => { })
      .finally(() => setFollowChecked(true));
  }, [user]); // eslint-disable-line

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxImg) return;
    const allImgs = [c.profileImage, ...(c.galleryImages ?? [])].filter(
      Boolean,
    ) as string[];
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
      if (e.key === 'ArrowRight') {
        const next = (lightboxIdx + 1) % allImgs.length;
        setLightboxIdx(next);
        setLightboxImg(allImgs[next]);
      }
      if (e.key === 'ArrowLeft') {
        const prev = (lightboxIdx - 1 + allImgs.length) % allImgs.length;
        setLightboxIdx(prev);
        setLightboxImg(allImgs[prev]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxImg, lightboxIdx, c]);

  const openLightbox = (src: string) => {
    const allImgs = [c.profileImage, ...(c.galleryImages ?? [])].filter(
      Boolean,
    ) as string[];
    const idx = allImgs.indexOf(src);
    setLightboxIdx(idx >= 0 ? idx : 0);
    setLightboxImg(src);
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/celebrity-profiles/${c.slug}`);
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/user/celebrities/follow', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityId: c.id }),
      });
      const json = await res.json();
      if (json.success) setFollowing(json.following);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/celebrity-profiles/${c.slug}`);
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/user/celebrities/like', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityId: c.id }),
      });
      const json = await res.json();
      if (json.success) { setLiked(json.liked); setLikeCount(json.count); }
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const coverImg = c.coverImage || c.profileImage || '';
  const profileImg = c.profileImage || c.coverImage || '';
  const profession = c.occupation?.join(' · ') || '';

  const galleryOnly = (c.galleryImages ?? []).filter(Boolean);
  const inlineImg1 = galleryOnly[0] ?? null;
  const inlineImg2 = galleryOnly[1] ?? null;
  const inlineImg3 = galleryOnly[2] ?? null;
  const inlineImg4 = galleryOnly[3] ?? null;
  const inlineImg5 = galleryOnly[4] ?? null;
  const stripImgs = galleryOnly.slice(4);

  const hasFilms = (c.movies?.length ?? 0) > 0;
  const hasWebSeries = (c.webSeries?.length ?? 0) > 0;
  const hasTvShows = (c.tvShows?.length ?? 0) > 0;
  const hasAwards = (c.awards?.length ?? 0) > 0;
  const hasQuotes = (c.quotes?.length ?? 0) > 0;
  const hasBio = !!(c.earlyLife || c.career || c.personalLife);
  const hasFamily = !!(
    c.parents?.length ||
    c.children?.length ||
    c.siblings?.length ||
    c.relatives?.length ||
    c.spouse ||
    c.marriages?.length
  );
  const hasPhilanthr = (c.philanthropy?.length ?? 0) > 0;
  const hasControversy = (c.controversies?.length ?? 0) > 0;
  const hasTrivia = (c.trivia?.length ?? 0) > 0;
  const hasAchiev = (c.achievements?.length ?? 0) > 0;
  const hasWorks = (c.works?.length ?? 0) > 0;
  const hasEducation = (c.education?.length ?? 0) > 0;
  const hasGallery = galleryOnly.length > 0;

  const bodyMeas = parseBodyMeasurements(c.bodyMeasurements);

  const winnerAwards = c.awards?.filter((a) => /winner/i.test(a.category)) ?? [];
  const nomineeAwards = c.awards?.filter((a) => !/winner/i.test(a.category)) ?? [];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <article className="pt-20 min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative h-[80vh] min-h-[540px] w-full overflow-hidden">
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImg}
            alt={`${c.name} cover`}
            className="w-full h-full object-cover object-top scale-105 pointer-events-none"
            style={{ filter: 'brightness(0.65)' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent pointer-events-none" />

        {/* Back breadcrumb */}
        <nav aria-label="Breadcrumb" className="absolute top-6 left-6 md:left-10 z-10">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <Link href="/" className="glass-card px-3 py-2 rounded-full text-neutral-400 hover:text-white transition-colors backdrop-blur-md text-xs">
                Home
              </Link>
            </li>
            <li className="text-neutral-600">/</li>
            <li>
              <Link href="/celebrity-profiles" className="glass-card px-3 py-2 rounded-full text-neutral-400 hover:text-white transition-colors backdrop-blur-md text-xs">
                Celebrities
              </Link>
            </li>
            <li className="text-neutral-600">/</li>
            <li aria-current="page" className="glass-card px-3 py-2 rounded-full text-white backdrop-blur-md text-xs max-w-[180px] truncate">
              {c.name}
            </li>
          </ol>
        </nav>

        {/* Top-right: actions + social */}
        <div className="absolute top-6 right-6 md:right-10 flex items-center gap-2 z-10 flex-wrap justify-end max-w-[60%]">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            aria-label={liked ? 'Unlike' : 'Like'}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-semibold backdrop-blur-md transition-all ${liked
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'glass-card text-neutral-300 hover:bg-rose-500/20 hover:text-rose-300 border border-white/20'
              }`}
          >
            {likeLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="HeartIcon" size={15} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
            )}
            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
          </button>

          {/* Follow */}
          {followChecked && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              aria-label={following ? 'Unfollow' : 'Follow'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold backdrop-blur-md transition-all ${following
                  ? 'bg-primary text-black hover:bg-primary/80'
                  : 'glass-card text-white hover:bg-white/10 border border-white/20'
                }`}
            >
              {followLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="UserPlusIcon" size={16} />
              )}
              {following ? 'Following' : 'Follow'}
            </button>
          )}

          {/* social buttons moved to Personal Info sidebar */}
        </div>

        {/* Hero bottom: avatar + name */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 md:px-16">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-end gap-6">
            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {c.isFeatured && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-primary text-black uppercase">
                    Featured
                  </span>
                )}
                {c.categories?.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-0.5 rounded-full text-[10px] glass-card text-neutral-400 capitalize backdrop-blur-md"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
                {c.name}
              </h1>
              {profession && (
                <p className="font-montserrat text-primary text-base md:text-lg mt-1.5 tracking-wide">
                  {profession}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-neutral-400 text-sm">
                {c.nationality && (
                  <span className="flex items-center gap-1">
                    <Icon name="GlobeAltIcon" size={13} />
                    {c.nationality}
                  </span>
                )}
                {c.nationality && c.born && <span className="text-neutral-600">·</span>}
                {c.born && <span>Born {formatDate(c.born)}</span>}
                {c.age && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span>Age {c.age}</span>
                  </>
                )}
                {c.died && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-500">d. {formatDate(c.died)}</span>
                  </>
                )}
                {c.yearsActive && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span>{c.yearsActive}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 mt-10">

        {/* ═══════════ OVERVIEW ═══════════ */}
        <div className="space-y-20">

          {/* Intro + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left */}
            <div className="lg:col-span-2 space-y-12">

              {/* Introduction */}
              {c.introduction && (
                <section id="introduction">
                  <SectionHeading id="introduction">Introduction</SectionHeading>
                  <div>
                    {inlineImg1 && (
                      <button
                        onClick={() => openLightbox(inlineImg1)}
                        className="float-left mr-6 mb-4 w-44 md:w-60 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group relative"
                        style={{ aspectRatio: '3/4' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inlineImg1}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                            View Photo
                          </span>
                        </div>
                      </button>
                    )}
                    <RichHtml html={c.introduction} className="text-lg leading-relaxed" />
                    <div className="clear-both" />
                  </div>
                </section>
              )}

              {/* Achievements */}
              {hasAchiev && (
                <section id="achievements">
                  <SectionHeading id="achievements" icon="TrophyIcon">
                    Achievements
                  </SectionHeading>
                  {c.achievements!.map((a, i) => (
                    <RichHtml key={i} html={a} />
                  ))}
                </section>
              )}

              {/* Notable Works */}
              {hasWorks && (
                <section id="works">
                  <SectionHeading id="works">Notable Works</SectionHeading>
                  <div className="flex flex-wrap gap-2.5">
                    {c.works!.map((w, i) => (
                      <span
                        key={i}
                        className="glass-card px-4 py-2 rounded-full text-sm text-neutral-300 border border-white/5"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">

              {profileImg ? (
                <button
                  onClick={() => openLightbox(profileImg)}
                  className="w-full overflow-hidden rounded-2xl group relative ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl"
                  style={{ aspectRatio: '3/4' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileImg}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
                </button>
              ) : (
                <div className="w-full aspect-[3/4] bg-card flex items-center justify-center rounded-2xl">
                  <Icon name="UserCircleIcon" size={56} className="text-neutral-600" />
                </div>
              )}

              {/* Personal Info */}
              <div className="glass-card rounded-2xl p-5 border border-white/5">
                <h3 className="font-playfair text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-primary inline-block" />
                  Personal Info
                </h3>
                <InfoRow label="Full Name" value={c.name} />
                <InfoRow label="Born" value={formatDate(c.born)} />
                <InfoRow label="Birthplace" value={c.birthPlace} />
                <InfoRow label="Nationality" value={c.nationality} />
                {(c.citizenship?.length ?? 0) > 0 && (
                  <InfoRow label="Citizenship" value={c.citizenship!.join(', ')} />
                )}
                <InfoRow label="Age" value={c.age} />
                <InfoRow label="Years Active" value={c.yearsActive} />
                <InfoRow label="Height" value={c.height} />
                <InfoRow label="Weight" value={c.weight} />
                {bodyMeas && <InfoRow label="Measurements" value={bodyMeas} />}
                <InfoRow label="Eye Color" value={c.eyeColor} />
                <InfoRow label="Hair Color" value={c.hairColor} />
                {c.netWorth && <InfoRow label="Net Worth" value={c.netWorth} highlight />}
                {c.died && <InfoRow label="Died" value={formatDate(c.died)} />}
                {/* Social links (moved from hero) */}
                {c.socialMedia && (
                  <div className="mt-4">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Social</p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {c.socialMedia.instagram && (
                        <SocialBtn href={c.socialMedia.instagram} platform="instagram" label="Instagram" />
                      )}
                      {c.socialMedia.twitter && (
                        <SocialBtn href={c.socialMedia.twitter} platform="twitter" label="Twitter/X" />
                      )}
                      {c.socialMedia.facebook && (
                        <SocialBtn href={c.socialMedia.facebook} platform="facebook" label="Facebook" />
                      )}
                      {c.socialMedia.youtube && (
                        <SocialBtn href={c.socialMedia.youtube} platform="youtube" label="YouTube" />
                      )}
                      {c.socialMedia.tiktok && (
                        <SocialBtn href={c.socialMedia.tiktok} platform="tiktok" label="TikTok" />
                      )}
                      {c.socialMedia.threads && (
                        <SocialBtn href={c.socialMedia.threads} platform="threads" label="Threads" />
                      )}
                      {c.socialMedia.imdb && (
                        <SocialBtn href={c.socialMedia.imdb} platform="imdb" label="IMDb" />
                      )}
                      {c.socialMedia.wikipedia && (
                        <SocialBtn href={c.socialMedia.wikipedia} platform="wikipedia" label="Wikipedia" />
                      )}
                      {c.socialMedia.website && (
                        <SocialBtn href={c.socialMedia.website} platform="website" label="Website" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Family */}
              {hasFamily && (
                <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                  <h3 className="font-playfair text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-primary inline-block" />
                    Family
                  </h3>
                  {c.spouse && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                        Spouse
                      </p>
                      <p className="text-sm text-neutral-300">{c.spouse}</p>
                    </div>
                  )}
                  {(c.marriages?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">
                        Marriages
                      </p>
                      <div className="space-y-2">
                        {c.marriages!.map((m, i) => (
                          <div key={i} className="text-sm text-neutral-300 flex flex-wrap gap-x-2">
                            {m.name && (
                              <span className="font-medium text-white">{m.name}</span>
                            )}
                            {m.marriedYear && (
                              <span className="text-neutral-500">m. {m.marriedYear}</span>
                            )}
                            {m.currentlyMarried ? (
                              <span className="text-emerald-400 text-xs">Present</span>
                            ) : m.divorcedYear ? (
                              <span className="text-neutral-500">div. {m.divorcedYear}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(c.parents?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                        Parents
                      </p>
                      {c.parents!.map((p, i) => (
                        <p key={i} className="text-sm text-neutral-300">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}
                  {(c.siblings?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                        Siblings
                      </p>
                      {c.siblings!.map((s, i) => (
                        <p key={i} className="text-sm text-neutral-300">
                          {s}
                        </p>
                      ))}
                    </div>
                  )}
                  {(c.children?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                        Children
                      </p>
                      {c.children!.map((ch, i) => (
                        <p key={i} className="text-sm text-neutral-300">
                          {ch}
                        </p>
                      ))}
                    </div>
                  )}
                  {(c.relatives?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                        Relatives
                      </p>
                      {c.relatives!.map((r, i) => (
                        <p key={i} className="text-sm text-neutral-300">
                          {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Education */}
              {hasEducation && (
                <div className="glass-card rounded-2xl p-5 border border-white/5">
                  <h3 className="font-playfair text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-primary inline-block" />
                    Education
                  </h3>
                  <div className="space-y-2">
                    {c.education!.map((e, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Icon
                          name="AcademicCapIcon"
                          size={14}
                          className="text-primary mt-0.5 flex-shrink-0"
                        />
                        <p className="text-sm text-neutral-300 leading-relaxed">{e}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Biography */}
          {hasBio && (
            <div className="space-y-14">
              {c.earlyLife && (
                <section id="early-life">
                  <SectionHeading id="early-life">Early Life</SectionHeading>
                  <div>
                    {inlineImg2 && (
                      <button
                        onClick={() => openLightbox(inlineImg2)}
                        className="float-right ml-6 mb-4 w-44 md:w-60 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group relative"
                        style={{ aspectRatio: '3/4' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inlineImg2}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                            View Photo
                          </span>
                        </div>
                      </button>
                    )}
                    <RichHtml html={c.earlyLife} className="text-lg leading-relaxed" />
                    <div className="clear-both" />
                  </div>
                </section>
              )}

              {c.career && (
                <section id="career">
                  <SectionHeading id="career">Career</SectionHeading>
                  <div>
                    {inlineImg4 && (
                      <button
                        onClick={() => openLightbox(inlineImg4)}
                        className="float-left mr-6 mb-4 w-44 md:w-60 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group relative"
                        style={{ aspectRatio: '3/4' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inlineImg4}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                            View Photo
                          </span>
                        </div>
                      </button>
                    )}
                    <RichHtml html={c.career} className="text-lg leading-relaxed" />
                    <div className="clear-both" />
                  </div>
                </section>
              )}

              {c.personalLife && (
                <section id="personal-life">
                  <SectionHeading id="personal-life">Personal Life</SectionHeading>
                  <div>
                    {inlineImg3 && (
                      <button
                        onClick={() => openLightbox(inlineImg3)}
                        className="float-right ml-6 mb-4 w-44 md:w-60 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group relative"
                        style={{ aspectRatio: '3/4' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inlineImg3}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                            View Photo
                          </span>
                        </div>
                      </button>
                    )}
                    <RichHtml html={c.personalLife} className="text-lg leading-relaxed" />
                    <div className="clear-both" />
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Trivia */}
          {hasTrivia && (
            <section id="trivia">
              <SectionHeading id="trivia" icon="LightBulbIcon">
                Did You Know?
              </SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.trivia!.map((t, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-5 flex gap-3 border border-white/5 hover:border-primary/20 transition-colors"
                  >
                    <Icon
                      name="LightBulbIcon"
                      size={18}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    <p className="text-neutral-300 text-sm leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Extra gallery strip */}
          {stripImgs.length > 0 && (
            <div className="-mx-6 md:-mx-16 overflow-x-auto">
              <div className="flex gap-3 px-6 md:px-16 pb-2">
                {stripImgs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(img)}
                    className="flex-shrink-0 rounded-2xl overflow-hidden group border border-white/5 hover:border-primary/40 transition-all shadow-lg relative"
                    style={{ width: 220, aspectRatio: '4/5' }}
                    aria-label={`View photo of ${c.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${c.name} — photo`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                        Expand
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Philanthropy */}
          {hasPhilanthr && (
            <section id="philanthropy">
              <SectionHeading id="philanthropy" icon="HeartIcon">
                Philanthropy
              </SectionHeading>
              <ul className="space-y-3 max-w-4xl">
                {c.philanthropy!.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-300">
                    <Icon
                      name="HeartIcon"
                      size={16}
                      className="text-pink-400 mt-0.5 flex-shrink-0"
                    />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Controversies */}
          {hasControversy && (
            <section id="controversies">
              <SectionHeading id="controversies" icon="ExclamationTriangleIcon">
                Controversies
              </SectionHeading>
              <div>
                {inlineImg5 && (
                  <button
                    onClick={() => openLightbox(inlineImg5)}
                    className="float-right ml-6 mb-4 w-44 md:w-60 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group relative"
                    style={{ aspectRatio: '3/4' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inlineImg5}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                        View Photo
                      </span>
                    </div>
                  </button>
                )}
                <div className="space-y-3">
                  {c.controversies!.map((con, i) => (
                    <div key={i} className="text-neutral-300 text-sm leading-relaxed">
                      <RichHtml html={con} />
                      {i < c.controversies!.length - 1 && (
                        <div className="mt-3 border-b border-white/[0.06]" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="clear-both" />
              </div>
            </section>
          )}

          {/* Quotes */}
          {hasQuotes && (
            <section id="quotes">
              <SectionHeading id="quotes" icon="ChatBubbleBottomCenterTextIcon">
                Quotes
              </SectionHeading>
              <div className="glass-card rounded-3xl p-10 mb-8 relative overflow-hidden border border-primary/10">
                <div className="absolute top-4 left-6 font-playfair text-9xl text-primary/8 leading-none select-none pointer-events-none">
                  &ldquo;
                </div>
                <p className="font-playfair text-xl md:text-2xl text-white leading-relaxed italic relative z-10 text-center max-w-3xl mx-auto">
                  {c.quotes![activeQuote]}
                </p>
                {c.quotes!.length > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {c.quotes!.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveQuote(i)}
                        className={`rounded-full transition-all duration-300 ${i === activeQuote
                            ? 'bg-primary w-6 h-2'
                            : 'bg-neutral-600 hover:bg-neutral-500 w-2 h-2'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                {c.quotes!.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveQuote(i)}
                    className={`w-full text-left glass-card rounded-xl p-5 break-inside-avoid transition-all border ${i === activeQuote
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-white/5 hover:border-white/15'
                      }`}
                  >
                    <p className="text-neutral-300 text-sm leading-relaxed italic">
                      &ldquo;{q}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ═══════════ FILMOGRAPHY ═══════════ */}
      {hasFilms && (
        <div className={`max-w-7xl mx-auto px-6 md:px-16 mt-20${!hasWebSeries && !hasTvShows && !hasAwards && !hasGallery ? ' pb-32' : ''}`}>
          <SectionHeading icon="FilmIcon">Filmography</SectionHeading>
          <p className="text-sm text-neutral-500 mb-6 -mt-2">
            {c.movies!.length} film{c.movies!.length !== 1 ? 's' : ''}
          </p>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 w-16">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Director</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Genre</th>
                </tr>
              </thead>
              <tbody>
                {[...c.movies!]
                  .sort((a, b) => Number(b.year) - Number(a.year))
                  .map((movie, i) => {
                    const movieKey = movie._id || String(i);
                    const isExpanded = expandedMovieId === movieKey;
                    return (
                      <React.Fragment key={movieKey}>
                        <tr className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3 align-top text-neutral-500 whitespace-nowrap tabular-nums">
                            {movie.year || '—'}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className="font-medium text-white">{movie.name}</span>
                            {movie.role && (
                              <span className="sm:hidden block mt-0.5 text-xs text-neutral-400">{movie.role}</span>
                            )}
                            {movie.description && (
                              <button
                                onClick={() => setExpandedMovieId(isExpanded ? null : movieKey)}
                                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
                              >
                                {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-neutral-300 hidden sm:table-cell">
                            {movie.role || <span className="text-neutral-600">—</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden md:table-cell">
                            {movie.director || <span className="text-neutral-600">—</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden lg:table-cell">
                            {movie.genre || <span className="text-neutral-600">—</span>}
                          </td>
                        </tr>
                        {isExpanded && movie.description && (
                          <tr className="border-b border-white/[0.06]">
                            <td colSpan={5} className="px-4 py-3 text-sm text-neutral-400 leading-relaxed bg-white/[0.02]">
                              {movie.description}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ WEB SERIES ═══════════ */}
      {hasWebSeries && (
        <div className={`max-w-7xl mx-auto px-6 md:px-16 mt-20${!hasTvShows && !hasAwards && !hasGallery ? ' pb-32' : ''}`}>
          <SectionHeading icon="TvIcon">Web Series</SectionHeading>
          <p className="text-sm text-neutral-500 mb-6 -mt-2">
            {c.webSeries!.length} series
          </p>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 w-16">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Seasons</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Genre</th>
                </tr>
              </thead>
              <tbody>
                {[...c.webSeries!]
                  .sort((a, b) => Number(b.year) - Number(a.year))
                  .map((ws, i) => {
                    const wsKey = ws._id || `ws-${i}`;
                    const isExpanded = expandedMovieId === wsKey;
                    return (
                      <React.Fragment key={wsKey}>
                        <tr className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3 align-top text-neutral-500 whitespace-nowrap tabular-nums">{ws.year || '—'}</td>
                          <td className="px-4 py-3 align-top">
                            <span className="font-medium text-white">{ws.name}</span>
                            {ws.role && <span className="sm:hidden block mt-0.5 text-xs text-neutral-400">{ws.role}</span>}
                            {ws.description && (
                              <button
                                onClick={() => setExpandedMovieId(isExpanded ? null : wsKey)}
                                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
                              >
                                {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-neutral-300 hidden sm:table-cell">{ws.role || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden md:table-cell">{ws.platform || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden lg:table-cell">{ws.seasons || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden lg:table-cell">{ws.genre || <span className="text-neutral-600">—</span>}</td>
                        </tr>
                        {isExpanded && ws.description && (
                          <tr className="border-b border-white/[0.06]">
                            <td colSpan={6} className="px-4 py-3 text-sm text-neutral-400 leading-relaxed bg-white/[0.02]">
                              {ws.description}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ TV SHOWS ═══════════ */}
      {hasTvShows && (
        <div className={`max-w-7xl mx-auto px-6 md:px-16 mt-20${!hasAwards && !hasGallery ? ' pb-32' : ''}`}>
          <SectionHeading icon="PlayCircleIcon">TV Shows</SectionHeading>
          <p className="text-sm text-neutral-500 mb-6 -mt-2">
            {c.tvShows!.length} show{c.tvShows!.length !== 1 ? 's' : ''}
          </p>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 w-16">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Seasons</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Genre</th>
                </tr>
              </thead>
              <tbody>
                {[...c.tvShows!]
                  .sort((a, b) => Number(b.year) - Number(a.year))
                  .map((tv, i) => {
                    const tvKey = tv._id || `tv-${i}`;
                    const isExpanded = expandedMovieId === tvKey;
                    return (
                      <React.Fragment key={tvKey}>
                        <tr className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3 align-top text-neutral-500 whitespace-nowrap tabular-nums">{tv.year || '—'}</td>
                          <td className="px-4 py-3 align-top">
                            <span className="font-medium text-white">{tv.name}</span>
                            {tv.role && <span className="sm:hidden block mt-0.5 text-xs text-neutral-400">{tv.role}</span>}
                            {tv.description && (
                              <button
                                onClick={() => setExpandedMovieId(isExpanded ? null : tvKey)}
                                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
                              >
                                {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-neutral-300 hidden sm:table-cell">{tv.role || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden md:table-cell">{tv.channel || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden lg:table-cell">{tv.seasons || <span className="text-neutral-600">—</span>}</td>
                          <td className="px-4 py-3 align-top text-neutral-400 hidden lg:table-cell">{tv.genre || <span className="text-neutral-600">—</span>}</td>
                        </tr>
                        {isExpanded && tv.description && (
                          <tr className="border-b border-white/[0.06]">
                            <td colSpan={6} className="px-4 py-3 text-sm text-neutral-400 leading-relaxed bg-white/[0.02]">
                              {tv.description}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ AWARDS ═══════════ */}
      {hasAwards && (
        <div className={`max-w-7xl mx-auto px-6 md:px-16 mt-20 space-y-10${!hasGallery ? ' pb-32' : ''}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <SectionHeading icon="TrophyIcon">Awards &amp; Nominations</SectionHeading>
            {/* Summary pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-neutral-300">
                <Icon name="TrophyIcon" size={12} className="text-primary" />
                {c.awards!.length} total
              </span>
              {winnerAwards.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Icon name="CheckCircleIcon" size={12} />
                  {winnerAwards.length} win{winnerAwards.length !== 1 ? 's' : ''}
                </span>
              )}
              {nomineeAwards.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Icon name="StarIcon" size={12} />
                  {nomineeAwards.length} nomination{nomineeAwards.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <TableWrapper>
            <thead>
              <tr>
                <Th className="w-16">Year</Th>
                <Th>Award</Th>
                <Th className="hidden sm:table-cell">Category</Th>
                <Th className="hidden md:table-cell">Organisation</Th>
                <Th className="hidden lg:table-cell">For Work</Th>
                <Th className="w-24 text-center">Result</Th>
              </tr>
            </thead>
            <tbody>
              {[...c.awards!]
                .sort((a, b) => {
                  // Winners first, then sort by year desc
                  const aWin = /winner/i.test(a.category) ? 0 : 1;
                  const bWin = /winner/i.test(b.category) ? 0 : 1;
                  if (aWin !== bWin) return aWin - bWin;
                  return Number(b.year) - Number(a.year);
                })
                .map((award, i, arr) => {
                  const isWinner = /winner/i.test(award.category);
                  // Insert a visual divider row between wins and nominations
                  const prevIsWinner = i > 0 && /winner/i.test(arr[i - 1].category);
                  const showDivider = !isWinner && (i === 0 || prevIsWinner);
                  return (
                    <React.Fragment key={award._id || i}>
                      {showDivider && nomineeAwards.length > 0 && winnerAwards.length > 0 && (
                        <tr key={`divider-${i}`}>
                          <td
                            colSpan={6}
                            className="px-4 py-2 text-[10px] uppercase tracking-widest text-amber-400/70 bg-amber-500/5 border-y border-amber-500/10 font-semibold"
                          >
                            Nominations
                          </td>
                        </tr>
                      )}
                      <tr
                        key={award._id || i}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        <Td className="font-mono text-neutral-500 whitespace-nowrap">{award.year}</Td>
                        <Td>
                          <span className="font-semibold text-white">{award.title}</span>
                          {award.description && (
                            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed line-clamp-2 hidden sm:block">
                              {award.description}
                            </p>
                          )}
                        </Td>
                        <Td className="hidden sm:table-cell text-neutral-400">
                          {award.category || <span className="text-neutral-600">—</span>}
                        </Td>
                        <Td className="hidden md:table-cell text-neutral-400">
                          {award.organization || <span className="text-neutral-600">—</span>}
                        </Td>
                        <Td className="hidden lg:table-cell text-neutral-500 italic text-xs">
                          {award.work && award.work !== '--'
                            ? award.work
                            : <span className="text-neutral-600">—</span>}
                        </Td>
                        <Td className="text-center">
                          {isWinner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                              <Icon name="CheckCircleIcon" size={11} />
                              Won
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                              <Icon name="StarIcon" size={11} />
                              Nominated
                            </span>
                          )}
                        </Td>
                      </tr>
                    </React.Fragment>
                  );
                })}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* ═══════════ GALLERY ═══════════ */}
      {hasGallery && (
        <div className="max-w-7xl mx-auto px-6 md:px-16 mt-20 pb-32">
          <SectionHeading icon="PhotoIcon">Photo Gallery</SectionHeading>
          <p className="text-sm text-neutral-500 mb-8 -mt-2">
            {galleryOnly.length} photo{galleryOnly.length !== 1 ? 's' : ''}
          </p>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {[...(profileImg ? [profileImg] : []), ...galleryOnly]
              .filter(Boolean)
              .map((img, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(img)}
                  className="w-full break-inside-avoid rounded-xl overflow-hidden group border border-white/5 hover:border-primary/40 transition-all shadow-md block"
                  aria-label={`View photo ${i + 1} of ${c.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${c.name} — photo ${i + 1}`}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightboxImg &&
        (() => {
          const allImgs = [c.profileImage, ...(c.galleryImages ?? [])].filter(
            Boolean,
          ) as string[];
          const total = allImgs.length;
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Photo lightbox"
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setLightboxImg(null)}
            >
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-6 right-6 glass-card p-2 rounded-full text-white hover:text-primary transition-colors z-10"
                aria-label="Close lightbox"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
              {total > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prev = (lightboxIdx - 1 + total) % total;
                      setLightboxIdx(prev);
                      setLightboxImg(allImgs[prev]);
                    }}
                    className="absolute left-4 glass-card p-3 rounded-full text-white hover:text-primary transition-colors z-10"
                    aria-label="Previous photo"
                  >
                    <Icon name="ChevronLeftIcon" size={22} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = (lightboxIdx + 1) % total;
                      setLightboxIdx(next);
                      setLightboxImg(allImgs[next]);
                    }}
                    className="absolute right-4 glass-card p-3 rounded-full text-white hover:text-primary transition-colors z-10"
                    aria-label="Next photo"
                  >
                    <Icon name="ChevronRightIcon" size={22} />
                  </button>
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-400 text-sm glass-card px-4 py-1.5 rounded-full">
                    {lightboxIdx + 1} / {total}
                  </span>
                </>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImg}
                alt={c.name}
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })()}
    </article>
  );
}
