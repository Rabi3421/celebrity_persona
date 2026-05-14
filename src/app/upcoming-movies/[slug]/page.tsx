import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import MovieDetailClient from './components/MovieDetailClient';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { absoluteUrl, createBreadcrumbJsonLd, stripHtml } from '@/lib/seo/site';
import { createMoviePageMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { upcomingMovieQuery } from '@/lib/seo/publicData';

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
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movie: any = await Movie.findOne({ slug, ...upcomingMovieQuery() }).select('-__v').lean();
    if (!movie) return null;
    return JSON.parse(JSON.stringify(movie)) as Movie;
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
    return createNoIndexMetadata(
      'Movie Not Found',
      'The requested movie could not be found.',
      '/upcoming-movies'
    );
  }

  return createMoviePageMetadata(movie, 'upcoming');
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MovieDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const movie = await getMovie(slug);

  if (!movie) notFound();

  const movieSchema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    url: absoluteUrl(`/upcoming-movies/${movie.slug}`),
    image: [movie.poster, movie.backdrop].filter(Boolean).map((image) => absoluteUrl(image!)),
    datePublished: movie.releaseDate,
    genre: movie.genre,
    director: movie.director ? { '@type': 'Person', name: movie.director } : undefined,
    actor: movie.cast?.slice(0, 10).map((member) => ({ '@type': 'Person', name: member.name })) || undefined,
    description: stripHtml(movie.synopsis || movie.plotSummary || '').slice(0, 500),
    duration: movie.duration ? `PT${movie.duration}M` : undefined,
  };

  return (
    <>
      <JsonLd
        data={[
          movieSchema,
          createBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Upcoming Movies', path: '/upcoming-movies' },
            { name: movie.title, path: `/upcoming-movies/${movie.slug}` },
          ]),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        <MovieDetailClient movie={movie} />
      </main>
      <Footer />
    </>
  );
}
