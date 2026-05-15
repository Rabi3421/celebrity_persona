import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { fallbackArticles, type HomeArticle, safeImage } from './homepageContent';

type NewsSectionProps = {
  articles?: HomeArticle[];
};

export default function NewsSection({ articles = [] }: NewsSectionProps) {
  const items = articles.length > 0 ? articles : fallbackArticles;
  const [featuredArticle, ...latestArticles] = items;

  return (
    <section id="latest-articles" aria-labelledby="latest-articles-heading" className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-accent">
            Latest articles
          </p>
          <h2 id="latest-articles-heading" className="mt-3 font-playfair text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Celebrity News
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-400">
            Fresh entertainment coverage, fashion stories, awards updates, and celebrity features.
          </p>
        </div>

        {featuredArticle && (
          <article className="mb-8 overflow-hidden rounded-lg border border-white/10 bg-card">
            <Link href={featuredArticle.path} className="group grid lg:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900 lg:aspect-auto">
                <Image
                  src={safeImage(featuredArticle.image)}
                  alt={featuredArticle.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-6 md:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  <span className="text-accent">{featuredArticle.category}</span>
                  {featuredArticle.dateTime ? (
                    <time dateTime={featuredArticle.dateTime}>{featuredArticle.date}</time>
                  ) : (
                    <span>{featuredArticle.date}</span>
                  )}
                  <span>{featuredArticle.readTime}</span>
                </div>
                <h3 className="font-playfair text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                  {featuredArticle.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-neutral-400">{featuredArticle.excerpt}</p>
                {featuredArticle.celebrity && (
                  <p className="mt-4 text-sm text-neutral-500">Featured celebrity: {featuredArticle.celebrity}</p>
                )}
                <span className="mt-6 inline-flex items-center text-sm font-semibold text-accent">
                  Read full story
                  <ArrowRightIcon width={16} height={16} aria-hidden="true" className="ml-2" />
                </span>
              </div>
            </Link>
          </article>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {latestArticles.slice(0, 6).map((article) => (
            <article key={article.id} className="overflow-hidden rounded-lg border border-white/10 bg-card">
              <Link href={article.path} className="group block h-full">
                <div className="relative aspect-video overflow-hidden bg-neutral-900">
                  <Image
                    src={safeImage(article.image)}
                    alt={article.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    <span className="text-accent">{article.category}</span>
                    {article.dateTime ? <time dateTime={article.dateTime}>{article.date}</time> : <span>{article.date}</span>}
                  </div>
                  <h3 className="font-playfair text-xl font-semibold leading-snug text-white">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-400">{article.excerpt}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/celebrity-news"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-accent/60 hover:text-accent"
          >
            View all celebrity news
            <ArrowRightIcon width={16} height={16} aria-hidden="true" className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
