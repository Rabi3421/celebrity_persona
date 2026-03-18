import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CelebrityProfileDetail from './components/CelebrityProfileDetail';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4028';
const API_KEY  = process.env.X_API_KEY || '';

async function fetchCelebrity(slug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/user/celebrities/${slug}`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.celebrity : null;
  } catch {
    return null;
  }
}

// ── SEO metadata (server-generated per slug) ──────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const celeb = await fetchCelebrity(slug);
  if (!celeb) {
    return {
      title: 'Celebrity Not Found | CelebrityPersona',
      description: 'The celebrity profile you are looking for does not exist.',
    };
  }

  const seo   = celeb.seo || {};
  const name  = celeb.name;
  const prof  = Array.isArray(celeb.occupation) ? celeb.occupation.join(', ') : '';
  const intro = celeb.introduction?.slice(0, 155) || `Explore the full profile of ${name} — biography, movies, career, and fashion.`;

  const title       = seo.metaTitle        || `${name} — Celebrity Profile | CelebrityPersona`;
  const description = seo.metaDescription  || intro;
  const canonical   = seo.canonicalUrl     || `${BASE_URL}/celebrity-profiles/${celeb.slug}`;
  const ogImage     = seo.ogImages?.[0]    || celeb.coverImage || celeb.profileImage || '';

  return {
    title,
    description,
    keywords: seo.metaKeywords?.join(', ') || `${name}, celebrity profile, ${prof}`,
    alternates: { canonical },
    robots: {
      index:  !seo.noindex,
      follow: !seo.nofollow,
    },
    openGraph: {
      title:       seo.ogTitle       || title,
      description: seo.ogDescription || description,
      url:         canonical,
      siteName:    seo.ogSiteName    || 'CelebrityPersona',
      locale:      seo.ogLocale      || 'en_US',
      type:        'profile',
      ...(ogImage ? { images: [{ url: ogImage, alt: name }] } : {}),
    },
    twitter: {
      card:        (seo.twitterCard as 'summary_large_image') || 'summary_large_image',
      title:       seo.twitterTitle       || title,
      description: seo.twitterDescription || description,
      ...(seo.twitterImage || ogImage ? { images: [seo.twitterImage || ogImage] } : {}),
      site:    seo.twitterSite    || '@CelebrityPersona',
      creator: seo.twitterCreator || '@CelebrityPersona',
    },
  };
}

// ── JSON-LD structured data ───────────────────────────────────────────────────
function StructuredData({ celeb }: { celeb: Record<string, any> }) {
  const profileUrl = `${BASE_URL}/celebrity-profiles/${celeb.slug}`;
  const sm = (celeb.socialMedia as Record<string, string>) || {};

  // All social / external profile URLs
  const sameAs = [
    sm.instagram,
    sm.twitter,
    sm.facebook,
    sm.youtube,
    sm.tiktok,
    sm.threads,
    sm.imdb,
    sm.wikipedia,
    sm.website,
  ].filter(Boolean);

  // Images array (profile + gallery)
  const images = [
    celeb.profileImage,
    celeb.coverImage,
    ...(Array.isArray(celeb.galleryImages) ? celeb.galleryImages : []),
  ].filter(Boolean);

  // Awards as schema.org Award objects
  const awards = Array.isArray(celeb.awards)
    ? celeb.awards.map((a: Record<string, string>) => ({
        '@type': 'Person',
        award: `${a.title} — ${a.organization} (${a.year})`,
      }))
    : undefined;

  // Spouse
  const spouse = celeb.spouse
    ? { '@type': 'Person', name: celeb.spouse }
    : Array.isArray(celeb.marriages) && celeb.marriages.length > 0
    ? { '@type': 'Person', name: celeb.marriages[0].name }
    : undefined;

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': profileUrl,
    name: celeb.name,
    url: profileUrl,
    description: celeb.introduction
      ? String(celeb.introduction).replace(/<[^>]+>/g, '').slice(0, 300)
      : undefined,
    birthDate: celeb.born,
    birthPlace: celeb.birthPlace
      ? { '@type': 'Place', name: celeb.birthPlace }
      : undefined,
    deathDate: celeb.died || undefined,
    nationality: celeb.nationality
      ? { '@type': 'Country', name: celeb.nationality }
      : undefined,
    jobTitle: Array.isArray(celeb.occupation)
      ? (celeb.occupation as string[]).join(', ')
      : celeb.occupation,
    hasOccupation: Array.isArray(celeb.occupation)
      ? (celeb.occupation as string[]).map((o: string) => ({
          '@type': 'Occupation',
          name: o,
        }))
      : undefined,
    image: images.length > 0 ? images : undefined,
    height: celeb.height
      ? { '@type': 'QuantitativeValue', description: celeb.height }
      : undefined,
    weight: celeb.weight
      ? { '@type': 'QuantitativeValue', description: celeb.weight }
      : undefined,
    award: awards && awards.length > 0 ? awards.map((a: any) => a.award) : undefined,
    spouse,
    parent: Array.isArray(celeb.parents) && celeb.parents.length > 0
      ? (celeb.parents as string[]).map((p: string) => ({ '@type': 'Person', name: p }))
      : undefined,
    children: Array.isArray(celeb.children) && celeb.children.length > 0
      ? (celeb.children as string[]).map((ch: string) => ({ '@type': 'Person', name: ch }))
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    knowsAbout: Array.isArray(celeb.categories) ? celeb.categories : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Celebrity Profiles',
        item: `${BASE_URL}/celebrity-profiles`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: celeb.name,
        item: profileUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CelebrityProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const celeb = await fetchCelebrity(slug);
  if (!celeb) notFound();

  return (
    <>
      <StructuredData celeb={celeb} />
      <Header />
      <main className="min-h-screen bg-background">
        <CelebrityProfileDetail celebrity={celeb} />
      </main>
      <Footer />
    </>
  );
}
