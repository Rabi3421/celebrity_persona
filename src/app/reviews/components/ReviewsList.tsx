"use client";

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import type { ReviewItem } from './ReviewsInteractive';

interface ReviewsListProps {
  reviews: ReviewItem[];
  loading: boolean;
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function ratingColor(r: number) {
  if (r >= 8) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
  if (r >= 6) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
  return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse">
      <div className="w-24 h-36 rounded-xl bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-full" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-5/6" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <Icon name="FilmIcon" size={36} className="text-neutral-600" />
      </div>
      <h3 className="text-white font-semibold text-lg font-playfair mb-2">No reviews found</h3>
      <p className="text-neutral-500 text-sm font-montserrat max-w-xs">
        Try adjusting your search or filters to discover more movie reviews.
      </p>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */

export default function ReviewsList({ reviews, loading }: ReviewsListProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!reviews.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reviews.map(review => {
        const rating     = review.rating ?? 0;
        const ratingCls  = ratingColor(rating);
        const genre      = review.movieDetails?.genre ?? [];
        const publishedAt = review.publishDate
          ? new Date(review.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : null;

        return (
          <Link
            key={review._id}
            href={`/reviews/${review.slug}`}
            className="group flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]
              hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-yellow-500/[0.04] to-transparent pointer-events-none" />

            {/* Poster */}
            <div className="relative w-24 h-36 rounded-xl overflow-hidden shrink-0 bg-white/[0.06]">
              {review.poster ? (
                <Image
                  src={review.poster}
                  alt={review.movieTitle || review.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="FilmIcon" size={28} className="text-neutral-600" />
                </div>
              )}

              {/* Rating badge */}
              <div className={`absolute top-2 right-2 flex items-center justify-center
                w-9 h-9 rounded-lg border text-xs font-bold font-playfair shadow-lg ${ratingCls}`}>
                {rating.toFixed(1)}
              </div>

              {/* Featured badge */}
              {review.featured && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5
                  rounded-md bg-yellow-500/90 text-black text-[9px] font-bold font-montserrat">
                  <Icon name="StarIcon" variant="solid" size={8} className="text-black" />
                  TOP
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">

              {/* Movie title */}
              {review.movieTitle && (
                <p className="text-yellow-400/80 text-xs font-semibold font-montserrat uppercase tracking-wider truncate mb-0.5">
                  {review.movieTitle}
                  {review.movieDetails?.releaseYear && (
                    <span className="text-neutral-600 normal-case font-normal ml-1">
                      ({review.movieDetails.releaseYear})
                    </span>
                  )}
                </p>
              )}

              {/* Review title */}
              <h3 className="text-white font-semibold text-sm font-playfair leading-snug mb-2 line-clamp-2
                group-hover:text-yellow-300 transition-colors">
                {review.title}
              </h3>

              {/* Excerpt */}
              {review.excerpt && (
                <p className="text-neutral-500 text-xs font-montserrat leading-relaxed line-clamp-2 mb-3 flex-1">
                  {review.excerpt}
                </p>
              )}

              {/* Genre pills */}
              {genre.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {genre.slice(0, 3).map(g => (
                    <span key={g}
                      className="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-medium
                        bg-white/[0.06] text-neutral-400 border border-white/[0.08]">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Pros / Cons pills */}
              {((review.pros?.length ?? 0) > 0 || (review.cons?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {review.pros?.slice(0, 1).map((p, i) => (
                    <span key={`pro-${i}`}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-montserrat
                        bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icon name="PlusIcon" size={8} />
                      <span className="truncate max-w-[100px]">{p}</span>
                    </span>
                  ))}
                  {review.cons?.slice(0, 1).map((c, i) => (
                    <span key={`con-${i}`}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-montserrat
                        bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Icon name="MinusIcon" size={8} />
                      <span className="truncate max-w-[100px]">{c}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Author + date */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 min-w-0">
                  {review.author?.avatar && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(review.author.avatar) ? (
                    <Image src={review.author.avatar} alt={review.author.name ?? ''} width={22} height={22}
                      className="rounded-full object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
                      <Icon name="UserIcon" size={10} className="text-neutral-500" />
                    </div>
                  )}
                  <span className="text-neutral-500 text-[11px] font-montserrat truncate">
                    {review.author?.name ?? 'Staff Writer'}
                  </span>
                </div>
                {publishedAt && (
                  <span className="text-neutral-600 text-[11px] font-montserrat shrink-0 ml-2">{publishedAt}</span>
                )}
              </div>

            </div>
          </Link>
        );
      })}
    </div>
  );
}
