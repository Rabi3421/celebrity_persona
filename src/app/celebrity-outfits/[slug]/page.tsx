import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CelebrityOutfitDetail from './components/CelebrityOutfitDetail';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import { createCelebrityOutfitMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import '@/models/Celebrity';

interface Props { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://celebritypersona.com';

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

// ── JSON-LD Product Schema ────────────────────────────────────────────────────
function OutfitSchema({ outfit }: { outfit: Record<string, any> }) {
  const celebName = typeof outfit.celebrity === 'object' ? outfit.celebrity?.name : outfit.celebrity || 'Celebrity';
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        outfit.title,
    description: outfit.description || `${outfit.title} worn by ${celebName}`,
    url:         `${SITE_URL}/celebrity-outfits/${outfit.slug}`,
    image:       outfit.images || [],
    brand:       outfit.brand ? { '@type': 'Brand', name: outfit.brand } : undefined,
    offers: outfit.purchaseLink ? {
      '@type':        'Offer',
      url:            outfit.purchaseLink,
      priceCurrency:  'INR',
      price:          outfit.price?.replace(/[^0-9.]/g, '') || undefined,
      availability:   'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: outfit.brand || outfit.designer || 'CelebrityPersona' },
    } : undefined,
    additionalProperty: [
      outfit.color    && { '@type': 'PropertyValue', name: 'Color',    value: outfit.color },
      outfit.size     && { '@type': 'PropertyValue', name: 'Size',     value: outfit.size },
      outfit.designer && { '@type': 'PropertyValue', name: 'Designer', value: outfit.designer },
      outfit.event    && { '@type': 'PropertyValue', name: 'Event',    value: outfit.event },
    ].filter(Boolean),
  };

  // BreadcrumbList
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',           item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Fashion Gallery', item: `${SITE_URL}/fashion-gallery` },
      { '@type': 'ListItem', position: 3, name: celebName,         item: `${SITE_URL}/fashion-gallery` },
      { '@type': 'ListItem', position: 4, name: outfit.title,      item: `${SITE_URL}/celebrity-outfits/${outfit.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function CelebrityOutfitPage({ params }: Props) {
  const { slug } = await params;
  const outfit = await fetchOutfit(slug);
  if (!outfit) notFound();

  return (
    <>
      <OutfitSchema outfit={outfit} />
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <CelebrityOutfitDetail slug={slug} prefetchedData={outfit} />
      </main>
      <Footer />
    </>
  );
}
