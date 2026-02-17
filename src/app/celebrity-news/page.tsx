import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CelebrityNewsInteractive from './components/CelebrityNewsInteractive';

export const metadata: Metadata = {
  title: 'Celebrity News - CelebrityPersona',
  description:
    'Stay updated with the latest celebrity news, featured articles, trending headlines, and exclusive entertainment updates from your favorite stars.',
};

export default function CelebrityNewsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <CelebrityNewsInteractive />
      </main>
      <Footer />
    </>
  );
}