import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import CelebrityNewsInteractive from './components/CelebrityNewsInteractive';
import { createMetadata } from '@/lib/seo/site';
import { getNewsList } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createItemListSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Celebrity News',
  description:
    'Read the latest celebrity news, entertainment updates, featured articles, trending headlines, and exclusive stories.',
  path: '/celebrity-news',
  keywords: ['celebrity news', 'entertainment news', 'trending celebrity headlines'],
});

export default async function CelebrityNewsPage() {
  const newsPage = await getNewsList({ page: 1, limit: 12 });

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Celebrity News', path: '/celebrity-news' },
          ]),
          createItemListSchema(
            'Celebrity News',
            '/celebrity-news',
            newsPage.data.map((article: any) => ({
              name: article.title,
              path: `/celebrity-news/${article.slug || article._id}`,
              image: article.thumbnail,
              description: article.excerpt,
            }))
          ),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-background pt-32">
        <CelebrityNewsInteractive
          initialArticles={newsPage.data}
          initialPage={newsPage.page}
          initialTotalPages={newsPage.pages}
          initialTotalCount={newsPage.total}
          initialLoaded
        />
      </main>
      <PublicFooter />
    </>
  );
}
