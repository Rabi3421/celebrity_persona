import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CelebrityProfilesInteractive from './components/CelebrityProfilesInteractive';

export const metadata: Metadata = {
  title: 'Celebrity Profiles - CelebrityPersona',
  description:
    'Explore comprehensive celebrity profiles with detailed biographies, career timelines, fashion looks, and filmography. Wikipedia-level information on your favorite stars.',
};

export default function CelebrityProfilesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <CelebrityProfilesInteractive />
      </main>
      <Footer />
    </>
  );
}