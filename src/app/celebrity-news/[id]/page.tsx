import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import ArticleDetail from '../components/ArticleDetail';
import {
  absoluteUrl,
  createBreadcrumbJsonLd,
  createMetadata,
  stripHtml,
  truncate,
} from '@/lib/seo/site';
import { getNewsArticle } from '@/lib/seo/publicData';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getNewsArticle(id);
  if (!data) {
    return createMetadata({
      title: 'Article Not Found',
      description: 'The celebrity news article you are looking for could not be found.',
      path: '/celebrity-news',
      noIndex: true,
    });
  }

  const { article } = data;
  const seo = (article as any).seo || {};
  const title = seo.metaTitle || article.title;
  const description = seo.metaDescription || article.excerpt || truncate(article.content, 155);
  const image = seo.ogImages?.[0] || seo.twitterImage || article.thumbnail;

  return createMetadata({
    title,
    description,
    path: `/celebrity-news/${article.slug}`,
    image,
    type: 'article',
    keywords: seo.metaKeywords || article.tags,
    noIndex: seo.noindex,
    publishedTime: article.publishDate,
    modifiedTime: (article as any).updatedAt,
    authors: [seo.authorName || article.author].filter(Boolean),
  });
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getNewsArticle(id);
  if (!data) notFound();

  const { article, related, sidebar } = data;
  const articleUrl = `/celebrity-news/${article.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || truncate(article.content, 200),
    image: article.thumbnail ? [absoluteUrl(article.thumbnail)] : undefined,
    datePublished: article.publishDate,
    dateModified: (article as any).updatedAt || article.publishDate,
    author: { '@type': 'Person', name: article.author || 'CelebrityPersona' },
    publisher: { '@type': 'Organization', name: 'CelebrityPersona' },
    mainEntityOfPage: absoluteUrl(articleUrl),
    articleSection: article.category,
    keywords: article.tags?.join(', '),
    articleBody: stripHtml(article.content).slice(0, 5000),
  };

  return (
    <>
      <JsonLd
        data={[
          articleSchema,
          createBreadcrumbJsonLd([
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
