import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import FashionGalleryInteractive from './components/FashionGalleryInteractive';
import { createMetadata } from '@/lib/seo/site';
import { getCommunityOutfits, getOutfitList } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createItemListSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

export const metadata: Metadata = createMetadata({
  title: 'Celebrity Fashion Gallery',
  description:
    'Shop celebrity-inspired outfits with buying links, brand details, designer information, and curated red carpet, airport, casual, and party looks.',
  path: '/fashion-gallery',
  keywords: ['celebrity outfits', 'celebrity fashion', 'shop the look', 'red carpet style'],
});

export default async function FashionGalleryPage() {
  const [outfitPage, communityOutfits] = await Promise.all([
    getOutfitList({ page: 1, limit: 12 }),
    getCommunityOutfits({ limit: 8 }),
  ]);
  const featured = outfitPage.data.find((outfit: any) => outfit.isFeatured) || outfitPage.data[0] || null;

  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Fashion Gallery', path: '/fashion-gallery' },
          ]),
          createItemListSchema(
            'Celebrity Fashion Gallery',
            '/fashion-gallery',
            outfitPage.data.map((outfit: any) => ({
              name: outfit.title,
              path: `/celebrity-outfits/${outfit.slug}`,
              image: outfit.images?.[0],
              description: outfit.description,
            }))
          ),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <FashionGalleryInteractive
          initialOutfits={outfitPage.data}
          initialFeatured={featured}
          initialCommunityOutfits={communityOutfits}
          initialPage={outfitPage.page}
          initialPages={outfitPage.pages}
          initialTotal={outfitPage.total}
          initialLoaded
        />
      </main>
      <Footer />
    </>
  );
}
