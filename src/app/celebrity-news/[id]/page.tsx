import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ArticleDetail from '../components/ArticleDetail';

export const metadata: Metadata = {
  title: 'Article Details - Celebrity News',
  description: 'Read the full celebrity news article with exclusive details and celebrity tags.',
};

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <ArticleDetail articleId={id} />
      </main>
      <Footer />
    </>
  );
}