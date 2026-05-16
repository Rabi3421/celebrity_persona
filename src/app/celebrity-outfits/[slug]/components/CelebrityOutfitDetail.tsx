"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/context/AuthContext';

interface OutfitComment {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

interface CelebrityOutfit {
  id: string;
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  images: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  galleryImages?: Array<{ url: string; alt?: string; caption?: string; credit?: string; sourceUrl?: string }>;
  event?: string;
  eventName?: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
  outfitType?: string;
  category?: string;
  brand?: string;
  designer?: string;
  color?: string;
  size?: string;
  price?: string;
  purchaseLink?: string;
  primaryCelebrity?: { name: string; slug?: string; profileImage?: string } | string;
  primaryCelebritySlug?: string;
  relatedCelebrities?: Array<{ name: string; slug?: string; image?: string; profileUrl?: string }>;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  outfitSummary?: string;
  mainOutfitName?: string;
  fabric?: string;
  pattern?: string;
  neckline?: string;
  sleeveStyle?: string;
  fitSilhouette?: string;
  length?: string;
  workOrEmbellishment?: string;
  accessories?: string;
  jewelry?: string;
  footwear?: string;
  bag?: string;
  hairstyle?: string;
  makeup?: string;
  stylingNotes?: string;
  bestFor?: string[];
  season?: string;
  priceRange?: string;
  styleLevel?: string;
  introduction?: string;
  outfitDescription?: string;
  styleBreakdown?: string;
  whyThisLookWorks?: string;
  howToRecreateLook?: string;
  occasionStylingTips?: string;
  affordableAlternatives?: string;
  finalVerdict?: string;
  originalProductName?: string;
  originalBrand?: string;
  originalPrice?: string;
  originalCurrency?: string;
  originalBuyUrl?: string;
  originalAffiliateUrl?: string;
  similarProducts?: Array<any>;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  creditDisplayText?: string;
  imageCreditText?: string;
  additionalReferences?: Array<{ title?: string; url?: string; sourceName?: string }>;
  tags?: string[];
  createdAt: string;
  celebrity?: { name: string; slug?: string; profileImage?: string } | string;
  likes?: string[];
  favourites?: string[];
  comments?: OutfitComment[];
}

function celebName(c: CelebrityOutfit['celebrity']): string {
  if (!c) return 'Unknown';
  if (typeof c === 'string') return c;
  return c.name || 'Celebrity';
}

function htmlToText(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function RichSection({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <section className="mt-10">
      <h2 className="font-playfair text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-p:leading-7 prose-a:text-primary" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}

// ── Full-width About Section ───────────────────────────────────────────────
function AboutSection({ description }: { description: string }) {
  const plain = description
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <section className="mt-10 mb-2">
      <h2 className="font-playfair text-xl font-bold text-white mb-3">About this look</h2>
      <p className="text-neutral-400 text-sm leading-relaxed">{plain}</p>
    </section>
  );
}

interface Props {
  slug: string;
  prefetchedData?: CelebrityOutfit;
}

export default function CelebrityOutfitDetail({ slug, prefetchedData }: Props) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();

  const [outfit, setOutfit]       = useState<CelebrityOutfit | null>(prefetchedData || null);
  const [loading, setLoading]     = useState(false); // prefetchedData covers initial render; client fetch updates silently
  const [error, setError]         = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox]   = useState(false);
  const [copied, setCopied]       = useState(false);

  // interaction state
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(0);
  const [faved, setFaved]               = useState(false);
  const [comments, setComments]         = useState<OutfitComment[]>([]);
  const [commentText, setCommentText]   = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [actioning, setActioning]       = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Always fetch fresh data from the client — server prefetchedData is ISR-cached
    // and won't reflect the latest likes/comments/favourites.
    // prefetchedData is only used for the initial static render (title, images, etc.)
    fetch(`/api/content/outfits/slug/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setOutfit(json.data);
          setLikeCount(json.data.likes?.length ?? 0);
          setComments(json.data.comments ?? []);
        } else if (!prefetchedData) {
          // only set error if we have no fallback to show
          setError(json.message || 'Not found');
        }
      })
      .catch(() => { if (!prefetchedData) setError('Failed to load'); })
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate liked/faved whenever user or fresh outfit data resolves
  useEffect(() => {
    if (!outfit || !user) return;
    setLiked((outfit.likes ?? []).includes(user.id));
    setFaved((outfit.favourites ?? []).includes(user.id));
  }, [user, outfit]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requireAuth = (action: () => void) => {
    if (!user) { router.push(`/login?redirect=/celebrity-outfits/${slug}`); return; }
    action();
  };

  const interact = async (body: object) => {
    const res = await fetch(`/api/celebrity-outfits/${slug}/interact`, {
      method:  'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return res.json();
  };

  const handleLike = () => requireAuth(async () => {
    if (actioning) return;
    setActioning(true);
    const next   = !liked;
    const action = next ? 'like' : 'unlike';
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const json = await interact({ action });
      if (json.success) setLikeCount(json.count);
      else { setLiked(!next); setLikeCount((c) => c + (next ? -1 : 1)); }
    } finally { setActioning(false); }
  });

  const handleFavourite = () => requireAuth(async () => {
    if (actioning) return;
    setActioning(true);
    const next   = !faved;
    const action = next ? 'favourite' : 'unfavourite';
    setFaved(next);
    try {
      const json = await interact({ action });
      if (!json.success) setFaved(!next);
    } finally { setActioning(false); }
  });

  const handleComment = async () => {
    if (!user) { router.push(`/login?redirect=/celebrity-outfits/${slug}`); return; }
    const text = commentText.trim();
    if (!text || postingComment) return;
    setPostingComment(true);
    try {
      const json = await interact({ action: 'comment', text });
      if (json.success) {
        setComments((prev) => [...prev, json.comment]);
        setCommentText('');
      }
    } finally { setPostingComment(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const json = await interact({ action: 'delete-comment', commentId });
      if (json.success) setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch { /* ignore */ }
  };

  /* ── Loading skeleton ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 animate-pulse">
        <div className="h-4 w-64 bg-white/5 rounded-xl mb-8" />
        <div className="grid md:grid-cols-2 gap-12">
          <div className="h-[560px] bg-white/5 rounded-3xl" />
          <div className="space-y-5">
            <div className="h-6 w-32 bg-white/5 rounded-full" />
            <div className="h-10 w-3/4 bg-white/5 rounded-xl" />
            <div className="h-4 w-1/2 bg-white/5 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-2xl" />
            <div className="h-14 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Icon name="ExclamationCircleIcon" size={64} className="text-neutral-700 mx-auto mb-5" />
        <h1 className="font-playfair text-3xl text-white mb-3">Outfit Not Found</h1>
        <p className="text-neutral-400 mb-8">{error || 'This outfit could not be found.'}</p>
        <Link href="/fashion-gallery"
          className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-semibold hover:glow-gold transition-all">
          <Icon name="ArrowLeftIcon" size={16} /> Back to Gallery
        </Link>
      </div>
    );
  }

  const celeb     = outfit.primaryCelebrity || outfit.celebrity;
  const celebSlug = typeof celeb === 'object' && celeb?.slug ? celeb.slug : null;
  const name      = celebName(celeb);
  const label     = outfit.outfitType || outfit.eventName || outfit.event || outfit.category;
  const displayImages: Array<{ url: string; alt?: string; caption?: string; credit?: string; sourceUrl?: string }> = (outfit.galleryImages?.length
    ? outfit.galleryImages
    : [outfit.featuredImage, ...(outfit.images || [])].filter(Boolean).map((url, i) => ({
        url: String(url),
        alt: i === 0 ? outfit.featuredImageAlt || `${outfit.title} worn by ${name}` : `${outfit.title} gallery image ${i + 1}`,
      }))).filter((image: any) => image.url);
  const activeImage = displayImages[activeImg];

  const details = [
    { label: 'Brand',    value: outfit.brand    },
    { label: 'Designer', value: outfit.designer },
    { label: 'Color',    value: outfit.color    },
    { label: 'Fabric', value: outfit.fabric },
    { label: 'Pattern', value: outfit.pattern },
    { label: 'Silhouette', value: outfit.fitSilhouette },
    { label: 'Neckline', value: outfit.neckline },
    { label: 'Sleeves', value: outfit.sleeveStyle },
    { label: 'Length', value: outfit.length },
    { label: 'Accessories', value: outfit.accessories },
    { label: 'Jewelry', value: outfit.jewelry },
    { label: 'Footwear', value: outfit.footwear },
    { label: 'Bag', value: outfit.bag },
    { label: 'Hair', value: outfit.hairstyle },
    { label: 'Makeup', value: outfit.makeup },
    { label: 'Season', value: outfit.season },
    { label: 'Style Level', value: outfit.styleLevel },
  ].filter((d) => d.value);

  return (
    <article className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-8 md:py-12">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-neutral-500 mb-8 flex-wrap">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Icon name="ChevronRightIcon" size={12} className="text-neutral-700" />
        <Link href="/fashion-gallery" className="hover:text-white transition-colors">Fashion Gallery</Link>
        <Icon name="ChevronRightIcon" size={12} className="text-neutral-700" />
        {celebSlug ? (
          <Link href={`/celebrity-profiles/${celebSlug}`} className="hover:text-white transition-colors">{name}</Link>
        ) : (
          <span className="text-neutral-400">{name}</span>
        )}
        <Icon name="ChevronRightIcon" size={12} className="text-neutral-700" />
        <span className="text-neutral-300 truncate max-w-[200px] md:max-w-xs" aria-current="page">{outfit.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-16 items-start">

        {/* ── Image gallery ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Main image */}
          <div
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[340px] min-[390px]:h-[380px] md:h-[540px] cursor-zoom-in glass-card border border-white/10 group"
            onClick={() => displayImages.length > 0 && setLightbox(true)}
          >
            {activeImage?.url ? (
              <AppImage
                src={activeImage.url}
                alt={activeImage.alt || outfit.featuredImageAlt || `${outfit.title} worn by ${name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                priority={activeImg === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                quality={82}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Icon name="PhotoIcon" size={56} className="text-neutral-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Zoom hint */}
            <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-full text-xs text-white/70 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="MagnifyingGlassPlusIcon" size={13} /> Zoom
            </div>

            {/* Image counter */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 right-4 glass-card px-2.5 py-1 rounded-full text-xs text-white/70 flex items-center gap-1">
                <Icon name="PhotoIcon" size={12} /> {activeImg + 1} / {displayImages.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {displayImages.map((image, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    i === activeImg
                      ? 'border-primary shadow-[0_0_12px_theme(colors.yellow.500/40%)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <AppImage src={image.url} alt={image.alt || `View ${i + 1}`} className="w-full h-full object-cover" sizes="80px" quality={60} />
                </button>
              ))}
            </div>
          )}
          {(activeImage?.caption || activeImage?.credit || outfit.featuredImageCaption || outfit.imageCredit) && (
            <p className="text-xs text-neutral-500 leading-relaxed">
              {activeImage?.caption || outfit.featuredImageCaption}
              {(activeImage?.credit || outfit.imageCredit) && <> Credit: {activeImage?.credit || outfit.imageCredit}</>}
            </p>
          )}
        </div>

        {/* ── Details ───────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-7">

          {/* Event / category badge */}
          {label && (
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                {label}
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white leading-tight mb-4 min-[390px]:text-3xl md:text-4xl">
              {outfit.title}
            </h1>

            {/* Celebrity credit */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Icon name="StarIcon" size={14} className="text-black" />
              </div>
              <span className="text-neutral-400 text-sm">
                Worn by{' '}
                {celebSlug ? (
                  <Link href={`/celebrity-profiles/${celebSlug}`}
                    className="text-white font-semibold hover:text-primary transition-colors">
                    {name}
                  </Link>
                ) : (
                  <span className="text-white font-semibold">{name}</span>
                )}
              </span>
            </div>
          </div>

          {/* Price highlight */}
          {outfit.price && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <Icon name="TagIcon" size={20} className="text-primary" />
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Price</p>
                <p className="font-playfair text-2xl font-bold text-primary">{outfit.price}</p>
              </div>
            </div>
          )}

          {/* Details card */}
          {details.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/10 divide-y divide-white/5">
              {details.map(({ label: lbl, value }) => (
                <div key={lbl} className="flex flex-wrap justify-between gap-2 px-4 py-3.5 text-sm sm:px-5">
                  <span className="text-neutral-500">{lbl}</span>
                  <span className="break-anywhere text-right font-medium text-white">{value}</span>
                </div>
              ))}
              <div className="flex flex-wrap justify-between gap-2 px-4 py-3.5 text-sm sm:px-5">
                <span className="text-neutral-500">Posted on</span>
                <span className="text-white">
                  {new Date(outfit.publishedAt || outfit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {outfit.updatedAt && (
                <div className="flex flex-wrap justify-between gap-2 px-4 py-3.5 text-sm sm:px-5">
                  <span className="text-neutral-500">Updated on</span>
                  <span className="text-white">
                    {new Date(outfit.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {outfit.eventName && (
                <div className="flex flex-wrap justify-between gap-2 px-4 py-3.5 text-sm sm:px-5">
                  <span className="text-neutral-500">Occasion</span>
                  <span className="text-white">{[outfit.eventName, outfit.eventType, outfit.location].filter(Boolean).join(' • ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {outfit.tags && outfit.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {outfit.tags.map((tag, i) => (
                <span key={i}
                  className="px-3 py-1.5 rounded-full bg-white/5 text-neutral-400 text-xs border border-white/10 hover:border-primary/30 hover:text-primary transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Interaction buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`min-w-[8rem] flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                liked
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'glass-card border-white/10 text-neutral-300 hover:border-red-500/40 hover:text-red-400'
              }`}
            >
              <Icon name="HeartIcon" size={18} className={liked ? 'text-red-400 fill-red-400' : ''} />
              {liked ? 'Liked' : 'Like'}
              <span className="text-xs opacity-70">({likeCount})</span>
            </button>

            {/* Save / Bookmark */}
            <button
              onClick={handleFavourite}
              className={`min-w-[8rem] flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                faved
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'glass-card border-white/10 text-neutral-300 hover:border-yellow-500/40 hover:text-yellow-400'
              }`}
            >
              <Icon name="BookmarkIcon" size={18} className={faved ? 'text-yellow-400 fill-yellow-400' : ''} />
              {faved ? 'Saved' : 'Save'}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title={copied ? 'Copied!' : 'Copy link'}
              className={`glass-card flex min-w-[3.75rem] items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                copied
                  ? 'border-green-500/40 text-green-400 bg-green-500/10'
                  : 'border-white/10 text-neutral-300 hover:text-white hover:border-white/30'
              }`}
            >
              <Icon name={copied ? 'CheckIcon' : 'ShareIcon'} size={17} />
            </button>
          </div>

          {/* Shop CTA */}
          <div className="flex flex-col gap-3 pt-1">
            {outfit.purchaseLink && (
              <a
                href={outfit.purchaseLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full flex items-center justify-center gap-3 bg-primary text-black py-4 rounded-full font-bold text-base hover:glow-gold transition-all group"
              >
                <Icon name="ShoppingBagIcon" size={22} />
                Shop This Look
                <Icon name="ArrowTopRightOnSquareIcon" size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}

            <Link href="/fashion-gallery"
              className="w-full flex items-center justify-center gap-2 glass-card text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 py-3.5 rounded-full font-medium text-sm transition-all">
              <Icon name="ArrowLeftIcon" size={15} /> Back to Gallery
            </Link>
          </div>
        </div>
      </div>

      {/* ── About this look ───────────────────────────────────────────────── */}
      {outfit.outfitSummary && (
        <section className="mt-10 glass-card rounded-2xl border border-white/10 p-5">
          <h2 className="font-playfair text-xl font-bold text-white mb-3">Look Summary</h2>
          <p className="text-neutral-300 text-sm leading-7">{outfit.outfitSummary}</p>
        </section>
      )}

      {(outfit.description || outfit.outfitDescription) && (
        <AboutSection description={htmlToText(outfit.outfitDescription || outfit.description || '')} />
      )}

      <RichSection title="Introduction" content={outfit.introduction} />
      <RichSection title="Style Breakdown" content={outfit.styleBreakdown} />
      <RichSection title="Why This Look Works" content={outfit.whyThisLookWorks} />
      <RichSection title="How to Recreate the Look" content={outfit.howToRecreateLook} />
      <RichSection title="Occasion Styling Tips" content={outfit.occasionStylingTips} />
      <RichSection title="Affordable Alternatives" content={outfit.affordableAlternatives} />
      <RichSection title="Final Verdict" content={outfit.finalVerdict} />

      {((outfit.originalBuyUrl || outfit.originalAffiliateUrl || outfit.purchaseLink) || (outfit.similarProducts?.length ?? 0) > 0) && (
        <section className="mt-12">
          <h2 className="font-playfair text-2xl font-bold text-white mb-4">Shop Similar Pieces</h2>
          <p className="mb-5 text-xs text-neutral-500">
            Some links may be affiliate links. CelebrityPersona may earn a commission if you purchase through them, at no extra cost to you.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {(outfit.originalBuyUrl || outfit.originalAffiliateUrl || outfit.purchaseLink) && (
              <a href={outfit.originalAffiliateUrl || outfit.originalBuyUrl || outfit.purchaseLink} target="_blank" rel="noopener noreferrer sponsored"
                className="glass-card rounded-2xl border border-primary/20 p-5 hover:border-primary/50 transition-colors">
                <span className="text-xs uppercase tracking-wider text-primary">Original Look</span>
                <h3 className="mt-2 font-semibold text-white">{outfit.originalProductName || outfit.title}</h3>
                <p className="text-sm text-neutral-400">{outfit.originalBrand || outfit.brand}</p>
                {(outfit.originalPrice || outfit.price) && <p className="mt-3 text-primary font-bold">{[outfit.originalCurrency, outfit.originalPrice || outfit.price].filter(Boolean).join(' ')}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">View Product <Icon name="ArrowTopRightOnSquareIcon" size={14} /></span>
              </a>
            )}
            {outfit.similarProducts?.map((product, index) => (
              <a key={`${product.productName}-${index}`} href={product.affiliateUrl || product.productBuyUrl} target="_blank" rel="noopener noreferrer sponsored"
                className="glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-primary/40 transition-colors">
                {(product.productImage || outfit.featuredImage) && (
                  <AppImage src={product.productImage || outfit.featuredImage || ''} alt={product.productName ? `${product.productName} ${product.productBrand || ''}` : `${outfit.title} similar product`} className="h-48 w-full object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
                )}
                <div className="p-4">
                  {product.productPriority && <span className="text-[11px] uppercase tracking-wider text-secondary">{product.productPriority}</span>}
                  <h3 className="mt-1 font-semibold text-white line-clamp-2">{product.productName}</h3>
                  <p className="text-sm text-neutral-400">{product.productBrand || product.storeName}</p>
                  {product.productPrice && <p className="mt-2 text-primary font-bold">{[product.productCurrency, product.productPrice].filter(Boolean).join(' ')}</p>}
                  <span className="mt-4 inline-flex text-sm font-semibold text-white">{product.affiliateUrl ? 'Buy Similar' : 'View Product'}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {(outfit.sourceName || outfit.sourceUrl || outfit.creditDisplayText || outfit.imageCreditText) && (
        <section className="mt-12 glass-card rounded-2xl border border-white/10 p-5">
          <h2 className="font-playfair text-xl font-bold text-white mb-3">Sources & Credits</h2>
          <p className="text-sm text-neutral-400">
            {outfit.creditDisplayText || outfit.imageCreditText || outfit.sourceName}
            {outfit.sourceUrl && <>: <a className="text-primary hover:underline" href={outfit.sourceUrl} target="_blank" rel="noopener noreferrer">View source</a></>}
          </p>
          {outfit.additionalReferences && outfit.additionalReferences.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {outfit.additionalReferences.map((ref, i) => ref.url ? (
                <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:text-primary">
                  {ref.title || ref.sourceName || 'Reference'}
                </a>
              ) : null)}
            </div>
          )}
        </section>
      )}

      {/* ── Comments section ──────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="font-playfair text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="ChatBubbleLeftEllipsisIcon" size={24} className="text-primary" />
          Comments
          <span className="text-base font-normal text-neutral-500 ml-1">({comments.length})</span>
        </h2>

        {/* Comment input or sign-in prompt */}
        {user ? (
          <div className="glass-card rounded-2xl p-5 mb-8 space-y-3 border border-white/10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-white text-sm font-medium">{user.name}</span>
            </div>
            <textarea
              ref={commentRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(); }}
              placeholder="Write a comment… (Ctrl+Enter to post)"
              rows={3}
              className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || postingComment}
                className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:glow-gold transition-all disabled:opacity-50"
              >
                {postingComment
                  ? <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  : <Icon name="PaperAirplaneIcon" size={16} />
                }
                Post
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 mb-8 text-center border border-white/10">
            <Icon name="ChatBubbleLeftIcon" size={32} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm mb-4">Sign in to like, comment and save outfits</p>
            <Link
              href={`/login?redirect=/celebrity-outfits/${slug}`}
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-full font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="UserIcon" size={16} /> Sign In
            </Link>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-sm">
            <Icon name="ChatBubbleLeftIcon" size={36} className="mx-auto mb-3 opacity-30" />
            No comments yet. Be the first!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c._id} className="glass-card rounded-2xl p-4 flex gap-3 sm:gap-4 group border border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.userAvatar
                    ? <img src={c.userAvatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-sm">{c.userName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-white text-sm font-medium">{c.userName}</span>
                      <span className="text-neutral-600 text-xs">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {user && user.id === c.userId && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete comment"
                      >
                        <Icon name="TrashIcon" size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-5 right-5 glass-card p-2.5 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightbox(false)}
          >
            <Icon name="XMarkIcon" size={22} className="text-white" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 glass-card p-3 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + displayImages.length) % displayImages.length); }}
              >
                <Icon name="ChevronLeftIcon" size={22} className="text-white" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 glass-card p-3 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % displayImages.length); }}
              >
                <Icon name="ChevronRightIcon" size={22} className="text-white" />
              </button>
            </>
          )}

          <img
            src={activeImage?.url}
            alt={activeImage?.alt || outfit.title}
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {displayImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {displayImages.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-primary w-5' : 'bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
