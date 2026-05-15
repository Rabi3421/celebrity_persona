import Image from 'next/image';
import Link from 'next/link';
import type { SeoInternalLinkGroup, SeoInternalLinks } from '@/lib/seo/internalLinks';
import { stripHtml, truncate } from '@/lib/seo/site';

function ContextualLinks({ links }: { links: SeoInternalLinks['contextualLinks'] }) {
  const visibleLinks = links.slice(0, 7);
  if (visibleLinks.length === 0) return null;

  return (
    <p className="max-w-4xl text-sm md:text-base leading-7 text-neutral-300">
      Continue exploring{' '}
      {visibleLinks.map((link, index) => {
        const isLast = index === visibleLinks.length - 1;
        const needsComma = visibleLinks.length > 2 && index < visibleLinks.length - 1;
        const needsAnd = visibleLinks.length > 1 && isLast;

        return (
          <span key={`${link.href}-${link.label}`}>
            {needsAnd ? 'and ' : ''}
            <Link href={link.href} className="font-medium text-primary hover:text-white underline underline-offset-4">
              {link.label}
            </Link>
            {needsComma ? ', ' : isLast ? '.' : ' '}
          </span>
        );
      })}
    </p>
  );
}

function LinkCard({ item }: { item: SeoInternalLinkGroup['items'][number] }) {
  const description = item.description ? truncate(stripHtml(item.description), 170) : '';

  return (
    <article className="h-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition-colors hover:border-primary/40 hover:bg-white/[0.06]">
      <Link href={item.href} className="group flex h-full flex-col">
        {item.image && (
          <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              quality={70}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {item.eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {item.eyebrow}
            </p>
          )}
          <h3 className="font-playfair text-lg font-semibold leading-snug text-white">
            {item.title}
          </h3>
          {description && (
            <p className="line-clamp-3 text-sm leading-6 text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

export default function InternalLinks({
  links,
  title = 'Explore Related Coverage',
  description = 'Find connected profiles, movie coverage, fashion articles, and entertainment news from CelebrityPersona.',
  className = '',
  id,
}: {
  links: SeoInternalLinks;
  title?: string;
  description?: string;
  className?: string;
  id?: string;
}) {
  const groups = links.groups.filter((group) => group.items.length > 0);
  if (groups.length === 0 && links.contextualLinks.length === 0) return null;

  return (
    <section id={id} className={`content-visibility-auto border-t border-white/10 bg-[#0b0714] px-6 py-16 md:px-10 ${className}`}>
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Related Coverage</p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
            <div>
              <h2 className="font-playfair text-3xl font-bold text-white md:text-4xl">{title}</h2>
              {description && <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>}
            </div>
            <ContextualLinks links={links.contextualLinks} />
          </div>
        </header>

        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`${group.title.replace(/\W+/g, '-').toLowerCase()}-links`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3
                  id={`${group.title.replace(/\W+/g, '-').toLowerCase()}-links`}
                  className="text-xl font-semibold text-white"
                >
                  {group.title}
                </h3>
                {group.description && (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-400">{group.description}</p>
                )}
              </div>
              {group.viewAllHref && (
                <Link href={group.viewAllHref} className="text-sm font-medium text-primary hover:text-white">
                  {group.viewAllLabel || 'View all'}
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.slice(0, 8).map((item) => (
                <LinkCard key={`${item.href}-${item.title}`} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
