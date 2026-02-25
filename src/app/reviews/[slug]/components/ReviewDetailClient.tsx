"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ReviewInteractions from './ReviewInteractions';
import UserReviewsSection from './UserReviewsSection';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface Review {
  _id: string;
  title: string;
  slug: string;
  movieTitle: string;
  poster?: string;
  backdropImage?: string;
  trailer?: string;
  rating: number;
  content: string;
  excerpt?: string;
  verdict?: string;
  featured: boolean;
  publishDate?: string;
  createdAt?: string;
  pros?: string[];
  cons?: string[];
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
    credentials?: string;
    reviewCount?: number;
    socialMedia?: { twitter?: string; instagram?: string; website?: string };
  };
  movieDetails?: {
    releaseYear?: number;
    director?: string;
    writers?: string[];
    cast?: { name: string; character?: string; image?: string }[];
    genre?: string[];
    runtime?: number;
    budget?: string;
    boxOffice?: string;
    studio?: string;
    mpaaRating?: string;
  };
  scores?: {
    criticsScore?: number;
    audienceScore?: number;
    imdbRating?: number;
    rottenTomatoesScore?: number;
  };
  stats?: { views?: number; likes?: number; helpful?: number };
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function isImageUrl(url?: string) {
  return !!url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

function ratingColor(r: number) {
  if (r >= 8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', bar: 'from-emerald-500 to-emerald-400' };
  if (r >= 6) return { text: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40',  bar: 'from-yellow-500 to-amber-400' };
  return       { text: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/40',   bar: 'from-rose-500 to-rose-400' };
}

function ScoreRow({ label, value, max = 100, color }: { label: string; value?: number; max?: number; color: string }) {
  if (!value) return null;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-neutral-400 text-xs font-montserrat">{label}</span>
        <span className={`text-sm font-bold font-playfair ${color}`}>
          {max === 10 ? value.toFixed(1) : `${Math.round(value)}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color.replace('text-', 'from-').replace('-400', '-500')} to-amber-400 transition-all duration-700`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon} size={14} className="text-neutral-400" />
      </div>
      <div>
        <p className="text-neutral-600 text-[10px] font-montserrat uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-white text-sm font-montserrat">{value}</p>
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function ReviewDetailClient({ review }: { review: Review }) {
  const [trailerOpen, setTrailerOpen] = useState(false);

  const rc       = ratingColor(review.rating);
  const md       = review.movieDetails;
  const scores   = review.scores;
  const author   = review.author;
  const genre    = md?.genre ?? [];
  const cast     = md?.cast ?? [];

  const publishedAt = review.publishDate
    ? new Date(review.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const ytId = review.trailer?.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];

  return (
    <div>

      {/* ── Backdrop hero ─────────────────────────────────────────────────── */}
      <div className="relative h-[60vh] min-h-[420px] max-h-[680px] overflow-hidden">
        {review.backdropImage ? (
          <Image src={review.backdropImage} alt={review.movieTitle} fill
            className="object-cover scale-105" priority sizes="100vw" />
        ) : review.poster ? (
          <Image src={review.poster} alt={review.movieTitle} fill
            className="object-cover scale-105 blur-sm" priority sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d14]" />
        )}
        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d14]/80 via-transparent to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-montserrat text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} className="text-neutral-600" />
            <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
            <Icon name="ChevronRightIcon" size={12} className="text-neutral-600" />
            <span className="text-neutral-600 truncate max-w-[200px]">{review.movieTitle}</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
          <div className="flex items-end gap-6">
            {/* Poster */}
            {review.poster && (
              <div className="relative w-28 sm:w-36 h-40 sm:h-52 rounded-2xl overflow-hidden shrink-0
                border-2 border-white/15 shadow-2xl shadow-black/60 hidden sm:block">
                <Image src={review.poster} alt={review.movieTitle} fill className="object-cover" sizes="144px" />
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              {/* Genre + featured */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {review.featured && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold font-montserrat">
                    <Icon name="StarIcon" variant="solid" size={10} /> Featured
                  </span>
                )}
                {genre.slice(0, 3).map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-neutral-300 text-xs font-montserrat">{g}</span>
                ))}
                {md?.mpaaRating && (
                  <span className="px-2.5 py-1 rounded-full border border-white/[0.2] text-neutral-300 text-xs font-semibold font-montserrat">{md.mpaaRating}</span>
                )}
              </div>

              {/* Movie title */}
              <p className="text-yellow-400/80 text-sm font-semibold font-montserrat uppercase tracking-widest mb-1">
                {review.movieTitle}{md?.releaseYear && <span className="text-neutral-500 normal-case font-normal ml-2">({md.releaseYear})</span>}
              </p>

              {/* Review title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-playfair text-white leading-tight mb-4 max-w-3xl">
                {review.title}
              </h1>

              {/* Rating + meta row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${rc.bg} ${rc.border}`}>
                  <Icon name="StarIcon" variant="solid" size={16} className={rc.text} />
                  <span className={`text-2xl font-bold font-playfair ${rc.text}`}>{review.rating.toFixed(1)}</span>
                  <span className="text-neutral-500 text-sm font-montserrat">/10</span>
                </div>
                {publishedAt && (
                  <div className="flex items-center gap-1.5 text-neutral-400 text-sm font-montserrat">
                    <Icon name="CalendarIcon" size={14} className="text-neutral-600" />
                    {publishedAt}
                  </div>
                )}
                {md?.runtime && (
                  <div className="flex items-center gap-1.5 text-neutral-400 text-sm font-montserrat">
                    <Icon name="ClockIcon" size={14} className="text-neutral-600" />
                    {md.runtime} min
                  </div>
                )}
                {ytId && (
                  <button onClick={() => setTrailerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-600/40 text-red-400 text-sm font-semibold font-montserrat hover:bg-red-600/30 transition-all">
                    <Icon name="PlayIcon" variant="solid" size={14} />
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: main content ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Excerpt */}
            {review.excerpt && (
              <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="absolute top-0 left-6 w-12 h-0.5 bg-gradient-to-r from-yellow-500 to-transparent" />
                <p className="text-neutral-300 text-base font-montserrat leading-relaxed italic">
                  "{review.excerpt}"
                </p>
              </div>
            )}

            {/* Review content */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 lg:p-8">
              <h2 className="text-white font-bold text-lg font-playfair mb-6 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-yellow-500 to-amber-400" />
                Full Review
              </h2>
              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:font-montserrat
                  prose-h2:text-white prose-h2:font-playfair prose-h3:text-white prose-h3:font-playfair
                  prose-strong:text-white prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline
                  prose-li:text-neutral-300 prose-li:font-montserrat
                  prose-blockquote:border-yellow-500 prose-blockquote:text-neutral-400"
                dangerouslySetInnerHTML={{ __html: review.content }}
              />
            </div>

            {/* Pros / Cons */}
            {((review.pros?.length ?? 0) > 0 || (review.cons?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(review.pros?.length ?? 0) > 0 && (
                  <div className="rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 p-5">
                    <h3 className="flex items-center gap-2 text-emerald-400 font-bold font-playfair text-sm mb-4">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Icon name="HandThumbUpIcon" variant="solid" size={12} className="text-emerald-400" />
                      </div>
                      What Works
                    </h3>
                    <ul className="space-y-2.5">
                      {review.pros!.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Icon name="CheckIcon" size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-neutral-300 text-sm font-montserrat">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(review.cons?.length ?? 0) > 0 && (
                  <div className="rounded-2xl bg-rose-500/[0.05] border border-rose-500/20 p-5">
                    <h3 className="flex items-center gap-2 text-rose-400 font-bold font-playfair text-sm mb-4">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <Icon name="HandThumbDownIcon" variant="solid" size={12} className="text-rose-400" />
                      </div>
                      What Doesn't
                    </h3>
                    <ul className="space-y-2.5">
                      {review.cons!.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Icon name="XMarkIcon" size={14} className="text-rose-400 mt-0.5 shrink-0" />
                          <span className="text-neutral-300 text-sm font-montserrat">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Verdict */}
            {review.verdict && (
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/[0.08] to-amber-500/[0.04] border border-yellow-500/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-500/[0.05] blur-2xl" />
                <div className="relative">
                  <h3 className="flex items-center gap-2 text-yellow-400 font-bold font-playfair mb-3">
                    <Icon name="ChatBubbleLeftRightIcon" variant="solid" size={16} className="text-yellow-400" />
                    Verdict
                  </h3>
                  <p className="text-neutral-300 text-sm font-montserrat leading-relaxed">{review.verdict}</p>
                </div>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                <h2 className="text-white font-bold text-lg font-playfair mb-5 flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-400" />
                  Cast
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {cast.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {isImageUrl(member.image) ? (
                          <Image src={member.image!} alt={member.name} width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <Icon name="UserIcon" size={16} className="text-neutral-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold font-montserrat truncate">{member.name}</p>
                        {member.character && (
                          <p className="text-neutral-500 text-[10px] font-montserrat truncate">{member.character}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author card */}
            {author && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
                <p className="text-neutral-600 text-xs font-montserrat uppercase tracking-widest mb-4">About the Reviewer</p>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/[0.06] border border-white/10">
                    {isImageUrl(author.avatar) ? (
                      <Image src={author.avatar!} alt={author.name} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="UserIcon" size={24} className="text-neutral-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold font-playfair">{author.name}</h3>
                      {author.credentials && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[10px] font-montserrat font-semibold">
                          {author.credentials}
                        </span>
                      )}
                    </div>
                    {author.bio && (
                      <p className="text-neutral-500 text-xs font-montserrat leading-relaxed mb-3">{author.bio}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {author.socialMedia?.twitter && (
                        <a href={author.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-neutral-500 hover:text-white text-xs font-montserrat transition-colors">
                          <Icon name="LinkIcon" size={12} />Twitter
                        </a>
                      )}
                      {author.socialMedia?.instagram && (
                        <a href={author.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-neutral-500 hover:text-white text-xs font-montserrat transition-colors">
                          <Icon name="LinkIcon" size={12} />Instagram
                        </a>
                      )}
                      {author.socialMedia?.website && (
                        <a href={author.socialMedia.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-neutral-500 hover:text-white text-xs font-montserrat transition-colors">
                          <Icon name="LinkIcon" size={12} />Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back link */}
            <ReviewInteractions slug={review.slug} />

            {/* Audience reviews */}
            <UserReviewsSection slug={review.slug} />

            <div>
              <Link href="/reviews"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-white/[0.04] border border-white/[0.08] text-neutral-400
                  hover:bg-white/[0.08] hover:text-white hover:border-white/20
                  text-sm font-montserrat transition-all">
                <Icon name="ArrowLeftIcon" size={14} />
                Back to all reviews
              </Link>
            </div>
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Our Score */}
            <div className={`rounded-2xl ${rc.bg} border ${rc.border} p-6 text-center`}>
              <p className="text-neutral-400 text-xs font-montserrat uppercase tracking-widest mb-3">Our Score</p>
              <div className={`text-7xl font-bold font-playfair ${rc.text} mb-1`}>{review.rating.toFixed(1)}</div>
              <p className="text-neutral-500 text-sm font-montserrat">/10</p>
              <div className="mt-4 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${rc.bar} transition-all duration-1000`}
                  style={{ width: `${(review.rating / 10) * 100}%` }} />
              </div>
            </div>

            {/* Score breakdown */}
            {scores && (scores.imdbRating || scores.criticsScore || scores.audienceScore || scores.rottenTomatoesScore) && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                <h3 className="text-white font-semibold font-playfair text-sm flex items-center gap-2">
                  <Icon name="ChartBarIcon" size={14} className="text-yellow-400" />
                  Score Breakdown
                </h3>
                <ScoreRow label="IMDb Rating"      value={scores.imdbRating}      max={10}  color="text-amber-400" />
                <ScoreRow label="Critics Score"    value={scores.criticsScore}    max={100} color="text-rose-400" />
                <ScoreRow label="Audience Score"   value={scores.audienceScore}   max={100} color="text-violet-400" />
                <ScoreRow label="Rotten Tomatoes"  value={scores.rottenTomatoesScore} max={100} color="text-red-400" />
              </div>
            )}

            {/* Movie info */}
            {md && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
                <h3 className="text-white font-semibold font-playfair text-sm flex items-center gap-2 mb-2">
                  <Icon name="FilmIcon" size={14} className="text-yellow-400" />
                  Movie Info
                </h3>
                <div>
                  {md.director   && <InfoChip icon="MegaphoneIcon"     label="Director"  value={md.director} />}
                  {md.releaseYear && <InfoChip icon="CalendarIcon"     label="Year"       value={String(md.releaseYear)} />}
                  {md.runtime    && <InfoChip icon="ClockIcon"         label="Runtime"    value={`${md.runtime} min`} />}
                  {md.studio     && <InfoChip icon="BuildingOfficeIcon" label="Studio"   value={md.studio} />}
                  {md.budget     && <InfoChip icon="BanknotesIcon"     label="Budget"     value={md.budget} />}
                  {md.boxOffice  && <InfoChip icon="TrophyIcon"        label="Box Office" value={md.boxOffice} />}
                  {md.writers && md.writers.length > 0 && (
                    <InfoChip icon="PencilSquareIcon" label="Writer(s)" value={md.writers.join(', ')} />
                  )}
                </div>
              </div>
            )}

            {/* Genre */}
            {genre.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
                <h3 className="text-white font-semibold font-playfair text-sm flex items-center gap-2 mb-3">
                  <Icon name="TagIcon" size={14} className="text-yellow-400" />
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {genre.map(g => (
                    <span key={g} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-neutral-300 text-xs font-montserrat">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Trailer modal ─────────────────────────────────────────────────── */}
      {trailerOpen && ytId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setTrailerOpen(false)}>
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen className="w-full h-full" title="Trailer"
            />
            <button onClick={() => setTrailerOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
