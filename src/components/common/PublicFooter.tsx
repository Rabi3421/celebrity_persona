import Link from 'next/link';
import {
  ArrowUpRightIcon,
  EnvelopeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { primaryNavigation } from '@/app/components/homepageContent';

const uploadHref = '/login?redirect=%2Fdashboard%3Fsection%3Duploads';

const accountLinks = [
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
];

const platformLinks = [
  { label: 'Upload Outfit', href: uploadHref },
  { label: 'API Documentation', href: '/api-docs' },
  { label: 'API Pricing', href: '/api-pricing' },
];

const legalLinks = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

const contactEmail = 'info@celebritypersona.com';

const socialLinks = [
  { label: 'X / Twitter', href: process.env.NEXT_PUBLIC_X_URL || process.env.NEXT_PUBLIC_TWITTER_URL },
  { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: 'YouTube', href: process.env.NEXT_PUBLIC_YOUTUBE_URL },
  { label: 'LinkedIn', href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
].filter((link): link is { label: string; href: string } => Boolean(link.href));

type FooterLink = {
  label: string;
  href: string;
};

const spotlightLinks = [
  { label: 'Celebrity style index', href: '/celebrity-profiles' },
  { label: 'Shoppable fashion gallery', href: '/fashion-gallery' },
  { label: 'Movie reviews and ratings', href: '/reviews' },
];

function FooterColumn({
  title,
  links,
  accent = 'text-primary',
}: {
  title: string;
  links: FooterLink[];
  accent?: string;
}) {
  return (
    <nav aria-labelledby={`footer-${title.toLowerCase().replace(/\W+/g, '-')}`} className="space-y-5">
      <h2
        id={`footer-${title.toLowerCase().replace(/\W+/g, '-')}`}
        className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${accent}`}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 text-sm leading-6 text-neutral-400 transition-colors hover:text-white"
            >
              <span>{link.label}</span>
              <ArrowUpRightIcon
                width={13}
                height={13}
                aria-hidden="true"
                className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#12081f] text-card-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%),linear-gradient(135deg,rgba(251,191,36,0.08),transparent_34%,rgba(244,166,184,0.06)_68%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <section
          aria-labelledby="footer-cta"
          className="mb-12 grid gap-8 border-b border-white/10 pb-10 lg:mb-14 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:pb-12"
        >
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:tracking-[0.32em]">
              Celebrity style, cinema, and culture
            </p>
            <h2
              id="footer-cta"
              className="max-w-4xl font-playfair text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              Spend a little longer with the looks, stories, and screen moments people talk about.
            </h2>
          </div>

          <div className="space-y-5 lg:justify-self-end">
            <p className="max-w-md text-sm leading-7 text-neutral-400">
              Explore celebrity profiles, outfit inspiration, entertainment articles, movie pages,
              and reviews from one clean destination.
            </p>
            <div className="grid gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
              <Link
                href="/fashion-gallery"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-primary/15 transition hover:bg-primary/90"
              >
                Explore fashion
                <ArrowUpRightIcon width={15} height={15} aria-hidden="true" />
              </Link>
              <Link
                href="/celebrity-news"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.04]"
              >
                Read latest stories
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[1.18fr_1.82fr] lg:gap-16">
          <section aria-labelledby="footer-brand" className="lg:max-w-md">
            <Link href="/" aria-label="CelebrityPersona home" className="mb-7 inline-flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-primary shadow-2xl shadow-primary/10">
                <SparklesIcon width={23} height={23} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Discover
                </span>
                <h2 id="footer-brand" className="mt-1 font-playfair text-3xl font-bold text-white">
                  CelebrityPersona
                </h2>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-7 text-neutral-400">
              CelebrityPersona covers celebrity profiles, fashion inspiration, shoppable outfit
              ideas, entertainment articles, movie details, and reviews.
            </p>

            <div className="mt-8 space-y-3 border-l border-primary/40 pl-5">
              {spotlightLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between gap-4 text-sm text-neutral-300 transition hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowUpRightIcon
                    width={14}
                    height={14}
                    aria-hidden="true"
                    className="text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              ))}
            </div>

            <a
              href={`mailto:${contactEmail}`}
              aria-label={`Email CelebrityPersona at ${contactEmail}`}
              className="mt-8 inline-flex max-w-full items-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-300 transition hover:border-primary/40 hover:text-white"
            >
              <EnvelopeIcon width={16} height={16} aria-hidden="true" className="text-primary" />
              <span className="min-w-0 break-all">{contactEmail}</span>
            </a>
          </section>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_0.86fr_0.9fr_1.1fr]">
            <FooterColumn title="Quick Links" links={primaryNavigation} />
            <FooterColumn title="Platform" links={platformLinks} accent="text-secondary" />
            <FooterColumn title="Legal & Support" links={[...accountLinks, ...legalLinks]} accent="text-accent" />

            <section aria-labelledby="footer-contact" className="space-y-5">
              <h2
                id="footer-contact"
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
              >
                Contact
              </h2>
              <p className="text-sm leading-7 text-neutral-400">
                Questions, support requests, or partnership ideas? Reach the team directly.
              </p>

              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow CelebrityPersona on ${link.label}`}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:border-primary/40 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-6 text-neutral-500">
                  Social channels can be connected from the public environment settings.
                </p>
              )}
            </section>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-7 text-sm text-neutral-500 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 CelebrityPersona. All rights reserved.</p>
          <nav aria-label="Footer secondary navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/celebrity-news" className="transition hover:text-white">
              Latest articles
            </Link>
            {legalLinks.map((link) => (
              <Link key={`bottom-${link.href}`} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
