import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CelebrityOutfitDetail from './components/CelebrityOutfitDetail';
import dbConnect from '@/lib/mongodb';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import '@/models/Celebrity';

interface Props { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://celebritypersona.com';

async function fetchOutfit(slug: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outfit: any = await CelebrityOutfit.findOne({ slug })
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
    return {
      title: 'Outfit Not Found | CelebrityPersona',
      description: 'This celebrity outfit could not be found.',
    };
  }

  const celebName  = typeof o.celebrity === 'object' ? o.celebrity?.name : o.celebrity || 'Celebrity';
  const title      = o.seo?.metaTitle       || `${o.title} | ${celebName} Outfit | CelebrityPersona`;
  const description = o.seo?.metaDescription ||
    o.description?.slice(0, 155) ||
    `Shop ${celebName}'s ${o.title}. ${o.brand ? `Brand: ${o.brand}.` : ''} ${o.price ? `Price: ${o.price}.` : ''} Get the celebrity look now.`;
  const canonical  = o.seo?.canonicalUrl    || `${SITE_URL}/celebrity-outfits/${slug}`;
  const ogImage    = o.seo?.ogImages?.[0]   || o.images?.[0] || '';
  const keywords   = o.seo?.metaKeywords?.join(', ') ||
    [celebName, o.title, o.brand, o.designer, o.category, o.event, 'celebrity outfit', 'shop the look', 'celebrity fashion']
      .filter(Boolean).join(', ');

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url:         canonical,
      siteName:    'CelebrityPersona',
      locale:      'en_US',
      type:        'website',
      ...(ogImage ? { images: [{ url: ogImage, alt: o.title }] } : {}),
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
      site:    '@CelebrityPersona',
    },
  };
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

