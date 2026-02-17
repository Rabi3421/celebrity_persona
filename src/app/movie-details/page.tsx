import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MovieDetailsInteractive from './components/MovieDetailsInteractive';

export const metadata: Metadata = {
  title: 'Movie Details - CelebrityPersona',
  description:
    'Explore comprehensive movie information with synopsis, cast details, IMDb and Rotten Tomatoes ratings, user reviews, and aggregated scores.',
};

export default function MovieDetailsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <MovieDetailsInteractive />
      </main>
      <Footer />
    </>
  );
}