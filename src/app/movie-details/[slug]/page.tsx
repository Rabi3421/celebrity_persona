import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MovieDetailPageClient from './components/MovieDetailPageClient';

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

export interface ReleasedMovie {
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
  boxOffice?: number;
  boxOfficeProjection?: number;
  featured?: boolean;
  images?: string[];
  studio?: string;
  trailer?: string;
  ticketLinks?: TicketLink[];
  preOrderAvailable?: boolean;
  likeCount?: number;
  saveCount?: number;
  commentCount?: number;
  seoData?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ── Server-side data fetch ────────────────────────────────────────────────────
async function getMovie(slug: string): Promise<ReleasedMovie | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4028';
  const apiKey  = process.env.X_API_KEY ?? '';

  try {
    const res = await fetch(`${baseUrl}/api/user/movies/${slug}`, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as ReleasedMovie) : null;
  } catch {
    return null;
  }
}

// ── Dynamic metadata ──────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovie(slug);

  if (!movie) {
    return {
      title: 'Movie Not Found | CelebrityPersona',
      description: 'The requested movie could not be found.',
    };
  }

  const seo         = movie.seoData ?? {};
  const title       = seo.metaTitle       || `${movie.title} | Movie Details - CelebrityPersona`;
  const description = seo.metaDescription || movie.synopsis || `Watch ${movie.title} — cast, director, reviews, trailer and more on CelebrityPersona.`;
  const ogImage     = seo.ogImage || movie.backdrop || movie.poster || '/assets/images/movie-og.jpg';

  return {
    title,
    description,
    keywords: seo.keywords?.join(', ') || (movie.genre ?? []).join(', '),
    openGraph: {
      title:       seo.ogTitle       || title,
      description: seo.ogDescription || description,
      type:        'video.movie',
      images:      [{ url: ogImage, width: 1200, height: 630, alt: movie.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       seo.twitterTitle       || title,
      description: seo.twitterDescription || description,
      images:      seo.twitterImage ? [seo.twitterImage] : [ogImage],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MovieDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const movie = await getMovie(slug);

  if (!movie) notFound();

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      <Header />
      <MovieDetailPageClient movie={movie} />
      <Footer />
    </main>
  );
}
