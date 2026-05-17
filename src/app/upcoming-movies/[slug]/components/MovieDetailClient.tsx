'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

const MovieInteractions = dynamic(() => import('./MovieInteractions'), {
  ssr: false,
  loading: () => <div className="h-24 rounded-lg border border-white/10 bg-white/5" />,
});

type PersonCredit = {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
  roleName?: string;
  characterDescription?: string;
  displayOrder?: number;
};

type GalleryImage = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
};

type Movie = Record<string, any> & {
  title: string;
  slug: string;
  originalTitle?: string;
  tagline?: string;
  excerpt?: string;
  releaseDate?: string;
  releaseDateText?: string;
  genres?: string[];
  languages?: string[];
  leadCast?: PersonCredit[];
  supportingCast?: PersonCredit[];
  cameoCast?: PersonCredit[];
  director?: PersonCredit[];
  posterImage?: string;
  posterImageAlt?: string;
  posterImageCaption?: string;
  backdropImage?: string;
  galleryImages?: GalleryImage[];
  trailerUrl?: string;
  videoEmbedUrl?: string;
  youtubeVideoId?: string;
};

function stripHtml(html?: string) {
  return String(html || '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function dateText(movie: Movie) {
  if (movie.releaseDateText) return movie.releaseDateText;
  if (!movie.releaseDate) return 'Release date not officially announced';
  const date = new Date(movie.releaseDate);
  if (Number.isNaN(date.getTime())) return 'Release date not officially announced';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function labelize(value?: string) {
  return value ? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';
}

function runtime(movie: Movie) {
  const minutes = Number(movie.duration);
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function youtubeEmbed(movie: Movie) {
  if (movie.videoEmbedUrl) return movie.videoEmbedUrl;
  if (movie.youtubeVideoId) return `https://www.youtube.com/embed/${movie.youtubeVideoId}`;
  const match = String(movie.trailerUrl || '').match(
    /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-l-4 border-yellow-500 pl-4 text-xl font-bold text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextSection({ title, value }: { title: string; value?: string }) {
  if (!value) return null;
  return (
    <Section title={title}>
      <p className="whitespace-pre-line text-[15px] leading-7 text-neutral-300">
        {stripHtml(value)}
      </p>
    </Section>
  );
}

function PeopleGrid({ title, people }: { title: string; people?: PersonCredit[] }) {
  const rows = (people || [])
    .filter((item) => item.name)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  if (!rows.length) return null;
  return (
    <Section title={title}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((person, index) => {
          const href =
            person.profileUrl || (person.slug ? `/celebrity-profiles/${person.slug}` : '#');
          return (
            <Link
              key={`${person.name}-${index}`}
              href={href}
              className="rounded-lg border border-white/10 bg-white/5 p-4 text-center transition hover:border-yellow-500/40 hover:bg-white/10"
            >
              <div className="relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full bg-white/10">
                {person.image ? (
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl font-bold text-neutral-500">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-white">{person.name}</p>
              {person.roleName && (
                <p className="mt-1 truncate text-xs text-yellow-300">{person.roleName}</p>
              )}
              {person.characterDescription && (
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {person.characterDescription}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

export default function MovieDetailClient({ movie }: { movie: Movie }) {
  const embedUrl = youtubeEmbed(movie);
  const posterAlt = movie.posterImageAlt || `${movie.title} poster`;
  const details = [
    ['Release', dateText(movie)],
    ['Availability', labelize(movie.availabilityStatus)],
    ['OTT Platform', movie.ottPlatform || movie.streamingPlatform],
    ['Language', (movie.languages || movie.language || []).join(', ')],
    ['Genre', (movie.genres || movie.genre || []).join(', ')],
    ['Certification', movie.certification || movie.mpaaRating],
    ['Runtime', runtime(movie)],
    ['Country', movie.country],
    ['Movie Type', movie.movieType],
    ['Status', labelize(movie.status)],
  ].filter(([, value]) => value);

  const productionDetails = [
    ['Production Status', movie.productionStatus],
    [
      'Filming Start',
      movie.filmingStartDate
        ? dateText({ ...movie, releaseDate: movie.filmingStartDate, releaseDateText: '' })
        : '',
    ],
    [
      'Filming End',
      movie.filmingEndDate
        ? dateText({ ...movie, releaseDate: movie.filmingEndDate, releaseDateText: '' })
        : '',
    ],
    ['Filming Locations', (movie.filmingLocations || []).join(', ')],
    ['Budget', movie.budget],
    ['Box Office Collection', movie.boxOfficeCollection],
    ['Production Company', movie.productionCompany || movie.studio],
    ['Distributor', movie.distributorName || movie.distributor],
    ['Music Label', movie.musicLabel],
    ['Aspect Ratio', movie.aspectRatio],
    ['Sound Mix', movie.soundMix],
    ['Color', movie.color],
  ].filter(([, value]) => value);

  return (
    <div className="bg-[#080910] text-white">
      <section className="relative min-h-[620px] overflow-hidden">
        {movie.backdropImage || movie.posterImage ? (
          <Image
            src={movie.backdropImage || movie.posterImage!}
            alt={posterAlt}
            fill
            priority
            className="object-cover opacity-45"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#080910]/80 to-[#080910]" />
        <div className="container relative mx-auto grid min-h-[620px] items-end gap-8 px-4 pb-12 pt-28 md:grid-cols-[260px_1fr]">
          {movie.posterImage && (
            <figure className="hidden md:block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/15 shadow-2xl">
                <Image
                  src={movie.posterImage}
                  alt={posterAlt}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
              </div>
              {movie.posterImageCaption && (
                <figcaption className="mt-2 text-xs text-neutral-500">
                  {movie.posterImageCaption}
                </figcaption>
              )}
            </figure>
          )}
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.isFeatured && (
                <span className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                  Featured
                </span>
              )}
              {movie.isTrending && (
                <span className="rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white">
                  Trending
                </span>
              )}
              {movie.isEditorPick && (
                <span className="rounded-full bg-purple-500/80 px-3 py-1 text-xs font-semibold text-white">
                  Editor Pick
                </span>
              )}
              {movie.availabilityStatus && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  {labelize(movie.availabilityStatus)}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">{movie.title}</h1>
            {movie.originalTitle && (
              <p className="mt-2 text-lg text-neutral-400">Original title: {movie.originalTitle}</p>
            )}
            {movie.tagline && (
              <p className="mt-3 text-xl italic text-yellow-200">{movie.tagline}</p>
            )}
            {movie.excerpt && (
              <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-200">{movie.excerpt}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-neutral-300">
              <span>{dateText(movie)}</span>
              {(movie.genres || []).slice(0, 4).map((genre) => (
                <span key={genre}>/ {genre}</span>
              ))}
              {(movie.languages || []).slice(0, 3).map((language) => (
                <span key={language}>/ {language}</span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500"
                >
                  Watch Trailer
                </a>
              )}
              {movie.ticketBookingUrl && (
                <a
                  href={movie.ticketBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400"
                >
                  Book Tickets
                </a>
              )}
              {movie.preorderOrWatchlistUrl && (
                <a
                  href={movie.preorderOrWatchlistUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Add To Watchlist
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_340px]">
        <main className="space-y-10">
          <MovieInteractions slug={movie.slug} movieTitle={movie.title} />
          <TextSection title="Synopsis" value={movie.synopsis} />
          <TextSection title="Plot Summary" value={movie.plotSummary} />
          <TextSection title="Storyline" value={movie.storyline || movie.premise} />
          <TextSection title="Official Description" value={movie.officialDescription} />
          <TextSection title="What To Expect" value={movie.whatToExpect} />

          {embedUrl && (
            <Section title="Trailer">
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                <iframe
                  src={embedUrl}
                  title={`${movie.title} trailer`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Section>
          )}
          <TextSection title="Trailer Breakdown" value={movie.trailerBreakdown} />
          <TextSection
            title="Cast Performance Expectations"
            value={movie.castPerformanceExpectations}
          />
          <TextSection title="Why This Movie Is Important" value={movie.whyThisMovieIsImportant} />
          <TextSection title="Audience Buzz" value={movie.audienceBuzz} />
          <TextSection title="Final Preview Note" value={movie.finalPreviewNote} />
          {movie.spoilerWarning && (
            <TextSection title="Spoiler Notes" value={movie.spoilerContent} />
          )}

          <PeopleGrid title="Lead Cast" people={movie.leadCast || movie.cast} />
          <PeopleGrid title="Supporting Cast" people={movie.supportingCast} />
          <PeopleGrid title="Cameo Cast" people={movie.cameoCast} />
          <PeopleGrid title="Director" people={movie.director} />

          {(movie.galleryImages || []).length > 0 && (
            <Section title="Media Gallery">
              <div className="grid gap-4 sm:grid-cols-2">
                {(movie.galleryImages || []).map((image: GalleryImage, index: number) => (
                  <figure
                    key={`${image.url}-${index}`}
                    className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={image.url}
                        alt={image.alt || `${movie.title} gallery image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="50vw"
                      />
                    </div>
                    {(image.caption || image.credit) && (
                      <figcaption className="p-3 text-xs text-neutral-400">
                        {image.caption}
                        {image.credit ? ` Credit: ${image.credit}` : ''}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </Section>
          )}

          {productionDetails.length > 0 && (
            <Section title="Production Details">
              <dl className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-5 md:grid-cols-2">
                {productionDetails.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wider text-neutral-500">{label}</dt>
                    <dd className="mt-1 text-sm text-neutral-200">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          <Section title="Sources & External Links">
            <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-neutral-300">
              {movie.sourceName && (
                <p>
                  Primary source:{' '}
                  {movie.sourceUrl ? (
                    <a
                      href={movie.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-300 hover:underline"
                    >
                      {movie.sourceName}
                    </a>
                  ) : (
                    movie.sourceName
                  )}
                </p>
              )}
              {movie.sourceCreditText && (
                <p className="mt-2 text-neutral-400">{movie.sourceCreditText}</p>
              )}
              {movie.factCheckNotes && (
                <p className="mt-2 text-neutral-500">{movie.factCheckNotes}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ['Official Site', movie.officialWebsite],
                  ['IMDb', movie.imdbUrl],
                  ['Wikipedia', movie.wikipediaUrl],
                  ['Platform Page', movie.platformUrl],
                  ['Press Release', movie.pressReleaseUrl],
                ]
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={String(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-200 hover:bg-white/10"
                    >
                      {label}
                    </a>
                  ))}
              </div>
            </div>
          </Section>
        </main>

        <aside className="space-y-6">
          <div className="sticky top-24 rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
              Movie Details
            </h2>
            <dl className="space-y-3">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wider text-neutral-500">{label}</dt>
                  <dd className="mt-1 text-sm text-neutral-200">{String(value)}</dd>
                </div>
              ))}
            </dl>
            {movie.whereToWatchText && (
              <p className="mt-5 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-100">
                {movie.whereToWatchText}
              </p>
            )}
            {(movie.contentTags || movie.secondaryKeywords || []).length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(movie.contentTags || movie.secondaryKeywords || [])
                    .slice(0, 12)
                    .map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-1 text-xs text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
