import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import UserOutfitDetail from './components/UserOutfitDetail';
import dbConnect from '@/lib/mongodb';
import UserOutfit from '@/models/UserOutfit';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outfit: any = await UserOutfit.findOne(
      { $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }] }
    ).lean();
    if (outfit) {
      return {
        title: `${outfit.title} - CelebrityPersona`,
        description: outfit.description || `Browse ${outfit.title} on CelebrityPersona`,
        openGraph: { images: outfit.images?.[0] ? [outfit.images[0]] : [] },
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
