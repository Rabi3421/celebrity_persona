import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import UserOutfitDetail from './components/UserOutfitDetail';
import { createCommunityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getPublicUserOutfit } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createCommunityOutfitArticleSchema } from '@/lib/seo/structuredData';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const outfit: any = await getPublicUserOutfit(slug);
  if (!outfit) {
    return createNoIndexMetadata(
      'User Outfit Not Found',
      'The community outfit you are looking for is not available.',
      '/fashion-gallery'
    );
  }

  return createCommunityOutfitMetadata(outfit);
}

export default async function UserOutfitPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const outfit: any = await getPublicUserOutfit(slug);
  if (!outfit) notFound();

  return (
    <>
      <JsonLd
        data={[
          createCommunityOutfitArticleSchema(outfit),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Fashion Gallery', path: '/fashion-gallery' },
            { name: outfit.title, path: `/user-outfits/${outfit.slug}` },
          ]),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-28">
        <UserOutfitDetail slug={outfit.slug || slug} initialOutfit={outfit} />
      </main>
      <Footer />
    </>
  );
}
