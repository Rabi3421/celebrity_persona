import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import UserOutfitDetail from './components/UserOutfitDetail';
import { absoluteUrl, createBreadcrumbJsonLd, truncate } from '@/lib/seo/site';
import { createCommunityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getPublicUserOutfit } from '@/lib/seo/publicData';

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

  const outfitSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: outfit.title,
    description: outfit.description || truncate(outfit.title, 155),
    image: outfit.images?.map((image: string) => absoluteUrl(image)) || [],
    url: absoluteUrl(`/user-outfits/${outfit.slug}`),
    creator: outfit.userId?.name ? { '@type': 'Person', name: outfit.userId.name } : undefined,
    datePublished: outfit.createdAt,
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: outfit.views || 0 },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: outfit.likes?.length || 0 },
    ],
  };

  return (
    <>
      <JsonLd
        data={[
          outfitSchema,
          createBreadcrumbJsonLd([
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
