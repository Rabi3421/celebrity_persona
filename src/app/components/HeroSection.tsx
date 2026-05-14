import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  HOME_DESCRIPTION,
  HOME_HERO_IMAGE,
  type HomeArticle,
  type HomeCelebrity,
  safeImage,
} from './homepageContent';

type HeroSectionProps = {
  heroImage?: string;
  featuredCelebrity?: HomeCelebrity;
  latestArticle?: HomeArticle;
};

export default function HeroSection({
  heroImage = HOME_HERO_IMAGE,
  featuredCelebrity,
  latestArticle,
}: HeroSectionProps) {
  const spotlightHref = featuredCelebrity?.path || '/celebrity-profiles';
  const articleHref = latestArticle?.path || '/celebrity-news';

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-title"
      className="relative min-h-[82vh] overflow-hidden px-4 pb-14 pt-36 sm:px-6 lg:pt-40"
    >
      <Image
        src={safeImage(heroImage, HOME_HERO_IMAGE)}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/82 to-background/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/45" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-10">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-primary backdrop-blur">
            Celebrity fashion, profiles, movies, and news
          </p>
          <h1
            id="home-hero-title"
            className="font-playfair text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
          >
            Discover celebrity style, stories, and screen culture.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
            {HOME_DESCRIPTION}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/fashion-gallery"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary/90"
            >
              Explore Fashion Gallery
              <ArrowRightIcon width={16} height={16} aria-hidden="true" className="ml-2" />
            </Link>
            <Link
              href="/celebrity-profiles"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/25 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-primary/60 hover:text-primary"
            >
              Browse Celebrity Profiles
            </Link>
          </div>
        </div>

        <nav aria-label="Homepage feature links" className="grid gap-3 md:grid-cols-3">
          <Link
            href={spotlightHref}
            className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur transition hover:border-primary/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Featured celebrity</span>
            <span className="mt-2 block font-playfair text-xl font-semibold text-white">
              {featuredCelebrity?.name || 'Celebrity profiles'}
            </span>
            <span className="mt-1 block text-sm text-neutral-400">
              {featuredCelebrity?.profession || 'Profiles, biographies, style notes, and career highlights'}
            </span>
          </Link>

          <Link
            href={articleHref}
            className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur transition hover:border-accent/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Latest article</span>
            <span className="mt-2 block font-playfair text-xl font-semibold text-white">
              {latestArticle?.title || 'Celebrity news'}
            </span>
            <span className="mt-1 block text-sm text-neutral-400">
              {latestArticle?.excerpt || 'Entertainment news, awards coverage, and celebrity updates'}
            </span>
          </Link>

          <Link
            href="/upcoming-movies"
            className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur transition hover:border-secondary/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Movie tracker</span>
            <span className="mt-2 block font-playfair text-xl font-semibold text-white">
              Upcoming movies
            </span>
            <span className="mt-1 block text-sm text-neutral-400">
              Release dates, cast updates, posters, reviews, and movie details
            </span>
          </Link>
        </nav>
      </div>
    </section>
  );
}
