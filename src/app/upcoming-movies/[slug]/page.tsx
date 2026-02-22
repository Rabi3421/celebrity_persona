import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MovieDetailClient from './components/MovieDetailClient';

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
async function getMovie(slug: string): Promise<Movie | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4028';
  const apiKey  = process.env.X_API_KEY ?? '';

  try {
    const res = await fetch(`${baseUrl}/api/user/movies/${slug}`, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as Movie) : null;
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

  const seo = movie.seoData ?? {};
  const title       = seo.metaTitle       || `${movie.title} | Upcoming Movies - CelebrityPersona`;
  const description = seo.metaDescription || movie.synopsis || `Everything about ${movie.title} — release date, cast, trailers, and tickets.`;
  const ogImage     = seo.ogImage || movie.poster || '/assets/images/upcoming-movies-og.jpg';

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
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <MovieDetailClient movie={movie} />
      <Footer />
    </main>
  );
}
