import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ReviewDetailClient from './components/ReviewDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getReview(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:4028'}/api/v1/reviews/${slug}`,
      {
        headers: { 'x-api-key': process.env.X_API_KEY ?? '' },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) return { title: 'Review Not Found' };

  const seo = review.seoData ?? review.seo ?? {};
  return {
    title:       seo.metaTitle       ?? `${review.title} | CelebrityPersona`,
    description: seo.metaDescription ?? review.excerpt,
    openGraph: {
      title:       seo.ogTitle       ?? review.title,
      description: seo.ogDescription ?? review.excerpt,
      images:      review.backdropImage ? [review.backdropImage] : review.poster ? [review.poster] : [],
      type:        'article',
    },
    twitter: {
      card:        'summary_large_image',
      title:       seo.twitterTitle  ?? review.title,
      description: seo.twitterDescription ?? review.excerpt,
      images:      review.poster ? [review.poster] : [],
    },
  };
}

export default async function ReviewDetailPage({ params }: Props) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) notFound();
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0d0d14] pt-20">
        <ReviewDetailClient review={review} />
      </main>
      <Footer />
    </>
  );
}
