import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import HeroSection from './components/HeroSection';
import CelebrityCarousel from './components/CelebrityCarousel';
import FashionBentoGrid from './components/FashionBentoGrid';
import NewsSection from './components/NewsSection';
import MoviesTimeline from './components/MoviesTimeline';
import CommunityUploads from './components/CommunityUploads';
import CTASection from './components/CTASection';

export const metadata: Metadata = {
  title: 'CelebrityPersona - Discover Celebrity Style, Fashion & Movies',
  description:
    'Your one-stop destination for celebrity profiles, fashion inspiration with buying links, entertainment news, and movie updates. Join our community of fashion enthusiasts.',
};

export default function Homepage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroSection />
        <CelebrityCarousel />
        <FashionBentoGrid />
        <NewsSection />
        <MoviesTimeline />
        <CommunityUploads />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}