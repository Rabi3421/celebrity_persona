import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import UserOutfitDetail from './components/UserOutfitDetail';
import { createCommunityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getUserOutfitInternalLinks } from '@/lib/seo/internalLinks';
import { getPublicUserOutfit } from '@/lib/seo/publicData';
import { createBreadcrumbSchema, createCommunityOutfitArticleSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

const getCachedPublicUserOutfit = cache(getPublicUserOutfit);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const outfit: any = await getCachedPublicUserOutfit(slug);
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
  const outfit: any = await getCachedPublicUserOutfit(slug);
  if (!outfit) notFound();
  const internalLinks = await getUserOutfitInternalLinks(outfit);

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
      <PublicHeader />
      <main className="min-h-screen bg-background pt-28">
        <UserOutfitDetail slug={outfit.slug || slug} initialOutfit={outfit} />
        <InternalLinks
          links={internalLinks}
          title="Related Outfit Ideas"
          description={`Explore community outfit pages and celebrity outfit articles connected to ${outfit.title}.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
