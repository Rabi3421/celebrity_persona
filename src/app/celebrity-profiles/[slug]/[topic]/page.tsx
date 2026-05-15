import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import JsonLd from '@/components/seo/JsonLd';
import dbConnect from '@/lib/mongodb';
import { normalizeStoredNetWorth } from '@/lib/netWorth';
import Celebrity from '@/models/Celebrity';
import CelebrityNews from '@/models/CelebrityNews';
import CelebrityOutfit from '@/models/CelebrityOutfit';
import Movie from '@/models/Movie';
import MovieReview from '@/models/MovieReview';
import {
  buildProgrammaticCelebrityPageModel,
  createProgrammaticBreadcrumbs,
  createProgrammaticCelebrityMetadata,
  hasProgrammaticCelebrityContent,
  normalizeProgrammaticCelebrityTopic,
  type ProgrammaticCelebrityResources,
  type ProgrammaticCelebritySection,
  type ProgrammaticRelatedItem,
} from '@/lib/seo/programmaticCelebrity';
import { createNoIndexMetadata } from '@/lib/seo/dynamicMetadata';
import {
  createBreadcrumbSchema,
  createFAQPageSchema,
  createItemListSchema,
  createPersonSchema,
  createWebPageSchema,
} from '@/lib/seo/structuredData';
import { stripHtml, truncate } from '@/lib/seo/site';

export const revalidate = 900;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string; topic: string }>;
};

type PlainDoc = Record<string, any>;

const RELEASED_STATUSES = ['released', 'now showing', 'now playing', 'in theatres', 'in theaters'];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textRegex(value: string): RegExp {
  return new RegExp(escapeRegex(value), 'i');
}

function isReleasedMovie(movie: PlainDoc): boolean {
  const releaseDate = movie.releaseDate ? new Date(movie.releaseDate) : null;
  const status = String(movie.status || '').toLowerCase();

  return (releaseDate instanceof Date && !Number.isNaN(releaseDate.getTime()) && releaseDate <= new Date()) ||
    RELEASED_STATUSES.some((item) => status.includes(item));
}

function movieHref(movie: PlainDoc): string {
  return `${isReleasedMovie(movie) ? '/movie-details' : '/upcoming-movies'}/${movie.slug}`;
}

function publicCelebrityFilter() {
  return { $or: [{ status: { $exists: false } }, { status: 'published' }] };
}

function publicOutfitFilter() {
  return {
    $and: [
      { $or: [{ isActive: { $exists: false } }, { isActive: true }] },
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
    ],
  };
}

function indexableSeoFilter(field: 'seo' | 'seoData') {
  return {
    $and: [
      { $or: [{ [`${field}.noindex`]: { $exists: false } }, { [`${field}.noindex`]: { $ne: true } }] },
      { $or: [{ [`${field}.robotsIndex`]: { $exists: false } }, { [`${field}.robotsIndex`]: { $ne: false } }] },
      { [`${field}.robots`]: { $not: /noindex/i } },
    ],
  };
}

function clean(value?: string, length = 170): string {
  return truncate(stripHtml(value || ''), length);
}

function relatedItem(title: string, href: string | undefined, options: Partial<ProgrammaticRelatedItem> = {}): ProgrammaticRelatedItem {
  return { title, href, ...options };
}

function movieItem(movie: PlainDoc): ProgrammaticRelatedItem {
  return relatedItem(movie.title, movieHref(movie), {
    image: movie.poster || movie.backdrop,
    eyebrow: movie.releaseDate ? String(new Date(movie.releaseDate).getFullYear()) : 'Movie',
    description: clean(movie.synopsis || movie.plotSummary || (movie.director ? `Directed by ${movie.director}` : ''), 180),
  });
}

function outfitItem(outfit: PlainDoc): ProgrammaticRelatedItem {
  return relatedItem(outfit.title, `/celebrity-outfits/${outfit.slug}`, {
    image: outfit.images?.[0],
    eyebrow: outfit.brand || outfit.category || 'Celebrity outfit',
    description: clean(outfit.description || outfit.event || outfit.designer, 180),
  });
}

function newsItem(article: PlainDoc): ProgrammaticRelatedItem {
  return relatedItem(article.title, `/celebrity-news/${article.slug}`, {
    image: article.thumbnail || article.images?.[0],
    eyebrow: article.category || 'Celebrity news',
    description: clean(article.excerpt || article.content, 180),
  });
}

function reviewItem(review: PlainDoc): ProgrammaticRelatedItem {
  return relatedItem(review.title, `/reviews/${review.slug}`, {
    image: review.poster || review.backdropImage,
    eyebrow: review.rating ? `${review.rating}/10 review` : review.movieTitle || 'Movie review',
    description: clean(review.excerpt || review.verdict || review.content, 180),
  });
}

const fetchCelebrity = cache(async (slug: string) => {
  try {
    await dbConnect();
    const doc: any = await Celebrity.findOne({
      slug: slug.toLowerCase().trim(),
      $and: [publicCelebrityFilter(), indexableSeoFilter('seo')],
    }).select('-__v').lean();

    if (!doc) return null;
    const celebrity: Record<string, any> = { ...doc, id: String(doc._id) };
    delete celebrity._id;
    celebrity.netWorth = normalizeStoredNetWorth(celebrity.netWorth);
    return JSON.parse(JSON.stringify(celebrity));
  } catch {
    return null;
  }
});

const fetchProgrammaticResources = cache(async (slug: string, topic: string): Promise<ProgrammaticCelebrityResources> => {
  const celebrity = await fetchCelebrity(slug);
  const normalizedTopic = normalizeProgrammaticCelebrityTopic(topic);
  if (!celebrity || !normalizedTopic) return {};

  try {
    await dbConnect();
    const id = celebrity.id;
    const name = String(celebrity.name || '');
    const movieNames = Array.isArray(celebrity.movies)
      ? celebrity.movies.map((movie: PlainDoc) => String(movie.name || '').trim()).filter(Boolean)
      : [];
    const movieRegexes = movieNames.slice(0, 10).map(textRegex);

    const shouldFetchMovies = normalizedTopic === 'movies' || normalizedTopic === 'net-worth';
    const shouldFetchReviews = normalizedTopic === 'movies' || normalizedTopic === 'faqs';
    const shouldFetchOutfits = normalizedTopic === 'fashion' || normalizedTopic === 'faqs';
    const shouldFetchNews = ['awards', 'controversies', 'relationships', 'net-worth', 'faqs'].includes(normalizedTopic);

    const [movieDocs, reviewDocs, outfitDocs, newsDocs] = await Promise.all([
      shouldFetchMovies
        ? Movie.find({
            $and: [
              { slug: { $type: 'string', $ne: '' } },
              indexableSeoFilter('seoData'),
              {
                $or: [
                  { 'cast.name': textRegex(name) },
                  { director: textRegex(name) },
                  { writers: textRegex(name) },
                  { producers: textRegex(name) },
                  ...(movieRegexes.length ? [{ title: { $in: movieRegexes } }] : []),
                ],
              },
            ],
          })
            .select('title slug releaseDate poster backdrop genre director status synopsis plotSummary anticipationScore updatedAt')
            .sort({ releaseDate: -1, anticipationScore: -1, updatedAt: -1 })
            .limit(12)
            .lean()
        : [],
      shouldFetchReviews
        ? MovieReview.find({
            $and: [
              { status: 'published', slug: { $type: 'string', $ne: '' } },
              {
                $or: [
                  { title: textRegex(name) },
                  { movieTitle: textRegex(name) },
                  { 'movieDetails.cast.name': textRegex(name) },
                  ...(movieRegexes.length ? [{ movieTitle: { $in: movieRegexes } }] : []),
                ],
              },
            ],
          })
            .select('title slug movieTitle poster backdropImage rating excerpt verdict content publishDate featured')
            .sort({ featured: -1, publishDate: -1, rating: -1, createdAt: -1 })
            .limit(8)
            .lean()
        : [],
      shouldFetchOutfits
        ? CelebrityOutfit.find({
            $and: [
              publicOutfitFilter(),
              indexableSeoFilter('seo'),
              {
                $or: [
                  ...(id ? [{ celebrity: id }] : []),
                  { title: textRegex(name) },
                  { description: textRegex(name) },
                ],
              },
            ],
          })
            .select('title slug images event designer brand category description updatedAt')
            .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1 })
            .limit(10)
            .lean()
        : [],
      shouldFetchNews
        ? CelebrityNews.find({
            $and: [
              { status: 'published', slug: { $type: 'string', $ne: '' } },
              indexableSeoFilter('seo'),
              {
                $or: [
                  ...(id ? [{ celebrity: id }] : []),
                  { title: textRegex(name) },
                  { excerpt: textRegex(name) },
                  { content: textRegex(name) },
                ],
              },
            ],
          })
            .select('title slug thumbnail images category excerpt content publishDate featured')
            .sort({ featured: -1, publishDate: -1, createdAt: -1 })
            .limit(8)
            .lean()
        : [],
    ]);

    const movies = JSON.parse(JSON.stringify(movieDocs)) as PlainDoc[];
    return {
      moviePages: movies.filter(isReleasedMovie).map(movieItem),
      upcomingMovies: movies.filter((movie) => !isReleasedMovie(movie)).map(movieItem),
      reviews: (JSON.parse(JSON.stringify(reviewDocs)) as PlainDoc[]).map(reviewItem),
      outfits: (JSON.parse(JSON.stringify(outfitDocs)) as PlainDoc[]).map(outfitItem),
      news: (JSON.parse(JSON.stringify(newsDocs)) as PlainDoc[]).map(newsItem),
    };
  } catch {
    return {};
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, topic } = await params;
  const normalizedTopic = normalizeProgrammaticCelebrityTopic(topic);
  const celebrity = await fetchCelebrity(slug);

  if (!celebrity || !normalizedTopic) {
    return createNoIndexMetadata(
      'Celebrity Topic Not Found',
      'The celebrity topic page you are looking for does not exist.',
      '/celebrity-profiles'
    );
  }

  const resources = await fetchProgrammaticResources(slug, normalizedTopic);
  if (!hasProgrammaticCelebrityContent(celebrity, normalizedTopic, resources)) {
    return createNoIndexMetadata(
      `${celebrity.name} ${normalizedTopic}`,
      `This topic page does not have enough unique information to be indexed.`,
      `/celebrity-profiles/${celebrity.slug}`
    );
  }

  return createProgrammaticCelebrityMetadata(celebrity, normalizedTopic, resources);
}

function FactGrid({ facts }: { facts: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{fact.label}</dt>
          <dd className="mt-2 text-sm font-medium leading-6 text-white">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ItemGrid({ items }: { items: ProgrammaticRelatedItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const content = (
          <article className="h-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition-colors hover:border-primary/50">
            {item.image && (
              <div className="relative aspect-[16/10] bg-white/5">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
                  quality={70}
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              {item.eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{item.eyebrow}</p>
              )}
              <h3 className="mt-2 font-playfair text-lg font-semibold leading-snug text-white">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm leading-6 text-neutral-400">{item.description}</p>}
            </div>
          </article>
        );

        return item.href ? (
          <Link key={`${item.href}-${item.title}`} href={item.href} className="block h-full">
            {content}
          </Link>
        ) : (
          <div key={item.title} className="h-full">{content}</div>
        );
      })}
    </div>
  );
}

function DataTable({ table }: { table: NonNullable<ProgrammaticCelebritySection['table']> }) {
  return (
    <div className="touch-scroll-x rounded-2xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-white/[0.04]">
          <tr>
            {table.headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`} className="hover:bg-white/[0.025]">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="border-t border-white/[0.06] px-4 py-4 align-top text-neutral-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqList({ faqs }: { faqs: NonNullable<ProgrammaticCelebritySection['faqs']> }) {
  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <section key={faq.question} className="rounded-xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold leading-7 text-white">{faq.question}</h3>
          <p className="mt-3 text-sm leading-7 text-neutral-300">{faq.answer}</p>
        </section>
      ))}
    </div>
  );
}

function ProgrammaticSectionView({ section }: { section: ProgrammaticCelebritySection }) {
  return (
    <section id={section.id} className="min-w-0 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 md:p-7">
      {section.eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{section.eyebrow}</p>
      )}
      <h2 className="font-playfair text-3xl font-bold leading-tight text-white md:text-4xl">{section.heading}</h2>
      {section.description && <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-400">{section.description}</p>}
      {section.body && <p className="mt-5 text-base leading-8 text-neutral-300">{section.body}</p>}
      <div className="mt-6">
        {section.facts && <FactGrid facts={section.facts} />}
        {section.table && <DataTable table={section.table} />}
        {section.items && <ItemGrid items={section.items} />}
        {section.faqs && <FaqList faqs={section.faqs} />}
      </div>
    </section>
  );
}

export default async function ProgrammaticCelebrityTopicPage({ params }: PageProps) {
  const { slug, topic } = await params;
  const normalizedTopic = normalizeProgrammaticCelebrityTopic(topic);
  if (!normalizedTopic) notFound();

  const celebrity = await fetchCelebrity(slug);
  if (!celebrity) notFound();

  const resources = await fetchProgrammaticResources(slug, normalizedTopic);
  if (!hasProgrammaticCelebrityContent(celebrity, normalizedTopic, resources)) notFound();

  const model = buildProgrammaticCelebrityPageModel(celebrity, normalizedTopic, resources);
  const breadcrumbItems = createProgrammaticBreadcrumbs(celebrity, normalizedTopic);
  const schemaItems = [
    createPersonSchema(celebrity),
    createWebPageSchema({
      name: model.title,
      description: model.description,
      path: model.path,
      image: model.image,
    }),
    createBreadcrumbSchema(breadcrumbItems),
    ...(model.itemList.filter((item) => item.href).length > 0
      ? [
          createItemListSchema(
            `${celebrity.name} ${model.label}`,
            model.path,
            model.itemList
              .filter((item) => item.href)
              .map((item) => ({
                name: item.title,
                path: item.href!,
                image: item.image,
                description: item.description,
              }))
          ),
        ]
      : []),
    ...(model.faqs.length > 0 ? [createFAQPageSchema(model.faqs, model.path)] : []),
  ];

  return (
    <>
      <JsonLd data={schemaItems} />
      <PublicHeader />
      <main className="min-h-screen bg-background text-neutral-200">
        <article>
          <header className="relative isolate overflow-hidden pt-28 md:pt-32">
            {model.image && (
              <Image
                src={model.image}
                alt={`${celebrity.name} ${model.label}`}
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                quality={80}
                className="pointer-events-none -z-10 object-cover object-top opacity-45"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-background/25" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/70 to-transparent" />

            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:px-10 md:pb-18">
              <nav aria-label="Breadcrumb" className="mb-10 text-sm text-neutral-400">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;
                    return (
                      <li key={item.path} className="flex items-center gap-2">
                        {index > 0 && <span aria-hidden="true">/</span>}
                        {isLast ? (
                          <span aria-current="page" className="text-white">{item.name}</span>
                        ) : (
                          <Link href={item.path} className="hover:text-white">{item.name}</Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Programmatic Celebrity SEO</p>
              <h1 className="max-w-5xl font-playfair text-3xl font-bold leading-[1.08] text-white min-[390px]:text-4xl sm:text-5xl md:text-6xl">
                {model.h1}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-300 md:text-lg">{model.intro}</p>
            </div>
          </header>

          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="min-w-0 space-y-8">
              {model.sections.map((section) => (
                <ProgrammaticSectionView key={section.id} section={section} />
              ))}
            </div>

            <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
              <nav aria-labelledby="topic-toc" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <h2 id="topic-toc" className="font-playfair text-xl font-bold text-white">On This Page</h2>
                <ol className="mt-4 space-y-2 text-sm">
                  {model.sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="block rounded-lg px-3 py-2 text-neutral-400 hover:bg-white/[0.05] hover:text-white">
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <h2 className="font-playfair text-xl font-bold text-white">Profile Links</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <Link href={`/celebrity-profiles/${celebrity.slug}`} className="block rounded-lg px-3 py-2 text-neutral-400 hover:bg-white/[0.05] hover:text-white">
                    {celebrity.name} full profile
                  </Link>
                  <Link href={`/celebrity-news?celebrity=${encodeURIComponent(celebrity.name)}`} className="block rounded-lg px-3 py-2 text-neutral-400 hover:bg-white/[0.05] hover:text-white">
                    {celebrity.name} news articles
                  </Link>
                  <Link href={`/fashion-gallery?celebrity=${encodeURIComponent(celebrity.name)}`} className="block rounded-lg px-3 py-2 text-neutral-400 hover:bg-white/[0.05] hover:text-white">
                    {celebrity.name} fashion gallery
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
