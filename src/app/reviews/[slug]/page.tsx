import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import ReviewDetailClient from './components/ReviewDetailClient';
import dbConnect from '@/lib/mongodb';
import MovieReview from '@/models/MovieReview';
import { absoluteUrl, createBreadcrumbJsonLd, createMetadata, stripHtml, truncate } from '@/lib/seo/site';

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
  if (!review) return { title: 'Review Not Found' };

  const seo = review.seoData ?? review.seo ?? {};
  const title = seo.metaTitle ?? `${review.title} | CelebrityPersona`;
  const description = seo.metaDescription ?? review.excerpt ?? truncate(review.content, 155);
  const image = seo.ogImages?.[0] || seo.twitterImage || review.backdropImage || review.poster;

  return createMetadata({
    title,
    description,
    path: seo.canonicalUrl || `/reviews/${review.slug}`,
    image,
    type: 'article',
    keywords: seo.metaKeywords,
    noIndex: seo.noindex,
    publishedTime: review.publishDate,
    modifiedTime: review.updatedAt,
    authors: [review.author?.name].filter(Boolean),
  });
}

export default async function ReviewDetailPage({ params }: Props) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) notFound();
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: review.title,
    url: absoluteUrl(`/reviews/${review.slug}`),
    image: [review.poster, review.backdropImage].filter(Boolean).map((image) => absoluteUrl(image)),
    datePublished: review.publishDate || review.createdAt,
    dateModified: review.updatedAt || review.publishDate,
    reviewBody: stripHtml(review.content || review.excerpt || '').slice(0, 5000),
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 10,
      worstRating: 0,
    },
    author: {
      '@type': 'Person',
      name: review.author?.name || 'CelebrityPersona',
    },
    itemReviewed: {
      '@type': 'Movie',
      name: review.movieTitle,
      image: review.poster ? absoluteUrl(review.poster) : undefined,
      dateCreated: review.movieDetails?.releaseYear,
      director: review.movieDetails?.director
        ? { '@type': 'Person', name: review.movieDetails.director }
        : undefined,
    },
  };

  return (
    <>
      <JsonLd
        data={[
          reviewSchema,
          createBreadcrumbJsonLd([
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
