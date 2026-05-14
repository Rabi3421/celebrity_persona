import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import ReviewDetailClient from './components/ReviewDetailClient';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { createMovieReviewMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { createBreadcrumbSchema, createReviewSchema } from '@/lib/seo/structuredData';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getReview(slug: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const review: any = await MovieReview.findOne({ slug: slug.toLowerCase().trim(), status: 'published' }).lean();
    if (!review) return null;
    return JSON.parse(JSON.stringify(review));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) {
    return createNoIndexMetadata(
      'Review Not Found',
      'The movie review you are looking for could not be found.',
      '/reviews'
    );
  }

  return createMovieReviewMetadata(review);
}

export default async function ReviewDetailPage({ params }: Props) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) notFound();

  return (
    <>
      <JsonLd
        data={[
          createReviewSchema(review),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Movie Reviews', path: '/reviews' },
            { name: review.title, path: `/reviews/${review.slug}` },
          ]),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-[#0d0d14] pt-20">
        <ReviewDetailClient review={review} />
      </main>
      <Footer />
    </>
  );
}
