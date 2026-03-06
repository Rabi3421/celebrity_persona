'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import MovieInteractions from './MovieInteractions';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CastMember {
  _id: string;
  name: string;
  role?: string;
  character?: string;
  image?: string;
  celebrityId?: string;
}

interface TicketLink {
  _id: string;
  platform: string;
  url: string;
  available: boolean;
}

interface Movie {
  _id: string;
  title: string;
  slug: string;
  releaseDate?: string;
  poster?: string;
  backdrop?: string;
  language?: string | string[];
  originalLanguage?: string;
  worldwide?: boolean;
  genre?: string[];
  director?: string;
  writers?: string[];
  producers?: string[];
  cast?: CastMember[];
  synopsis?: string;
  plotSummary?: string;
  productionNotes?: string;
  status?: string;
  anticipationScore?: number;
  duration?: number;
  mpaaRating?: string;
  regions?: string[];
  subtitles?: string[];
  budget?: number;
  boxOfficeProjection?: number;
  featured?: boolean;
  images?: string[];
  studio?: string;
  trailer?: string;
  ticketLinks?: TicketLink[];
  preOrderAvailable?: boolean;
  seoData?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFullDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBA';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCountdown(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'TBA';
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diffDays < 0)  return 'Released';
  if (diffDays === 0) return 'Today!';
  if (diffDays === 1) return 'Tomorrow!';
  if (diffDays < 30)  return `In ${diffDays} days`;
  if (diffDays < 365) return `In ${Math.ceil(diffDays / 30)} months`;
  return formatFullDate(dateStr);
}

function formatCurrency(n?: number): string {
  if (!n || n === 0) return 'N/A';
  if (n >= 1_00_00_00_000) return `₹${(n / 1_00_00_00_000).toFixed(1)}B`;
  if (n >= 1_00_00_000)    return `₹${(n / 1_00_00_000).toFixed(0)} Cr`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function normalizeLanguages(lang?: string | string[]): string[] {
  if (!lang) return [];
  return Array.isArray(lang) ? lang : [lang];
}

function scoreColor(score?: number) {
  if (!score) return 'text-neutral-400';
  if (score >= 9) return 'text-emerald-400';
  if (score >= 7) return 'text-yellow-400';
  if (score >= 5) return 'text-orange-400';
  return 'text-red-400';
}

function barColor(score?: number) {
  if (!score) return 'bg-neutral-600';
  if (score >= 9) return 'bg-emerald-500';
  if (score >= 7) return 'bg-yellow-500';
  if (score >= 5) return 'bg-orange-500';
  return 'bg-red-500';
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MovieDetailClient({ movie }: { movie: Movie }) {
  const [imgTab, setImgTab] = useState<'poster' | 'backdrop' | 'gallery'>('poster');
  const allLangs = normalizeLanguages(movie.language);

  const countdown = formatCountdown(movie.releaseDate);
  const isReleased = countdown === 'Released';

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">

      {/* ── Back Link ── */}
      <div className="container mx-auto px-4 pt-24 pb-2">
        <Link
          href="/upcoming-movies"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-yellow-400 transition-colors"
        >
          ← Back to Upcoming Movies
        </Link>
      </div>

      {/* ── Hero / Backdrop ── */}
      <section className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden">
        {movie.backdrop || movie.poster ? (
          <Image
            src={movie.backdrop || movie.poster!}
            alt={movie.title}
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <span className="text-9xl opacity-20">🎬</span>
          </div>
        )}
        {/* Dark gradient overlay — fades top & bottom into the page bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14] via-transparent to-[#0a0a14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/80 via-transparent to-transparent" />

        {/* Countdown badge */}
        <div className="absolute top-6 right-6">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm ${
            isReleased
              ? 'bg-emerald-500/80 text-white'
              : 'bg-yellow-500/80 text-black'
          }`}>
            {isReleased ? '✅ Now In Theatres' : `🎬 ${countdown}`}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex items-end gap-8">
          {/* Poster thumbnail */}
          {movie.poster && (
            <div className="hidden md:block w-36 h-52 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 relative">
              <Image src={movie.poster} alt={movie.title} fill className="object-cover" sizes="144px" />
            </div>
          )}

          {/* Title block */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.featured && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>
              )}
              {movie.preOrderAvailable && (
                <span className="bg-emerald-500/80 text-white text-xs font-semibold px-3 py-1 rounded-full">Pre-Order Available</span>
              )}
              {movie.mpaaRating && (
                <span className="bg-black/60 border border-white/20 text-white text-xs px-3 py-1 rounded-full">{movie.mpaaRating}</span>
              )}
              {movie.duration && (
                <span className="bg-black/60 border border-white/20 text-white text-xs px-3 py-1 rounded-full">
                  ⏱ {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-3 drop-shadow-2xl">
              {movie.title}
            </h1>

            {/* Genre pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(movie.genre ?? []).map(g => (
                <span key={g} className="text-sm bg-blue-500/25 text-blue-300 border border-blue-500/30 px-3 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              {movie.trailer && (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-lg"
                >
                  ▶ Watch Trailer
                </a>
              )}
              {(movie.ticketLinks ?? []).filter(t => t.available).slice(0, 2).map(t => (
                <a
                  key={t._id}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors shadow-lg"
                >
                  🎟 {t.platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Anticipation score */}
            {movie.anticipationScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Audience Anticipation</h2>
                <div className="flex items-end gap-5">
                  <span className={`text-6xl font-black ${scoreColor(movie.anticipationScore)}`}>
                    {movie.anticipationScore.toFixed(1)}
                  </span>
                  <div className="flex-1 pb-2">
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(movie.anticipationScore / 10) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${barColor(movie.anticipationScore)}`}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">out of 10.0</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Like / Save / Comment interactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <MovieInteractions slug={movie.slug} movieTitle={movie.title} />
            </motion.div>
            {movie.synopsis && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-yellow-500 pl-4">Synopsis</h2>
                <p className="text-neutral-300 leading-relaxed text-[15px] whitespace-pre-line">
                  {movie.synopsis}
                </p>
              </motion.section>
            )}

            {/* Plot Summary */}
            {movie.plotSummary && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-blue-500 pl-4">Plot Summary</h2>
                <p className="text-neutral-300 leading-relaxed text-[15px] whitespace-pre-line">
                  {movie.plotSummary}
                </p>
              </motion.section>
            )}

            {/* Production Notes */}
            {movie.productionNotes && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-purple-500 pl-4">Production Notes</h2>
                <p className="text-neutral-300 leading-relaxed text-[15px] whitespace-pre-line">
                  {movie.productionNotes}
                </p>
              </motion.section>
            )}

            {/* Cast */}
            {(movie.cast ?? []).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <h2 className="text-lg font-bold text-white mb-5 border-l-4 border-pink-500 pl-4">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(movie.cast ?? []).map(member => {
                    const inner = (
                      <>
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-white/10 relative mb-3">
                          {member.image ? (
                            <Image
                              src={member.image}
                              alt={member.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-500">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                        {member.character && (
                          <p className="text-xs text-yellow-400/80 truncate mt-0.5">as {member.character}</p>
                        )}
                        {member.role && (
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{member.role}</p>
                        )}
                        <p className="text-xs text-blue-400/70 mt-1.5">View Profile →</p>
                      </>
                    );

                    const cardClass = "bg-white/5 border border-white/10 rounded-xl p-4 text-center transition-all duration-200 hover:border-yellow-500/40 hover:bg-white/8 hover:-translate-y-0.5 block cursor-pointer";

                    return (
                      <Link
                        key={member._id}
                        href={`/celebrity-profiles/${nameToSlug(member.name)}`}
                        className={cardClass}
                      >
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Crew */}
            {((movie.writers ?? []).length > 0 || (movie.producers ?? []).length > 0) && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid sm:grid-cols-2 gap-6"
              >
                {(movie.writers ?? []).length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">✍️ Writers</h3>
                    <div className="flex flex-wrap gap-2">
                      {(movie.writers ?? []).map(w => (
                        <span key={w} className="text-sm bg-white/5 border border-white/10 text-neutral-200 px-3 py-1 rounded-full">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(movie.producers ?? []).length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">🎥 Producers</h3>
                    <div className="flex flex-wrap gap-2">
                      {(movie.producers ?? []).map(p => (
                        <span key={p} className="text-sm bg-white/5 border border-white/10 text-neutral-200 px-3 py-1 rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* Image Gallery */}
            {(movie.images ?? []).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <h2 className="text-lg font-bold text-white mb-5 border-l-4 border-emerald-500 pl-4">Gallery</h2>
                <div className="flex gap-2 mb-4">
                  {(['poster', 'backdrop', 'gallery'] as const)
                    .filter(tab => tab !== 'gallery' || (movie.images ?? []).length > 0)
                    .map(tab => (
                      <button
                        key={tab}
                        onClick={() => setImgTab(tab)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                          imgTab === tab
                            ? 'bg-yellow-500 text-black'
                            : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                </div>

                {imgTab === 'poster' && movie.poster && (
                  <div className="relative w-48 h-72 rounded-xl overflow-hidden border border-white/10 shadow-xl">
                    <Image src={movie.poster} alt={`${movie.title} poster`} fill className="object-cover" sizes="192px" />
                  </div>
                )}
                {imgTab === 'backdrop' && movie.backdrop && (
                  <div className="relative w-full h-56 md:h-80 rounded-xl overflow-hidden border border-white/10 shadow-xl">
                    <Image src={movie.backdrop} alt={`${movie.title} backdrop`} fill className="object-cover" sizes="100vw" />
                  </div>
                )}
                {imgTab === 'gallery' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(movie.images ?? []).map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-md">
                        <Image src={img} alt={`${movie.title} image ${i + 1}`} fill className="object-cover" sizes="33vw" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Book Tickets */}
            {(movie.ticketLinks ?? []).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4">🎟 Book Tickets</h2>
                <div className="flex flex-wrap gap-3">
                  {(movie.ticketLinks ?? []).map(t => (
                    <a
                      key={t._id}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        t.available
                          ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/30'
                          : 'bg-white/5 text-neutral-500 cursor-not-allowed line-through border border-white/10'
                      }`}
                    >
                      🎟 {t.platform}
                      {!t.available && <span className="text-xs">(Unavailable)</span>}
                    </a>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-6">

            {/* Movie Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-28"
            >
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Movie Details</h3>
              <dl className="space-y-3 text-sm">
                {[
                  { icon: '📅', label: 'Release',    value: formatFullDate(movie.releaseDate) },
                  { icon: '🎬', label: 'Status',     value: movie.status },
                  { icon: '🎭', label: 'Director',   value: movie.director },
                  { icon: '🏢', label: 'Studio',     value: movie.studio },
                  { icon: '⏱',  label: 'Duration',   value: movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : undefined },
                  { icon: '🔞', label: 'Rating',     value: movie.mpaaRating },
                  { icon: '🌐', label: 'Language',   value: allLangs.join(', ') || undefined },
                  { icon: '🗺', label: 'Regions',    value: (movie.regions ?? []).join(', ') || undefined },
                  { icon: '💬', label: 'Subtitles',  value: (movie.subtitles ?? []).join(', ') || undefined },
                  { icon: '💰', label: 'Budget',     value: formatCurrency(movie.budget) },
                  { icon: '📈', label: 'BO Forecast',value: formatCurrency(movie.boxOfficeProjection) },
                ].filter(r => r.value && r.value !== 'N/A').map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-base shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                      <p className="text-neutral-200 capitalize break-words">{value}</p>
                    </div>
                  </div>
                ))}
              </dl>

              {/* Trailer CTA — inside the sticky card so it never floats over Tags */}
              {movie.trailer && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Trailer</p>
                  <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/20 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-xs text-neutral-400 mb-3">Official trailer is now available</p>
                    <a
                      href={movie.trailer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors w-full"
                    >
                      ▶ Watch Trailer
                    </a>
                  </div>
                </div>
              )}

              {/* SEO Keywords */}
              {(movie.seoData?.keywords ?? []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(movie.seoData!.keywords ?? []).slice(0, 8).map(k => (
                      <span key={k} className="text-xs bg-white/5 text-neutral-400 px-2 py-0.5 rounded-full border border-white/10">
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}
