import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import UpcomingMoviesInteractive from './components/UpcomingMoviesInteractive';
import { createBreadcrumbJsonLd, createItemListJsonLd, createMetadata } from '@/lib/seo/site';
import { getUpcomingMovies } from '@/lib/seo/publicData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Upcoming Movies 2026',
  description:
    'Discover upcoming movies with trailers, release dates, cast details, genres, tickets, and anticipation scores.',
  path: '/upcoming-movies',
  keywords: ['upcoming movies 2026', 'movie trailers', 'release dates', 'cinema releases'],
});

export default async function UpcomingMoviesPage() {
  const moviePage = await getUpcomingMovies({ page: 1, limit: 12 });

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Upcoming Movies', path: '/upcoming-movies' },
          ]),
          createItemListJsonLd(
            'Upcoming Movies 2026',
            '/upcoming-movies',
            moviePage.data.map((movie: any) => ({
              name: movie.title,
              path: `/upcoming-movies/${movie.slug}`,
              image: movie.poster || movie.backdrop,
              description: movie.synopsis || movie.plotSummary,
            }))
          ),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <UpcomingMoviesInteractive
          initialMovies={moviePage.data}
          initialTotal={moviePage.total}
          initialPages={moviePage.pages}
          initialPage={moviePage.page}
          initialLoaded
        />
      </main>
      <Footer />
    </>
  );
}
