import Image from 'next/image';
import Link from 'next/link';
import { CalendarDaysIcon, FilmIcon } from '@heroicons/react/24/outline';
import { fallbackMovies, type HomeMovie, safeImage } from './homepageContent';

type MoviesTimelineProps = {
  movies?: HomeMovie[];
};

export default function MoviesTimeline({ movies = [] }: MoviesTimelineProps) {
  const items = movies.length > 0 ? movies : fallbackMovies;

  return (
    <section id="upcoming-movies" aria-labelledby="upcoming-movies-heading" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-primary">
            Movie tracker
          </p>
          <h2 id="upcoming-movies-heading" className="mt-3 font-playfair text-4xl font-bold text-white md:text-5xl">
            Upcoming Movies
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-400">
            Release dates, posters, cast details, and movie pages that are visible in server-rendered HTML.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((movie) => (
            <article key={movie.id} className="overflow-hidden rounded-lg border border-white/10 bg-card">
              <Link href={movie.path} className="group block h-full">
                <div className="relative aspect-[2/3] overflow-hidden bg-neutral-900">
                  <Image
                    src={safeImage(movie.poster)}
                    alt={movie.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-playfair text-2xl font-bold text-white">{movie.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-300">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDaysIcon width={16} height={16} aria-hidden="true" className="text-primary" />
                        {movie.dateTime ? <time dateTime={movie.dateTime}>{movie.releaseDate}</time> : movie.releaseDate}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <FilmIcon width={16} height={16} aria-hidden="true" className="text-primary" />
                        {movie.genre}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-neutral-400">{movie.description}</p>
                  <p className="mt-4 text-sm text-neutral-500">Starring: {movie.cast}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/upcoming-movies"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary/90"
          >
            View all upcoming movies
          </Link>
        </div>
      </div>
    </section>
  );
}
