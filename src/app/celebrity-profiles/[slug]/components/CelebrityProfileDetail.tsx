"use client";

import { useEffect, useState } from 'react';
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

interface SocialMedia {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
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
  eyeColor?: string;
  hairColor?: string;
  spouse?: string;
  children?: string[];
  parents?: string[];
  siblings?: string[];
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
  nationality_display?: string;
  likes?: string[];
}

// ── Strip HTML tags and decode basic HTML entities ────────────────────────────
function stripHtml(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionHeading({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-5 flex items-center gap-3">
      <span className="w-1 h-8 rounded-full bg-primary inline-block flex-shrink-0" />
      {icon && <Icon name={icon as never} size={22} className="text-primary" />}
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-neutral-500 uppercase tracking-wider flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-neutral-200 text-right">{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CelebrityProfileDetail({ celebrity: c }: { celebrity: FullCelebrity }) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [activeQuote, setActiveQuote] = useState(0);

  // Follow state
  const [following, setFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followChecked, setFollowChecked] = useState(false);

  // Like state — seed count from server-rendered prop immediately
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState((c.likes ?? []).length);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeChecked, setLikeChecked] = useState(false);

  // Check follow / like state — count fetched for everyone, user status only when logged in
  useEffect(() => {
    // Always fetch the total like count (no auth required)
    fetch(`/api/user/celebrities/like-status/${c.slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setLikeCount(json.count);
      })
      .catch(() => {});

    if (!user) {
      setFollowChecked(true);
      setLikeChecked(true);
      return;
    }

    // Logged-in: get personal like + follow status
    fetch(`/api/user/celebrities/like-status/${c.slug}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setLiked(json.liked);
          setLikeCount(json.count);
        }
      })
      .catch(() => {})
      .finally(() => setLikeChecked(true));

    fetch('/api/user/celebrities/following', { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setFollowing(json.celebrities.some((cel: any) => cel.slug === c.slug));
        }
      })
      .catch(() => {})
      .finally(() => setFollowChecked(true));
  }, [user]); // eslint-disable-line

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) { router.push(`/login?redirect=/celebrity-profiles/${c.slug}`); return; }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res  = await fetch('/api/user/celebrities/follow', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ celebrityId: c.id }),
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
    if (!user) { router.push(`/login?redirect=/celebrity-profiles/${c.slug}`); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res  = await fetch('/api/user/celebrities/like', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ celebrityId: c.id }),
      });
      const json = await res.json();
      if (json.success) {
        setLiked(json.liked);
        setLikeCount(json.count);
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const coverImg   = c.coverImage   || c.profileImage || '';
  const profileImg = c.profileImage || c.coverImage   || '';
  const profession = c.occupation?.join(' · ') || '';

  const allImages = [
    ...(profileImg ? [profileImg] : []),
    ...(c.galleryImages || []),
  ].filter(Boolean);

  // ── Clean text fields ───────────────────────────────────────────────────────
  const intro       = stripHtml(c.introduction);
  const earlyLife   = stripHtml(c.earlyLife);
  const career      = stripHtml(c.career);
  const personalLife = stripHtml(c.personalLife);

  const hasFilms      = (c.movies?.length ?? 0) > 0;
  const hasQuotes     = (c.quotes?.length ?? 0) > 0;
  const hasBio        = earlyLife || career || personalLife;
  const hasFamily     = (c.parents?.length ?? 0) > 0 || (c.children?.length ?? 0) > 0 || (c.siblings?.length ?? 0) > 0;
  const hasPhilanthr  = (c.philanthropy?.length ?? 0) > 0;
  const hasControversy = (c.controversies?.length ?? 0) > 0;
  const hasTrivia     = (c.trivia?.length ?? 0) > 0;
  const hasAchiev     = (c.achievements?.length ?? 0) > 0;
  const hasWorks      = (c.works?.length ?? 0) > 0;
  const hasEducation  = (c.education?.length ?? 0) > 0;

  // Distribute gallery images across the page
  // allImages[0] is always the profile image — skip it for inline placement
  const galleryOnly = c.galleryImages?.filter(Boolean) || [];
  const inlineImg1  = galleryOnly[0] || null;  // floated beside intro
  const inlineImg2  = galleryOnly[1] || null;  // floated beside early life
  const inlineImg3  = galleryOnly[2] || null;  // floated beside personalLife
  const stripImgs   = galleryOnly.slice(3);    // horizontal strip between trivia & filmography

  return (
    <article className="pt-20">

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImg}
            alt={c.name}
            className="w-full h-full object-cover object-top scale-105 pointer-events-none"
            style={{ filter: 'brightness(0.7)' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-background" />
        )}

        {/* Layered gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent pointer-events-none" />

        {/* Back button */}
        <div className="absolute top-6 left-6 md:left-10">
          <Link
            href="/celebrity-profiles"
            className="flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm text-neutral-300 hover:text-white transition-colors backdrop-blur-md"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            <span>Celebrity Profiles</span>
          </Link>
        </div>

        {/* Social links + Follow + Like — top right */}
        <div className="absolute top-6 right-6 md:right-10 flex items-center gap-2 z-10">
          {/* Like button — always visible, count seeded from prop */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-semibold backdrop-blur-md transition-all ${
              liked
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'glass-card text-neutral-300 hover:bg-rose-500/20 hover:text-rose-300 border border-white/20'
            }`}
            title={liked ? 'Unlike' : 'Like'}
          >
            {likeLoading
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Icon name="HeartIcon" size={15} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
            }
            <span className="text-xs">{likeCount > 0 ? likeCount : ''}</span>
          </button>

          {/* Follow button */}
          {followChecked && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold backdrop-blur-md transition-all ${
                following
                  ? 'bg-primary text-black hover:bg-primary/80'
                  : 'glass-card text-white hover:bg-white/10 border border-white/20'
              }`}
            >
              {followLoading
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Icon name={following ? 'HeartIcon' : 'HeartIcon'} size={16} className={following ? 'fill-black' : ''} />
              }
              {following ? 'Following' : 'Follow'}
            </button>
          )}

          {c.socialMedia && (
            <>
              {c.socialMedia.instagram && (
                <a href={c.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                  className="glass-card p-2.5 rounded-full text-neutral-400 hover:text-pink-400 transition-all backdrop-blur-md">
                  <Icon name="CameraIcon" size={17} />
                </a>
              )}
              {c.socialMedia.twitter && (
                <a href={c.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                  className="glass-card p-2.5 rounded-full text-neutral-400 hover:text-sky-400 transition-all backdrop-blur-md">
                  <Icon name="ChatBubbleLeftEllipsisIcon" size={17} />
                </a>
              )}
              {c.socialMedia.youtube && (
                <a href={c.socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                  className="glass-card p-2.5 rounded-full text-neutral-400 hover:text-red-400 transition-all backdrop-blur-md">
                  <Icon name="PlayCircleIcon" size={17} />
                </a>
              )}
              {c.socialMedia.website && (
                <a href={c.socialMedia.website} target="_blank" rel="noopener noreferrer"
                  className="glass-card p-2.5 rounded-full text-neutral-400 hover:text-emerald-400 transition-all backdrop-blur-md">
                  <Icon name="GlobeAltIcon" size={17} />
                </a>
              )}
            </>
          )}
        </div>

        {/* Hero content — anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 md:px-16">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-primary/40 shadow-2xl">
                {profileImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImg} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <Icon name="UserCircleIcon" size={56} className="text-neutral-600" />
                  </div>
                )}
              </div>
              {c.isVerified && (
                <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 ring-2 ring-background">
                  <Icon name="CheckBadgeIcon" size={14} className="text-white" />
                </span>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {c.isFeatured && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-primary text-black uppercase">
                    Featured
                  </span>
                )}
                {c.categories?.slice(0, 3).map((cat) => (
                  <span key={cat} className="px-3 py-0.5 rounded-full text-[10px] glass-card text-neutral-400 capitalize backdrop-blur-md">
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight break-words">
                {c.name}
              </h1>
              {profession && (
                <p className="font-montserrat text-primary text-base md:text-lg mt-1.5 tracking-wide">{profession}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-neutral-400 text-sm">
                {c.nationality && (
                  <>
                    <span className="flex items-center gap-1">
                      <Icon name="GlobeAltIcon" size={13} />
                      {c.nationality}
                    </span>
                    <span className="text-neutral-600">·</span>
                  </>
                )}
                {c.born && <span>Born {c.born}</span>}
                {c.age && <><span className="text-neutral-600">·</span><span>Age {c.age}</span></>}
                {c.died && <><span className="text-neutral-600">·</span><span className="text-neutral-500">d. {c.died}</span></>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-Stats Strip ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 -mt-5 relative z-10">
          {c.netWorth && (
            <div className="glass-card rounded-xl px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Net Worth</p>
              <p className="text-sm font-semibold text-primary truncate">{c.netWorth}</p>
            </div>
          )}
          {c.yearsActive && (
            <div className="glass-card rounded-xl px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Years Active</p>
              <p className="text-sm font-semibold text-white truncate">{c.yearsActive}</p>
            </div>
          )}
          {c.height && (
            <div className="glass-card rounded-xl px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Height</p>
              <p className="text-sm font-semibold text-white truncate">{c.height}</p>
            </div>
          )}
          {c.eyeColor && (
            <div className="glass-card rounded-xl px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Eye Color</p>
              <p className="text-sm font-semibold text-white truncate">{c.eyeColor}</p>
            </div>
          )}
          {hasFilms && (
            <div className="glass-card rounded-xl px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Films</p>
              <p className="text-sm font-semibold text-white">{c.movies!.length} films</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pb-32 mt-14 space-y-20">

        {/* Introduction + Personal Info sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left — introduction */}
          <div className="lg:col-span-2 space-y-10">
            {intro && (
              <section>
                <SectionHeading>Introduction</SectionHeading>
                {/* Inline image 1 — floated right beside intro text */}
                {inlineImg1 && (
                  <button
                    onClick={() => setLightboxImg(inlineImg1)}
                    className="float-right ml-6 mb-4 w-40 md:w-56 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inlineImg1}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <p className="text-neutral-300 leading-relaxed text-lg whitespace-pre-line">{intro}</p>
                <div className="clear-both" />
              </section>
            )}

            {hasAchiev && (
              <section>
                <SectionHeading>Achievements</SectionHeading>
                <ul className="space-y-3">
                  {c.achievements!.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-300">
                      <Icon name="TrophyIcon" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{stripHtml(a)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasWorks && (
              <section>
                <SectionHeading>Notable Works</SectionHeading>
                <div className="flex flex-wrap gap-2.5">
                  {c.works!.map((w, i) => (
                    <span key={i} className="glass-card px-4 py-2 rounded-full text-sm text-neutral-300 border border-white/5">
                      {stripHtml(w)}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right — personal info sidebar */}
          <aside className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-playfair text-lg font-bold text-white mb-1">Personal Info</h3>
              <div className="mt-2">
                <InfoRow label="Born"         value={c.born} />
                <InfoRow label="Birthplace"   value={c.birthPlace} />
                <InfoRow label="Nationality"  value={c.nationality} />
                <InfoRow label="Height"       value={c.height} />
                <InfoRow label="Weight"       value={c.weight} />
                <InfoRow label="Eye Color"    value={c.eyeColor} />
                <InfoRow label="Hair Color"   value={c.hairColor} />
                <InfoRow label="Spouse"       value={c.spouse} />
                <InfoRow label="Net Worth"    value={c.netWorth} />
                <InfoRow label="Years Active" value={c.yearsActive} />
              </div>
            </div>

            {hasFamily && (
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="font-playfair text-lg font-bold text-white">Family</h3>
                {(c.parents?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Parents</p>
                    {c.parents!.map((p, i) => <p key={i} className="text-sm text-neutral-300 leading-relaxed">{p}</p>)}
                  </div>
                )}
                {(c.siblings?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Siblings</p>
                    {c.siblings!.map((p, i) => <p key={i} className="text-sm text-neutral-300 leading-relaxed">{p}</p>)}
                  </div>
                )}
                {(c.children?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Children</p>
                    {c.children!.map((p, i) => <p key={i} className="text-sm text-neutral-300 leading-relaxed">{p}</p>)}
                  </div>
                )}
              </div>
            )}

            {hasEducation && (
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                <h3 className="font-playfair text-lg font-bold text-white">Education</h3>
                {c.education!.map((e, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon name="AcademicCapIcon" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-300 leading-relaxed">{e}</p>
                  </div>
                ))}
              </div>
            )}

            {(c.tags?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {c.tags!.map((tag, i) => (
                    <span key={i} className="glass-card px-3 py-1 rounded-full text-xs text-neutral-400 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Biography ─────────────────────────────────────────────────── */}
        {hasBio && (
          <div className="space-y-12">
            {earlyLife && (
              <section>
                <SectionHeading>Early Life</SectionHeading>
                {/* Inline image 2 — floated right beside early life text */}
                {inlineImg2 && (
                  <button
                    onClick={() => setLightboxImg(inlineImg2)}
                    className="float-right ml-6 mb-4 w-40 md:w-56 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inlineImg2}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <p className="text-neutral-300 leading-relaxed text-base whitespace-pre-line max-w-4xl">{earlyLife}</p>
                <div className="clear-both" />
              </section>
            )}

            {career && (
              <section>
                <SectionHeading>Career</SectionHeading>
                <p className="text-neutral-300 leading-relaxed text-base whitespace-pre-line max-w-4xl">{career}</p>
              </section>
            )}

            {personalLife && (
              <section>
                <SectionHeading>Personal Life</SectionHeading>
                {/* Inline image 3 — floated left beside personal life */}
                {inlineImg3 && (
                  <button
                    onClick={() => setLightboxImg(inlineImg3)}
                    className="float-left mr-6 mb-4 w-40 md:w-64 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all shadow-2xl group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inlineImg3}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </button>
                )}
                <p className="text-neutral-300 leading-relaxed text-base whitespace-pre-line max-w-4xl">{personalLife}</p>
                <div className="clear-both" />
              </section>
            )}
          </div>
        )}

        {/* ── Trivia ────────────────────────────────────────────────────── */}
        {hasTrivia && (
          <section>
            <SectionHeading>Did You Know?</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.trivia!.map((t, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 flex gap-3 border border-white/5 hover:border-primary/20 transition-colors">
                  <Icon name="LightBulbIcon" size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-300 text-sm leading-relaxed">{stripHtml(t)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Inline photo strip (remaining gallery images) ─────────── */}
        {stripImgs.length > 0 && (
          <div className="-mx-6 md:-mx-16 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-6 md:px-16 pb-2">
              {stripImgs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxImg(img)}
                  className="flex-shrink-0 w-52 h-36 md:w-72 md:h-48 rounded-2xl overflow-hidden group border border-white/5 hover:border-primary/40 transition-all shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${c.name} — photo`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Filmography ───────────────────────────────────────────────── */}
        {hasFilms && (
          <section>
            <SectionHeading>Filmography</SectionHeading>
            <p className="text-sm text-neutral-500 mb-6 -mt-2">
              {c.movies!.length} film{c.movies!.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-4">
              {c.movies!.map((movie, i) => (
                <div key={movie._id || i}
                  className="glass-card rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-5 hover:border-primary/25 border border-white/5 transition-colors group">
                  <div className="flex-shrink-0 md:w-20 text-center">
                    <span className="font-playfair text-3xl font-bold text-primary/30 group-hover:text-primary/60 transition-colors">
                      {movie.year}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="font-playfair text-xl font-bold text-white">{movie.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {movie.genre && <span className="px-2.5 py-1 rounded-full text-xs glass-card text-neutral-400">{movie.genre}</span>}
                        {movie.role && <span className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{movie.role}</span>}
                      </div>
                    </div>
                    {movie.director && (
                      <p className="text-sm text-neutral-500 mb-2">
                        Dir. <span className="text-neutral-400">{movie.director}</span>
                      </p>
                    )}
                    {movie.description && (
                      <p className="text-sm text-neutral-400 leading-relaxed">{stripHtml(movie.description)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Philanthropy ──────────────────────────────────────────────── */}
        {hasPhilanthr && (
          <section>
            <SectionHeading>Philanthropy</SectionHeading>
            <ul className="space-y-3 max-w-4xl">
              {c.philanthropy!.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <Icon name="HeartIcon" size={16} className="text-pink-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{stripHtml(p)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Controversies ─────────────────────────────────────────────── */}
        {hasControversy && (
          <section>
            <SectionHeading>Controversies</SectionHeading>
            <div className="space-y-4 max-w-4xl">
              {c.controversies!.map((con, i) => (
                <div key={i} className="glass-card rounded-xl p-5 border-l-2 border-amber-500/50 border border-white/5">
                  <p className="text-neutral-300 leading-relaxed">{stripHtml(con)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Quotes ────────────────────────────────────────────────────── */}
        {hasQuotes && (
          <section>
            <SectionHeading>Quotes</SectionHeading>

            {/* Featured rotating quote */}
            <div className="glass-card rounded-3xl p-10 mb-8 relative overflow-hidden border border-primary/10">
              <div className="absolute top-4 left-6 font-playfair text-9xl text-primary/8 leading-none select-none pointer-events-none">
                &ldquo;
              </div>
              <p className="font-playfair text-xl md:text-2xl text-white leading-relaxed italic relative z-10 text-center max-w-3xl mx-auto">
                {c.quotes![activeQuote]}
              </p>
              <div className="flex justify-center gap-2 mt-8">
                {c.quotes!.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveQuote(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeQuote ? 'bg-primary w-6 h-2' : 'bg-neutral-600 hover:bg-neutral-500 w-2 h-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* All quotes list */}
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {c.quotes!.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQuote(i)}
                  className={`w-full text-left glass-card rounded-xl p-5 break-inside-avoid transition-all border ${
                    i === activeQuote
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <p className="text-neutral-300 text-sm leading-relaxed italic">&ldquo;{q}&rdquo;</p>
                </button>
              ))}
            </div>
          </section>
        )}


      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 glass-card p-2 rounded-full text-white hover:text-primary transition-colors"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt={c.name}
            className="max-h-[90vh] max-w-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
