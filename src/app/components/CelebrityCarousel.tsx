import Image from 'next/image';
import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { fallbackCelebrities, type HomeCelebrity, safeImage } from './homepageContent';

type CelebritySpotlightProps = {
  celebrities?: HomeCelebrity[];
};

export default function CelebrityCarousel({ celebrities = [] }: CelebritySpotlightProps) {
  const items = celebrities.length > 0 ? celebrities : fallbackCelebrities;

  return (
    <section id="celebrity-spotlight" aria-labelledby="celebrity-spotlight-heading" className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-primary">
              Featured celebrities
            </p>
            <h2 id="celebrity-spotlight-heading" className="mt-3 font-playfair text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Celebrity Spotlight
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-400">
              Crawlable celebrity profile links with bios, style coverage, movie updates, and verified profile details.
            </p>
          </div>
          <Link href="/celebrity-profiles" className="inline-flex text-sm font-semibold text-primary hover:text-white">
            View all celebrity profiles
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((celebrity) => (
            <article key={celebrity.id} className="overflow-hidden rounded-lg border border-white/10 bg-card">
              <Link href={celebrity.path} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                  <Image
                    src={safeImage(celebrity.image)}
                    alt={celebrity.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-playfair text-2xl font-bold text-white">{celebrity.name}</h3>
                      <CheckBadgeIcon width={20} height={20} aria-hidden="true" className="text-primary" />
                    </div>
                    <p className="mt-1 text-sm text-neutral-300">{celebrity.profession}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-neutral-400">{celebrity.description}</p>
                  {celebrity.metric && (
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                      {celebrity.metric}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
