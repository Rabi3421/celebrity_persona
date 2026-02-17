import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ArticleDetail from '../components/ArticleDetail';

export const metadata: Metadata = {
  title: 'Article Details - Celebrity News',
  description: 'Read the full celebrity news article with exclusive details and celebrity tags.',
};

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <ArticleDetail articleId={params.id} />
      </main>
      <Footer />
    </>
  );
}