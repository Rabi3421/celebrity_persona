import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MovieDetailsInteractive from './components/MovieDetailsInteractive';

export const metadata: Metadata = {
  title: 'Movie Details - CelebrityPersona',
  description: 'Explore released movies with synopsis, cast, ratings, user reviews and more.',
};

export default function MovieDetailsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a14] pt-20">
        <MovieDetailsInteractive />
      </main>
      <Footer />
    </>
  );
}