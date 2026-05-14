import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import CelebrityOutfitDetail from './components/CelebrityOutfitDetail';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { createCelebrityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { createBreadcrumbSchema, createOutfitArticleSchema } from '@/lib/seo/structuredData';
import '@/models/Celebrity';

interface Props { params: Promise<{ slug: string }> }

async function fetchOutfit(slug: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outfit: any = await CelebrityOutfit.findOne({
      slug,
      $and: [
        { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      ],
    })
      .populate('celebrity', 'name slug profileImage')
      .lean();
    if (!outfit) return null;
    const data = {
      ...outfit,
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
}

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
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <CelebrityOutfitDetail slug={slug} prefetchedData={outfit} />
      </main>
      <Footer />
    </>
  );
}
