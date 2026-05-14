import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import ApiDocsContent from './components/ApiDocsContent';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'API Documentation',
  description:
    'Complete API reference for CelebrityPersona v1. Access celebrity profiles, outfits, news, movies, and reviews programmatically with your API key.',
  path: '/api-docs',
  keywords: ['celebrity API docs', 'entertainment API', 'movie API', 'celebrity data API'],
});

export default function ApiDocsPage() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-background pt-24">
        <ApiDocsContent />
      </main>
      <PublicFooter />
    </>
  );
}
