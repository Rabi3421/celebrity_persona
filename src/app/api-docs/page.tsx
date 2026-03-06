import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ApiDocsContent from './components/ApiDocsContent';

export const metadata: Metadata = {
  title: 'API Documentation – CelebrityPersona',
  description:
    'Complete API reference for CelebrityPersona v1. Access celebrity profiles, outfits, news, movies, and reviews programmatically with your API key.',
};

export default function ApiDocsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <ApiDocsContent />
      </main>
      <Footer />
    </>
  );
}
