import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import InternalLinks from '@/components/seo/InternalLinks';
import CelebrityProfileDetail from './components/CelebrityProfileDetail';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import { normalizeStoredNetWorth } from '@/lib/netWorth';
import { createCelebrityProfileMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { getCelebrityInternalLinks } from '@/lib/seo/internalLinks';
import { createBreadcrumbSchema, createPersonSchema } from '@/lib/seo/structuredData';

export const revalidate = 900;

const fetchCelebrity = cache(async (slug: string) => {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = await Celebrity.findOne({
      slug: slug.toLowerCase().trim(),
      $or: [{ status: { $exists: false } }, { status: 'published' }],
    }).select('-__v').lean();
    if (!doc) return null;
    Celebrity.findByIdAndUpdate(doc._id, { $inc: { viewCount: 1 } }).exec();
    const celebrity: Record<string, any> = { ...doc, id: String(doc._id) };
    delete celebrity._id;
    celebrity.netWorth = normalizeStoredNetWorth(celebrity.netWorth);
    return JSON.parse(JSON.stringify(celebrity));
  } catch {
    return null;
  }
});

// ── SEO metadata (server-generated per slug) ──────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const celeb = await fetchCelebrity(slug);
  if (!celeb) {
    return createNoIndexMetadata(
      'Celebrity Not Found',
      'The celebrity profile you are looking for does not exist.',
      '/celebrity-profiles'
    );
  }

  return createCelebrityProfileMetadata(celeb);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CelebrityProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const celeb = await fetchCelebrity(slug);
  if (!celeb) notFound();
  const internalLinks = await getCelebrityInternalLinks(celeb);

  return (
    <>
      <JsonLd
        data={[
          createPersonSchema(celeb),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Celebrity Profiles', path: '/celebrity-profiles' },
            { name: celeb.name, path: `/celebrity-profiles/${celeb.slug}` },
          ]),
        ]}
      />
      <PublicHeader />
      <main className="min-h-screen bg-background">
        <CelebrityProfileDetail celebrity={celeb} />
        <InternalLinks
          links={internalLinks}
          title={`More About ${celeb.name}`}
          description={`Explore ${celeb.name} profiles, movie pages, outfit articles, and celebrity news connected by topic and editorial relevance.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
