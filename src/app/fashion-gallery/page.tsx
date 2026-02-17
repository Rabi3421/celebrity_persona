import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import FeaturedOutfit from './components/FeaturedOutfit';
import FashionGalleryInteractive from './components/FashionGalleryInteractive';

export const metadata: Metadata = {
  title: 'Fashion Gallery - CelebrityPersona',
  description:
    'Shop celebrity-inspired outfits with direct buying links. Browse red carpet looks, airport style, casual wear, and party outfits from your favorite stars.',
};

export default function FashionGalleryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <FeaturedOutfit />
        <FashionGalleryInteractive />
      </main>
      <Footer />
    </>
  );
}