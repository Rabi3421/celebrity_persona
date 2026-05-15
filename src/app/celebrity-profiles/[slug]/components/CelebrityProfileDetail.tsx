import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  cleanProfileText,
  formatCelebrityDate,
  getCelebrityFaqs,
  getCelebrityHeroImage,
  getCelebrityPrimaryImage,
  getCelebrityProfession,
  getCelebrityProfileSections,
  getCelebrityQuickFacts,
  getCelebritySocialLinks,
  getCelebritySummary,
  getCelebrityTopicLinks,
} from '@/lib/seo/celebrityProfile';
import { getCelebrityProgrammaticTopicLinks } from '@/lib/seo/programmaticCelebrity';

interface Movie {
  _id?: string;
  name: string;
  role?: string;
  year?: string;
  director?: string;
  genre?: string;
  description?: string;
}

interface WebSeries {
  _id?: string;
  name: string;
  role?: string;
  seasons?: string;
  year?: string;
  platform?: string;
  genre?: string;
  description?: string;
}

interface TvShow {
  _id?: string;
  name: string;
  role?: string;
  seasons?: string;
  year?: string;
  channel?: string;
  genre?: string;
  description?: string;
}

interface Award {
  _id?: string;
  title: string;
  category?: string;
  year?: string;
  organization?: string;
  work?: string;
  description?: string;
}

interface Marriage {
  name?: string;
  marriedYear?: string;
  divorcedYear?: string;
  currentlyMarried?: boolean;
}

interface SocialMedia {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  threads?: string;
  imdb?: string;
  wikipedia?: string;
  website?: string;
}

export interface FullCelebrity {
  id: string;
  name: string;
  slug: string;
  born?: string;
  birthPlace?: string;
  died?: string;
  age?: number;
  nationality?: string;
  citizenship?: string[];
  occupation?: string[];
  yearsActive?: string;
  height?: string;
  weight?: string;
  bodyMeasurements?: string;
  eyeColor?: string;
  hairColor?: string;
  spouse?: string;
  children?: string[];
  parents?: string[];
  siblings?: string[];
  relatives?: string[];
  education?: string[];
  netWorth?: string;
  introduction?: string;
  earlyLife?: string;
  career?: string;
  personalLife?: string;
  achievements?: string[];
  controversies?: string[];
  philanthropy?: string[];
  trivia?: string[];
  works?: string[];
  movies?: Movie[];
  webSeries?: WebSeries[];
  tvShows?: TvShow[];
  awards?: Award[];
  marriages?: Marriage[];
  quotes?: string[];
  socialMedia?: SocialMedia;
  profileImage?: string;
  coverImage?: string;
  galleryImages?: string[];
  categories?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isVerified?: boolean;
  viewCount?: number;
  popularityScore?: number;
  likes?: string[];
}

function RichHtml({ html, className = '' }: { html?: string; className?: string }) {
  if (!html) return null;

  return (
    <div
      className={`rich-editor-content max-w-none text-neutral-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function joinWithAnd(items: string[]): string {
  const values = items.filter(Boolean);
  if (values.length <= 1) return values[0] || '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function yearSort(a?: string, b?: string) {
  return Number(b || 0) - Number(a || 0);
}

function SectionHeading({
  id,
  eyebrow,
  children,
}: {
  id: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <header className="mb-6 scroll-mt-28" id={id}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-playfair text-3xl font-bold leading-tight text-white md:text-4xl">
        {children}
      </h2>
    </header>
  );
}

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 md:p-7 ${className}`}>
      {children}
    </section>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="touch-scroll-x rounded-2xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-white/[0.04]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-t border-white/[0.06] px-4 py-4 align-top text-neutral-300 ${className}`}>
      {children}
    </td>
  );
}

function FactGrid({ facts }: { facts: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {fact.label}
          </dt>
          <dd className="mt-2 text-sm font-medium leading-6 text-white">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function InlineTopicLinks({ links }: { links: Array<{ label: string; href: string }> }) {
  if (links.length === 0) return null;
  const visibleLinks = links.slice(0, 6);

  return (
    <p className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-neutral-300">
      Explore related pages for{' '}
      {visibleLinks.map((link, index) => {
        const isLast = index === visibleLinks.length - 1;
        return (
          <span key={link.href}>
            <Link href={link.href} className="font-semibold text-primary underline underline-offset-4 hover:text-white">
              {link.label}
            </Link>
            {isLast ? '.' : ', '}
          </span>
        );
      })}
    </p>
  );
}

function SimpleList({ items }: { items?: string[] }) {
  const visibleItems = (items ?? []).filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-neutral-300">
          {item}
        </li>
      ))}
    </ul>
  );
}

function MovieRows({ movies }: { movies: Movie[] }) {
  return (
    <>
      {[...movies].sort((a, b) => yearSort(a.year, b.year)).map((movie, index) => (
        <tr key={movie._id || `${movie.name}-${index}`} className="hover:bg-white/[0.025]">
          <TableCell className="whitespace-nowrap text-neutral-500">{movie.year || '-'}</TableCell>
          <TableCell>
            <h3 className="text-base font-semibold text-white">{movie.name}</h3>
            {movie.description && (
              <p className="mt-2 text-sm leading-6 text-neutral-400">{movie.description}</p>
            )}
          </TableCell>
          <TableCell>{movie.role || '-'}</TableCell>
          <TableCell>{movie.director || '-'}</TableCell>
          <TableCell>{movie.genre || '-'}</TableCell>
        </tr>
      ))}
    </>
  );
}

function WebSeriesRows({ series }: { series: WebSeries[] }) {
  return (
    <>
      {[...series].sort((a, b) => yearSort(a.year, b.year)).map((item, index) => (
        <tr key={item._id || `${item.name}-${index}`} className="hover:bg-white/[0.025]">
          <TableCell className="whitespace-nowrap text-neutral-500">{item.year || '-'}</TableCell>
          <TableCell>
            <h3 className="text-base font-semibold text-white">{item.name}</h3>
            {item.description && (
              <p className="mt-2 text-sm leading-6 text-neutral-400">{item.description}</p>
            )}
          </TableCell>
          <TableCell>{item.role || '-'}</TableCell>
          <TableCell>{item.platform || '-'}</TableCell>
          <TableCell>{item.seasons || '-'}</TableCell>
          <TableCell>{item.genre || '-'}</TableCell>
        </tr>
      ))}
    </>
  );
}

function TvShowRows({ shows }: { shows: TvShow[] }) {
  return (
    <>
      {[...shows].sort((a, b) => yearSort(a.year, b.year)).map((item, index) => (
        <tr key={item._id || `${item.name}-${index}`} className="hover:bg-white/[0.025]">
          <TableCell className="whitespace-nowrap text-neutral-500">{item.year || '-'}</TableCell>
          <TableCell>
            <h3 className="text-base font-semibold text-white">{item.name}</h3>
            {item.description && (
              <p className="mt-2 text-sm leading-6 text-neutral-400">{item.description}</p>
            )}
          </TableCell>
          <TableCell>{item.role || '-'}</TableCell>
          <TableCell>{item.channel || '-'}</TableCell>
          <TableCell>{item.seasons || '-'}</TableCell>
          <TableCell>{item.genre || '-'}</TableCell>
        </tr>
      ))}
    </>
  );
}

function SidebarList({ label, items }: { label: string; items?: string[] }) {
  const visibleItems = (items ?? []).filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-300">
        {visibleItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CelebrityProfileDetail({
  celebrity: c,
  hasRelatedLinks = false,
}: {
  celebrity: FullCelebrity;
  hasRelatedLinks?: boolean;
}) {
  const coverImg = getCelebrityHeroImage(c);
  const profileImg = getCelebrityPrimaryImage(c);
  const profession = getCelebrityProfession(c);
  const summary = getCelebritySummary(c);
  const quickFacts = getCelebrityQuickFacts(c);
  const tocSections = getCelebrityProfileSections(c, { hasRelatedLinks });
  const faqItems = getCelebrityFaqs(c);
  const socialLinks = getCelebritySocialLinks(c);
  const topicLinks = [
    ...getCelebrityProgrammaticTopicLinks(c),
    ...getCelebrityTopicLinks(c),
  ].filter((link, index, list) => list.findIndex((item) => item.href === link.href) === index);

  const hasFilms = (c.movies?.length ?? 0) > 0;
  const hasWebSeries = (c.webSeries?.length ?? 0) > 0;
  const hasTvShows = (c.tvShows?.length ?? 0) > 0;
  const hasFilmography = hasFilms || hasWebSeries || hasTvShows;
  const hasBiography = Boolean(c.earlyLife || c.career || c.personalLife);
  const hasFamily = Boolean(
    c.spouse ||
    (c.marriages?.length ?? 0) > 0 ||
    (c.parents?.length ?? 0) > 0 ||
    (c.siblings?.length ?? 0) > 0 ||
    (c.children?.length ?? 0) > 0 ||
    (c.relatives?.length ?? 0) > 0
  );
  const galleryImages = [
    ...(profileImg ? [profileImg] : []),
    ...(c.galleryImages ?? []),
  ].filter(Boolean);
  const headingTopics = joinWithAnd([
    'Biography',
    hasFilms ? 'Movies' : '',
    'Career',
    c.netWorth ? 'Net Worth' : '',
  ]);
  const heroStats = [
    c.nationality ? { label: 'Nationality', value: c.nationality } : null,
    profession ? { label: 'Occupation', value: profession } : null,
    c.born ? { label: 'Born', value: formatCelebrityDate(c.born) } : null,
    c.netWorth ? { label: 'Net worth', value: c.netWorth } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <article className="min-h-screen bg-background text-neutral-200">
      <header className="relative isolate overflow-hidden pt-28 md:pt-32">
        {coverImg ? (
          <Image
            src={coverImg}
            alt={`${c.name} celebrity profile cover image`}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={82}
            className="pointer-events-none -z-10 object-cover object-top opacity-55"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#20113a] via-[#14091f] to-background" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-background/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/65 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:px-10 md:pb-20">
          <nav aria-label="Breadcrumb" className="mb-10 text-sm text-neutral-400">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-white">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/celebrity-profiles" className="hover:text-white">Celebrity Profiles</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-[220px] truncate text-white">{c.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-10">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap gap-2">
                {c.isFeatured && (
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-black">
                    Featured
                  </span>
                )}
                {(c.categories ?? []).slice(0, 4).map((category) => (
                  <Link
                    key={category}
                    href={`/celebrity-profiles?category=${encodeURIComponent(category)}`}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-300 hover:border-primary/50 hover:text-white"
                  >
                    {category}
                  </Link>
                ))}
              </div>

              <h1 className="font-playfair text-3xl font-bold leading-[1.08] text-white min-[390px]:text-4xl sm:text-5xl md:text-6xl">
                {c.name} {headingTopics}
              </h1>

              {profession && (
                <p className="mt-4 text-base font-semibold text-primary md:text-lg">{profession}</p>
              )}

              <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-300 md:text-lg">
                {summary}
              </p>

              {heroStats.length > 0 && (
                <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        {stat.label}
                      </dt>
                      <dd className="mt-2 text-sm font-semibold leading-6 text-white">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {profileImg && (
              <figure className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl lg:mx-0">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={profileImg}
                    alt={`${c.name} profile photo`}
                    fill
                    sizes="(min-width: 1024px) 320px, 80vw"
                    quality={78}
                    className="object-cover"
                  />
                </div>
                <figcaption className="border-t border-white/10 px-4 py-3 text-xs text-neutral-400">
                  {c.name} profile image
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-8 sm:space-y-10">
          <SectionCard>
            <SectionHeading id="overview" eyebrow="Celebrity profile">
              About {c.name}
            </SectionHeading>
            {c.introduction ? (
              <RichHtml html={c.introduction} className="text-lg leading-8" />
            ) : (
              <p className="text-lg leading-8 text-neutral-300">{summary}</p>
            )}
            <InlineTopicLinks links={topicLinks} />
          </SectionCard>

          {quickFacts.length > 0 && (
            <SectionCard>
              <SectionHeading id="quick-facts" eyebrow="Fast answers">
                {c.name} Quick Facts
              </SectionHeading>
              <FactGrid facts={quickFacts} />
            </SectionCard>
          )}

          {hasBiography && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="biography" eyebrow="Biography">
                {c.name} Biography
              </SectionHeading>
              <div className="space-y-8">
                {c.earlyLife && (
                  <section aria-labelledby="early-life-heading">
                    <h3 id="early-life-heading" className="mb-3 text-xl font-semibold text-white">
                      Early Life and Background
                    </h3>
                    <RichHtml html={c.earlyLife} className="leading-7" />
                  </section>
                )}
                {c.career && (
                  <section aria-labelledby="career-heading">
                    <h3 id="career-heading" className="mb-3 text-xl font-semibold text-white">
                      Career Timeline
                    </h3>
                    <RichHtml html={c.career} className="leading-7" />
                  </section>
                )}
                {c.personalLife && (
                  <section aria-labelledby="personal-life-heading">
                    <h3 id="personal-life-heading" className="mb-3 text-xl font-semibold text-white">
                      Personal Life
                    </h3>
                    <RichHtml html={c.personalLife} className="leading-7" />
                  </section>
                )}
              </div>
            </SectionCard>
          )}

          {(c.achievements?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="achievements" eyebrow="Highlights">
                {c.name} Achievements
              </SectionHeading>
              <div className="grid gap-4">
                {c.achievements!.map((achievement, index) => (
                  <article key={`${cleanProfileText(achievement, 40)}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="sr-only">{c.name} achievement {index + 1}</h3>
                    <RichHtml html={achievement} className="leading-7" />
                  </article>
                ))}
              </div>
            </SectionCard>
          )}

          {(c.works?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="notable-works" eyebrow="Known for">
                Notable Works
              </SectionHeading>
              <ul className="flex flex-wrap gap-2.5">
                {c.works!.map((work) => (
                  <li key={work}>
                    <Link
                      href={`/movie-details?query=${encodeURIComponent(work)}`}
                      className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-primary/50 hover:text-white"
                    >
                      {work}
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {hasFilmography && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="filmography" eyebrow="Movies and shows">
                {c.name} Filmography
              </SectionHeading>
              <div className="space-y-9">
                {hasFilms && (
                  <section aria-labelledby="movies-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <h3 id="movies-heading" className="text-xl font-semibold text-white">Movies</h3>
                      <p className="text-sm text-neutral-500">{c.movies!.length} listed</p>
                    </div>
                    <DataTable headers={['Year', 'Title', 'Role', 'Director', 'Genre']}>
                      <MovieRows movies={c.movies!} />
                    </DataTable>
                  </section>
                )}

                {hasWebSeries && (
                  <section aria-labelledby="web-series-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <h3 id="web-series-heading" className="text-xl font-semibold text-white">Web Series</h3>
                      <p className="text-sm text-neutral-500">{c.webSeries!.length} listed</p>
                    </div>
                    <DataTable headers={['Year', 'Title', 'Role', 'Platform', 'Seasons', 'Genre']}>
                      <WebSeriesRows series={c.webSeries!} />
                    </DataTable>
                  </section>
                )}

                {hasTvShows && (
                  <section aria-labelledby="tv-shows-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <h3 id="tv-shows-heading" className="text-xl font-semibold text-white">TV Shows</h3>
                      <p className="text-sm text-neutral-500">{c.tvShows!.length} listed</p>
                    </div>
                    <DataTable headers={['Year', 'Title', 'Role', 'Channel', 'Seasons', 'Genre']}>
                      <TvShowRows shows={c.tvShows!} />
                    </DataTable>
                  </section>
                )}
              </div>
            </SectionCard>
          )}

          {(c.awards?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="awards" eyebrow="Recognition">
                Awards and Nominations
              </SectionHeading>
              <DataTable headers={['Year', 'Award', 'Category', 'Organization', 'Work', 'Result']}>
                {[...c.awards!].sort((a, b) => yearSort(a.year, b.year)).map((award, index) => {
                  const won = /winner|won/i.test(award.category || '');
                  return (
                    <tr key={award._id || `${award.title}-${index}`} className="hover:bg-white/[0.025]">
                      <TableCell className="whitespace-nowrap text-neutral-500">{award.year || '-'}</TableCell>
                      <TableCell>
                        <h3 className="font-semibold text-white">{award.title}</h3>
                        {award.description && (
                          <p className="mt-2 text-sm leading-6 text-neutral-400">{award.description}</p>
                        )}
                      </TableCell>
                      <TableCell>{award.category || '-'}</TableCell>
                      <TableCell>{award.organization || '-'}</TableCell>
                      <TableCell>{award.work || '-'}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${won ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {won ? 'Won' : 'Nominated'}
                        </span>
                      </TableCell>
                    </tr>
                  );
                })}
              </DataTable>
            </SectionCard>
          )}

          {(c.trivia?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="trivia" eyebrow="Trivia">
                Facts Fans Search For
              </SectionHeading>
              <SimpleList items={c.trivia} />
            </SectionCard>
          )}

          {(c.philanthropy?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="philanthropy" eyebrow="Social impact">
                Philanthropy
              </SectionHeading>
              <SimpleList items={c.philanthropy} />
            </SectionCard>
          )}

          {(c.controversies?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="controversies" eyebrow="Background">
                Controversies
              </SectionHeading>
              <div className="grid gap-4">
                {c.controversies!.map((item, index) => (
                  <article key={`${cleanProfileText(item, 40)}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="sr-only">{c.name} controversy {index + 1}</h3>
                    <RichHtml html={item} className="leading-7" />
                  </article>
                ))}
              </div>
            </SectionCard>
          )}

          {(c.quotes?.length ?? 0) > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="quotes" eyebrow="Quotes">
                Notable Quotes
              </SectionHeading>
              <div className="grid gap-4 md:grid-cols-2">
                {c.quotes!.map((quote, index) => (
                  <blockquote key={`${quote}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="font-playfair text-lg italic leading-8 text-white">&quot;{quote}&quot;</p>
                    <footer className="mt-3 text-sm text-neutral-500">- {c.name}</footer>
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}

          {galleryImages.length > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="gallery" eyebrow="Images">
                {c.name} Photo Gallery
              </SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.slice(0, 12).map((image, index) => (
                  <figure key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={image}
                        alt={`${c.name} photo ${index + 1}`}
                        fill
                        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
                        quality={72}
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <figcaption className="border-t border-white/10 px-4 py-3 text-xs text-neutral-500">
                      {c.name} image {index + 1}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </SectionCard>
          )}

          {faqItems.length > 0 && (
            <SectionCard className="content-visibility-auto">
              <SectionHeading id="faq" eyebrow="Search answers">
                {c.name} FAQ
              </SectionHeading>
              <div className="space-y-4">
                {faqItems.map((faq) => (
                  <section key={faq.question} className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <h3 className="text-lg font-semibold leading-7 text-white">{faq.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-neutral-300">{faq.answer}</p>
                  </section>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
          <nav aria-labelledby="profile-toc-heading" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <h2 id="profile-toc-heading" className="font-playfair text-xl font-bold text-white">
              On This Page
            </h2>
            <ol className="mt-4 space-y-2 text-sm">
              {tocSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-neutral-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {socialLinks.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <h2 className="font-playfair text-xl font-bold text-white">Social Links</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium text-neutral-300 hover:border-primary/50 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          {(hasFamily || c.spouse || (c.education?.length ?? 0) > 0) && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <h2 className="font-playfair text-xl font-bold text-white">Profile Details</h2>
              <div className="mt-5 space-y-5">
                {c.spouse && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Spouse</h3>
                    <p className="mt-2 text-sm text-neutral-300">{c.spouse}</p>
                  </div>
                )}
                {(c.marriages?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Marriages</h3>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-300">
                      {c.marriages!.map((marriage, index) => (
                        <li key={`${marriage.name}-${index}`}>
                          {[
                            marriage.name,
                            marriage.marriedYear ? `m. ${marriage.marriedYear}` : '',
                            marriage.currentlyMarried ? 'present' : marriage.divorcedYear ? `div. ${marriage.divorcedYear}` : '',
                          ].filter(Boolean).join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <SidebarList label="Parents" items={c.parents} />
                <SidebarList label="Siblings" items={c.siblings} />
                <SidebarList label="Children" items={c.children} />
                <SidebarList label="Relatives" items={c.relatives} />
                <SidebarList label="Education" items={c.education} />
              </div>
            </section>
          )}

          {(c.tags?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <h2 className="font-playfair text-xl font-bold text-white">Related Topics</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags!.slice(0, 16).map((tag) => (
                  <Link
                    key={tag}
                    href={`/celebrity-profiles?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:border-primary/50 hover:text-white"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
