import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import ArticleDetail from '../components/ArticleDetail';
import { createNewsArticleMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getNewsArticle } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createNewsArticleSchema } from '@/lib/seo/structuredData';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getNewsArticle(id);
  if (!data) {
    return createNoIndexMetadata(
      'Article Not Found',
      'The celebrity news article you are looking for could not be found.',
      '/celebrity-news'
    );
  }

  return createNewsArticleMetadata(data.article as any);
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getNewsArticle(id);
  if (!data) notFound();

  const { article, related, sidebar } = data;
  const articleUrl = `/celebrity-news/${article.slug}`;

  return (
    <>
      <JsonLd
        data={[
          createNewsArticleSchema(article as any),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Celebrity News', path: '/celebrity-news' },
            { name: article.title, path: articleUrl },
          ]),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <ArticleDetail
          articleId={article.slug || id}
          initialArticle={article}
          initialRelated={related}
          initialSidebarNews={sidebar}
        />
      </main>
      <Footer />
    </>
  );
}
