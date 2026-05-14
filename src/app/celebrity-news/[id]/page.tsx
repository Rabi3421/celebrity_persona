import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import ArticleDetail from '../components/ArticleDetail';
import { createNewsArticleMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getNewsInternalLinks } from '@/lib/seo/internalLinks';
import { getNewsArticle } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createNewsArticleSchema } from '@/lib/seo/structuredData';

type Props = { params: Promise<{ id: string }> };
export const revalidate = 900;

const getCachedNewsArticle = cache(getNewsArticle);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getCachedNewsArticle(id);
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
  const data = await getCachedNewsArticle(id);
  if (!data) notFound();

  const { article, related, sidebar } = data;
  const internalLinks = await getNewsInternalLinks(article as any);
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
      <PublicHeader />
      <main className="min-h-screen bg-background pt-32">
        <ArticleDetail
          articleId={article.slug || id}
          initialArticle={article}
          initialRelated={related}
          initialSidebarNews={sidebar}
        />
        <InternalLinks
          links={internalLinks}
          title="More Celebrity News And Style Links"
          description={`Explore celebrity profiles, related news, and outfit articles connected to ${article.title}.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
