import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import CelebrityProfilesInteractive from './components/CelebrityProfilesInteractive';
import { createMetadata } from '@/lib/seo/site';
import { getCelebrityList } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createItemListSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Celebrity Profiles',
  description:
    'Explore comprehensive celebrity profiles with biographies, career timelines, fashion looks, filmography, and verified entertainment facts.',
  path: '/celebrity-profiles',
  keywords: ['celebrity profiles', 'celebrity biography', 'filmography', 'celebrity fashion'],
});

export default async function CelebrityProfilesPage() {
  const [{ celebrities, pagination }, trending] = await Promise.all([
    getCelebrityList({ page: 1, limit: 12 }),
    getCelebrityList({ page: 1, limit: 6 }),
  ]);
  const trendingCelebrities = [...trending.celebrities].sort(
    (a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0)
  );

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Celebrity Profiles', path: '/celebrity-profiles' },
          ]),
          createItemListSchema(
            'Celebrity Profiles',
            '/celebrity-profiles',
            celebrities.map((celebrity) => ({
              name: celebrity.name,
              path: `/celebrity-profiles/${celebrity.slug}`,
              image: celebrity.profileImage || celebrity.coverImage,
              description: celebrity.introduction,
            }))
          ),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <CelebrityProfilesInteractive
          initialCelebrities={celebrities}
          initialPagination={pagination}
          initialTrending={trendingCelebrities}
          initialLoaded
        />
      </main>
      <Footer />
    </>
  );
}
