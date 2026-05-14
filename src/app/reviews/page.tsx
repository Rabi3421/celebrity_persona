import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import ReviewsInteractive from './components/ReviewsInteractive';
import { createMetadata } from '@/lib/seo/site';
import { getAvailableForReviewMovies, getReviews } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createItemListSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Movie Reviews',
  description:
    'Browse movie reviews, critic ratings, audience scores, verdicts, pros and cons, and aggregated entertainment insights.',
  path: '/reviews',
  keywords: ['movie reviews', 'film ratings', 'critic reviews', 'audience scores'],
});

export default async function ReviewsPage() {
  const [reviewPage, availableMovies] = await Promise.all([
    getReviews({ page: 1, limit: 12 }),
    getAvailableForReviewMovies({ limit: 20 }),
  ]);

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Movie Reviews', path: '/reviews' },
          ]),
          createItemListSchema(
            'Movie Reviews',
            '/reviews',
            reviewPage.data.map((review: any) => ({
              name: review.title,
              path: `/reviews/${review.slug}`,
              image: review.poster || review.backdropImage,
              description: review.excerpt,
            }))
          ),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-background pt-32">
        <ReviewsInteractive
          initialReviews={reviewPage.data}
          initialMeta={reviewPage.pagination}
          initialAvailableMovies={availableMovies}
          initialLoaded
        />
      </main>
      <PublicFooter />
    </>
  );
}
