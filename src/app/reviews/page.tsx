import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ReviewsInteractive from './components/ReviewsInteractive';

export const metadata: Metadata = {
  title: 'Reviews - CelebrityPersona',
  description:
    'Browse user ratings, detailed reviews, and aggregated IMDb and Rotten Tomatoes scores. Filter reviews by rating to find the most helpful insights.',
};

export default function ReviewsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <ReviewsInteractive />
      </main>
      <Footer />
    </>
  );
}