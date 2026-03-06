import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import UserOutfitDetail from './components/UserOutfitDetail';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4028';
    const res = await fetch(`${baseUrl}/api/user-outfits/${slug}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success && json.outfit) {
      return {
        title: `${json.outfit.title} - CelebrityPersona`,
        description: json.outfit.description || `Browse ${json.outfit.title} on CelebrityPersona`,
        openGraph: { images: json.outfit.images?.[0] ? [json.outfit.images[0]] : [] },
      };
    }
  } catch { /* fallback */ }
  return { title: 'User Outfit - CelebrityPersona' };
}

export default async function UserOutfitPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-28">
        <UserOutfitDetail slug={slug} />
      </main>
      <Footer />
    </>
  );
}
