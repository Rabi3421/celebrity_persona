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
function PersonSchema({ celeb }: { celeb: Record<string, unknown> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name:        celeb.name,
    url:         `${BASE_URL}/celebrity-profiles/${celeb.slug}`,
    description: celeb.introduction,
    birthDate:   celeb.born,
    birthPlace:  celeb.birthPlace ? { '@type': 'Place', name: celeb.birthPlace } : undefined,
    nationality: celeb.nationality ? { '@type': 'Country', name: celeb.nationality } : undefined,
    jobTitle:    Array.isArray(celeb.occupation) ? (celeb.occupation as string[]).join(', ') : celeb.occupation,
    image:       celeb.profileImage || celeb.coverImage || undefined,
    sameAs: [
      (celeb.socialMedia as Record<string, string>)?.instagram,
      (celeb.socialMedia as Record<string, string>)?.twitter,
      (celeb.socialMedia as Record<string, string>)?.youtube,
      (celeb.socialMedia as Record<string, string>)?.website,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
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
      <PersonSchema celeb={celeb} />
      <Header />
      <main className="min-h-screen bg-background">
        <CelebrityProfileDetail celebrity={celeb} />
      </main>
      <Footer />
    </>
  );
}
