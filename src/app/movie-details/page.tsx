import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import MovieDetailsInteractive from './components/MovieDetailsInteractive';
import { createMetadata } from '@/lib/seo/site';
import { getReleasedMovies } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createItemListSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Movie Details',
  description: 'Explore released movies with synopsis, cast, director, ratings, trailers, user reactions, and review links.',
  path: '/movie-details',
  keywords: ['movie details', 'released movies', 'movie cast', 'movie reviews'],
});

export default async function MovieDetailsPage() {
  const moviePage = await getReleasedMovies({ page: 1, limit: 12 });
  const featured = moviePage.data.find((movie: any) => movie.featured) || moviePage.data[0] || null;

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Movie Details', path: '/movie-details' },
          ]),
          createItemListSchema(
            'Movie Details',
            '/movie-details',
            moviePage.data.map((movie: any) => ({
              name: movie.title,
              path: `/movie-details/${movie.slug}`,
              image: movie.poster || movie.backdrop,
              description: movie.synopsis,
            }))
          ),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-[#0a0a14] pt-20">
        <MovieDetailsInteractive
          initialMovies={moviePage.data}
          initialPagination={moviePage.pagination}
          initialFeatured={featured}
          initialLoaded
        />
      </main>
      <PublicFooter />
    </>
  );
}
