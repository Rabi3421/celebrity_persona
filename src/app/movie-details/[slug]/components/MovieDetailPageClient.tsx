'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import MovieInteractions from './MovieInteractions';
import type { ReleasedMovie } from '../page';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFullDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBA';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatYear(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `(${d.getFullYear()})`;
}

function formatCurrency(n?: number): string {
  if (!n || n === 0) return 'N/A';
  if (n >= 1_00_00_00_000) return `₹${(n / 1_00_00_00_000).toFixed(1)}B`;
  if (n >= 1_00_00_000)    return `₹${(n / 1_00_00_000).toFixed(0)} Cr`;
  if (n >= 1_00_000)       return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function normalizeLanguages(lang?: string | string[]): string[] {
  if (!lang) return [];
  return Array.isArray(lang) ? lang : [lang];
}

function scoreColor(score?: number): string {
  if (!score) return 'text-neutral-400';
  if (score >= 9) return 'text-emerald-400';
  if (score >= 7) return 'text-yellow-400';
  if (score >= 5) return 'text-orange-400';
  return 'text-red-400';
}

function barColor(score?: number): string {
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

function getStatusBadge(status?: string): { label: string; cls: string } {
  const s = (status ?? '').toLowerCase();
  if (s.includes('now') || s.includes('theatre') || s.includes('showing') || s.includes('playing'))
    return { label: '🎬 Now Showing', cls: 'bg-emerald-500/90 text-white' };
  if (s.includes('released'))
    return { label: '✅ Released', cls: 'bg-blue-500/90 text-white' };
  return { label: status ?? 'Released', cls: 'bg-purple-500/80 text-white' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MovieDetailPageClient({ movie }: { movie: ReleasedMovie }) {
  const [imgTab, setImgTab] = useState<'poster' | 'backdrop' | 'gallery'>('poster');
  const allLangs  = normalizeLanguages(movie.language);
  const statusBadge = getStatusBadge(movie.status);
  const boxOfficeValue = movie.boxOffice ?? movie.boxOfficeProjection;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">

      {/* ── Back Link ── */}
      <div className="container mx-auto px-4 pt-24 pb-2">
        <Link
          href="/movie-details"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-yellow-400 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Movies
        </Link>
      </div>

      {/* ── Hero / Backdrop ── */}
      <section className="relative w-full h-[55vh] md:h-[68vh] overflow-hidden">
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

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14] via-[#0a0a14]/10 to-[#0a0a14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/80 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-6 right-6 z-10">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm shadow-lg ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Hero content — poster + title + CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex items-end gap-8 z-10">
          {/* Poster thumbnail */}
          {movie.poster && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden md:block w-36 h-52 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 relative"
            >
              <Image src={movie.poster} alt={movie.title} fill className="object-cover" sizes="144px" />
            </motion.div>
          )}

          {/* Title + meta */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.featured && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>
              )}
              {movie.mpaaRating && (
                <span className="bg-black/60 border border-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  {movie.mpaaRating}
                </span>
              )}
              {movie.duration && (
                <span className="bg-black/60 border border-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  ⏱ {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
              )}
              {allLangs.slice(0, 2).map(l => (
                <span key={l} className="bg-black/60 border border-white/20 text-neutral-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  {l}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-1 drop-shadow-2xl">
              {movie.title}
            </h1>
            {movie.releaseDate && (
              <p className="text-neutral-400 text-sm mb-3 font-medium">
                {formatYear(movie.releaseDate)}
                {movie.director && <> · Directed by <span className="text-neutral-200">{movie.director}</span></>}
              </p>
            )}

            {/* Genre pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(movie.genre ?? []).map(g => (
                <span key={g} className="text-sm bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-0.5 rounded-full backdrop-blur-sm">
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-red-500/30 hover:scale-[1.02]"
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all shadow-lg hover:shadow-yellow-500/30 hover:scale-[1.02]"
                >
                  🎟 {t.platform}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Score Bar */}
            {movie.anticipationScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                  Audience Score
                </h2>
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

                {/* Quick stats row */}
                {(movie.likeCount !== undefined || movie.saveCount !== undefined || movie.commentCount !== undefined) && (
                  <div className="flex gap-6 mt-5 pt-4 border-t border-white/10">
                    {movie.likeCount !== undefined && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-rose-400">{movie.likeCount.toLocaleString()}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Likes</p>
                      </div>
                    )}
                    {movie.saveCount !== undefined && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">{movie.saveCount.toLocaleString()}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Saved</p>
                      </div>
                    )}
                    {movie.commentCount !== undefined && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-400">{movie.commentCount.toLocaleString()}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Comments</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Like / Save / Comment interactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              id="comments"
            >
              <MovieInteractions slug={movie.slug} movieTitle={movie.title} />
            </motion.div>

            {/* Synopsis */}
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
                <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-purple-500 pl-4">
                  Production Notes
                </h2>
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
                  {(movie.cast ?? []).map(member => (
                    <Link
                      key={member._id}
                      href={`/celebrity-profiles/${nameToSlug(member.name)}`}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 text-center transition-all duration-200 hover:border-yellow-500/40 hover:bg-white/8 hover:-translate-y-0.5 block cursor-pointer"
                    >
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
                    </Link>
                  ))}
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
            {((movie.images ?? []).length > 0 || movie.poster || movie.backdrop) && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <h2 className="text-lg font-bold text-white mb-5 border-l-4 border-emerald-500 pl-4">Gallery</h2>
                <div className="flex gap-2 mb-4">
                  {(['poster', 'backdrop', 'gallery'] as const)
                    .filter(tab => {
                      if (tab === 'poster')   return !!movie.poster;
                      if (tab === 'backdrop') return !!movie.backdrop;
                      return (movie.images ?? []).length > 0;
                    })
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
                  { icon: '📅', label: 'Release Date',  value: formatFullDate(movie.releaseDate) },
                  { icon: '🎬', label: 'Status',        value: movie.status },
                  { icon: '🎭', label: 'Director',      value: movie.director },
                  { icon: '🏢', label: 'Studio',        value: movie.studio },
                  { icon: '⏱',  label: 'Duration',      value: movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : undefined },
                  { icon: '🔞', label: 'MPAA Rating',   value: movie.mpaaRating },
                  { icon: '🌐', label: 'Language',      value: allLangs.join(', ') || undefined },
                  { icon: '🗺', label: 'Regions',       value: (movie.regions ?? []).join(', ') || undefined },
                  { icon: '💬', label: 'Subtitles',     value: (movie.subtitles ?? []).join(', ') || undefined },
                  { icon: '💰', label: 'Budget',        value: formatCurrency(movie.budget) },
                  { icon: '📈', label: 'Box Office',    value: formatCurrency(boxOfficeValue) },
                ].filter(r => r.value && r.value !== 'N/A' && r.value !== 'TBA').map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-base shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                      <p className="text-neutral-200 capitalize break-words">{value}</p>
                    </div>
                  </div>
                ))}
              </dl>

              {/* Trailer CTA */}
              {movie.trailer && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Trailer</p>
                  <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/20 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-xs text-neutral-400 mb-3">Official trailer available</p>
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

              {/* SEO Keywords / Tags */}
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
