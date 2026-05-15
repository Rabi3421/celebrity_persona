import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { fallbackOutfits, type HomeOutfit, safeImage } from './homepageContent';

type FashionBentoGridProps = {
  outfits?: HomeOutfit[];
};

export default function FashionBentoGrid({ outfits = [] }: FashionBentoGridProps) {
  const items = outfits.length > 0 ? outfits : fallbackOutfits;

  return (
    <section
      id="trending-outfits"
      aria-labelledby="trending-outfits-heading"
      className="bg-card px-4 py-16 sm:px-6 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-secondary">
              Fashion gallery
            </p>
            <h2 id="trending-outfits-heading" className="mt-3 font-playfair text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Trending Celebrity Outfits
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-400">
              Shoppable celebrity-inspired looks with crawlable outfit pages and internal links to the full gallery.
            </p>
          </div>
          <Link href="/fashion-gallery" className="inline-flex text-sm font-semibold text-secondary hover:text-white">
            Browse the fashion gallery
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.slice(0, 8).map((outfit, index) => {
            const isFeature = index === 0;

            return (
              <article
                key={outfit.id}
                className={`overflow-hidden rounded-lg border border-white/10 bg-background ${
                  isFeature ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <Link href={outfit.path} className="group block h-full">
                  <div className={`relative overflow-hidden bg-neutral-900 ${isFeature ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}>
                    <Image
                      src={safeImage(outfit.image)}
                      alt={outfit.alt}
                      fill
                      sizes={isFeature ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw'}
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                      {outfit.occasion}
                    </div>
                    {outfit.price && (
                      <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
                        {outfit.price}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <h3 className="font-playfair text-xl font-bold text-white sm:text-2xl">{outfit.celebrityName}</h3>
                      <p className="mt-1 text-sm text-neutral-300">{outfit.title}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="line-clamp-3 text-sm leading-6 text-neutral-400">{outfit.description}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-secondary">
                      <ShoppingBagIcon width={16} height={16} aria-hidden="true" className="mr-2" />
                      View outfit
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/fashion-gallery"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary/60 hover:text-secondary"
          >
            View more celebrity outfits
            <ArrowRightIcon width={16} height={16} aria-hidden="true" className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
