import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import CelebrityOutfitDetail from './components/CelebrityOutfitDetail';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { publicOutfitFilter, serializeOutfit } from '@/lib/celebrityOutfits';
import { createCelebrityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getOutfitInternalLinks } from '@/lib/seo/internalLinks';
import { createBreadcrumbSchema, createOutfitArticleSchema, createOutfitProductSchemas } from '@/lib/seo/structuredData';
import '@/models/Celebrity';

export const revalidate = 900;

interface Props { params: Promise<{ slug: string }> }

const fetchOutfit = cache(async (slug: string) => {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outfit: any = await CelebrityOutfit.findOne(publicOutfitFilter({ slug }))
      .populate('celebrity primaryCelebrity', 'name slug profileImage')
      .lean();
    if (!outfit) return null;
    const data = {
      ...serializeOutfit(outfit),
      id:         String(outfit._id),
      likes:      (outfit.likes      ?? []).map(String),
      favourites: (outfit.favourites ?? []).map(String),
      comments:   (outfit.comments   ?? []).map((c: any) => ({
        _id:        String(c._id),
        userId:     String(c.userId),
        userName:   c.userName,
        userAvatar: c.userAvatar || '',
        text:       c.text,
        createdAt:  c.createdAt,
      })),
    };
    delete data._id;
    delete data.__v;
    return JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
});

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const o = await fetchOutfit(slug);

  if (!o) {
    return createNoIndexMetadata(
      'Outfit Not Found',
      'This celebrity outfit could not be found.',
      '/fashion-gallery'
    );
  }

  return createCelebrityOutfitMetadata(o);
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function CelebrityOutfitPage({ params }: Props) {
  const { slug } = await params;
  const outfit = await fetchOutfit(slug);
  if (!outfit) notFound();
  const internalLinks = await getOutfitInternalLinks(outfit);
  const celebName = typeof outfit.celebrity === 'object'
    ? outfit.celebrity?.name
    : outfit.celebrity || 'Celebrity';

  return (
    <>
      <JsonLd
        data={[
          createOutfitArticleSchema(outfit),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Fashion Gallery', path: '/fashion-gallery' },
            { name: celebName, path: '/fashion-gallery' },
            { name: outfit.title, path: `/celebrity-outfits/${outfit.slug}` },
          ]),
          ...createOutfitProductSchemas(outfit),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-background pt-24">
        <CelebrityOutfitDetail slug={slug} prefetchedData={outfit} />
        <InternalLinks
          links={internalLinks}
          title={`${celebName} Outfit Links`}
          description={`Explore ${celebName} profile links, related outfit articles, fashion topics, and connected celebrity news.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
