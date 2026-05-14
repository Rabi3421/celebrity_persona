import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import MovieDetailClient from './components/MovieDetailClient';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { createMoviePageMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getMovieInternalLinks } from '@/lib/seo/internalLinks';
import { upcomingMovieQuery } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createMovieSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

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
const getMovie = cache(async (slug: string): Promise<Movie | null> => {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movie: any = await Movie.findOne({ slug, ...upcomingMovieQuery() }).select('-__v').lean();
    if (!movie) return null;
    return JSON.parse(JSON.stringify(movie)) as Movie;
  } catch {
    return null;
  }
});

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
  const internalLinks = await getMovieInternalLinks(movie);

  return (
    <>
      <JsonLd
        data={[
          createMovieSchema(movie, `/upcoming-movies/${movie.slug}`),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Upcoming Movies', path: '/upcoming-movies' },
            { name: movie.title, path: `/upcoming-movies/${movie.slug}` },
          ]),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 pb-2 pt-24">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Upcoming Movies', href: '/upcoming-movies' },
              { name: movie.title, href: `/upcoming-movies/${movie.slug}` },
            ]}
          />
        </div>
        <MovieDetailClient movie={movie} />
        <InternalLinks
          links={internalLinks}
          title={`${movie.title} Cast, Reviews, And News`}
          description={`Explore cast profiles, related reviews, entertainment news, and similar upcoming movie pages connected to ${movie.title}.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
