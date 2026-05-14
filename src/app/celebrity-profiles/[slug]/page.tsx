import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import JsonLd from '@/components/seo/JsonLd';
import CelebrityProfileDetail from './components/CelebrityProfileDetail';
import dbConnect from '@/lib/mongodb';
import Celebrity from '@/models/Celebrity';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import CelebrityNews from '@/models/CelebrityNews';
import Movie from '@/models/Movie';
import { normalizeStoredNetWorth } from '@/lib/netWorth';
import { createCelebrityProfileMetadata, createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import { createBreadcrumbSchema, createPersonSchema } from '@/lib/seo/structuredData';

async function fetchCelebrity(slug: string) {
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
}

// ── Fetch helpers (all run server-side at render time) ────────────────────────
async function fetchRelatedOutfits(name: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: any[] = await CelebrityOutfit.find({ isActive: true })
      .populate({ path: 'celebrity', match: { name: { $regex: name, $options: 'i' } }, select: 'name slug' })
      .limit(4).lean();
    const results = docs.filter((d: any) => d.celebrity);
    return JSON.parse(JSON.stringify(results));
  } catch { return []; }
}

async function fetchRelatedNews(name: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: any[] = await CelebrityNews.find({
      $or: [
        { 'celebrities': { $regex: name, $options: 'i' } },
        { title: { $regex: name, $options: 'i' } },
      ],
      status: 'published',
    }).select('title slug coverImage category publishDate').limit(4).lean();
    return JSON.parse(JSON.stringify(docs));
  } catch { return []; }
}

async function fetchRelatedMovies(name: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: any[] = await Movie.find({
      status: 'released',
      $or: [
        { director: { $regex: name, $options: 'i' } },
        { 'cast.name': { $regex: name, $options: 'i' } },
        { writers: { $regex: name, $options: 'i' } },
        { producers: { $regex: name, $options: 'i' } },
      ],
    }).select('title slug poster backdrop releaseDate').limit(4).lean();
    return JSON.parse(JSON.stringify(docs));
  } catch { return []; }
}

async function fetchRelatedUpcoming(name: string) {
  try {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: any[] = await Movie.find({
      status: { $ne: 'released' },
      $or: [
        { director: { $regex: name, $options: 'i' } },
        { 'cast.name': { $regex: name, $options: 'i' } },
        { writers: { $regex: name, $options: 'i' } },
        { producers: { $regex: name, $options: 'i' } },
      ],
    }).select('title slug poster backdrop releaseDate').limit(4).lean();
    return JSON.parse(JSON.stringify(docs));
  } catch { return []; }
}

// ── RelatedContent component ──────────────────────────────────────────────────
async function RelatedContent({ name, slug }: { name: string; slug: string }) {
  const [outfits, news, movies, upcoming] = await Promise.all([
    fetchRelatedOutfits(name),
    fetchRelatedNews(name),
    fetchRelatedMovies(name),
    fetchRelatedUpcoming(name),
  ]);

  const hasAny =
    outfits.length > 0 || news.length > 0 || movies.length > 0 || upcoming.length > 0;
  if (!hasAny) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-16 py-20 space-y-16 border-t border-white/5">
      <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
        <span className="w-1 h-8 rounded-full bg-primary inline-block flex-shrink-0" />
        More About {name}
      </h2>

      {/* ── Outfits ── */}
      {outfits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-primary">✦</span> Outfits
            </h3>
            <Link
              href={`/fashion-gallery?celebrity=${encodeURIComponent(name)}`}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {outfits.map((o: any) => (
              <Link
                key={o.id || o._id}
                href={`/celebrity-outfits/${o.slug}`}
                className="group glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
              >
                {o.images?.[0] || o.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.images?.[0] || o.coverImage}
                    alt={o.title}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full aspect-square bg-white/5 flex items-center justify-center text-neutral-600 text-3xl">
                    👗
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white line-clamp-1">{o.title}</p>
                  {o.brand && <p className="text-xs text-neutral-500 mt-0.5">{o.brand}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── News ── */}
      {news.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-primary">✦</span> Latest News
            </h3>
            <Link
              href={`/celebrity-news?celebrity=${encodeURIComponent(name)}`}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {news.map((n: any) => (
              <Link
                key={n._id}
                href={`/celebrity-news/${n._id}`}
                className="group glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all flex flex-col"
              >
                {n.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.coverImage}
                    alt={n.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  {n.category && (
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      {n.category}
                    </span>
                  )}
                  <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
                    {n.title}
                  </p>
                  {n.publishDate && (
                    <p className="text-xs text-neutral-500 mt-auto">
                      {new Date(n.publishDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Movies ── */}
      {movies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-primary">✦</span> Movies
            </h3>
            <Link
              href={`/movie-details?celebrity=${encodeURIComponent(name)}`}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {movies.map((m: any) => (
              <Link
                key={m._id}
                href={`/movie-details/${m.slug}`}
                className="group glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
              >
                {m.poster || m.backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.poster || m.backdrop}
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-neutral-600 text-3xl">
                    🎬
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white line-clamp-1">{m.title}</p>
                  {m.releaseDate && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(m.releaseDate).getFullYear()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming Movies ── */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-primary">✦</span> Upcoming Movies
            </h3>
            <Link
              href={`/upcoming-movies?celebrity=${encodeURIComponent(name)}`}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {upcoming.map((m: any) => (
              <Link
                key={m._id}
                href={`/upcoming-movies/${m.slug}`}
                className="group glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
              >
                {m.poster || m.backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.poster || m.backdrop}
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-neutral-600 text-3xl">
                    🎬
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white line-clamp-1">{m.title}</p>
                  <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                    {m.releaseDate
                      ? new Date(m.releaseDate).toLocaleDateString('en-IN', {
                          month: 'short', year: 'numeric',
                        })
                      : 'Coming Soon'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

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
      <Header />
      <main className="min-h-screen bg-background">
        <CelebrityProfileDetail celebrity={celeb} />
        <RelatedContent name={celeb.name} slug={celeb.slug} />
      </main>
      <Footer />
    </>
  );
}
