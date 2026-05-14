import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import ReviewDetailClient from './components/ReviewDetailClient';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { createMovieReviewMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getReviewInternalLinks } from '@/lib/seo/internalLinks';
import { createBreadcrumbSchema, createReviewSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

interface Props {
  params: Promise<{ slug: string }>;
}

const getReview = cache(async (slug: string) => {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const review: any = await MovieReview.findOne({ slug: slug.toLowerCase().trim(), status: 'published' }).lean();
    if (!review) return null;
    return JSON.parse(JSON.stringify(review));
  } catch {
    return null;
  }
});

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
  const internalLinks = await getReviewInternalLinks(review);

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
      <PublicHeader />
      <main className="min-h-screen bg-[#0d0d14] pt-20">
        <ReviewDetailClient review={review} />
        <InternalLinks
          links={internalLinks}
          title={`${review.movieTitle} Review Links`}
          description={`Explore the ${review.movieTitle} movie page, cast profiles, related reviews, and connected entertainment news.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
