import Link from 'next/link';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { primaryNavigation } from '@/app/components/homepageContent';

const accountLinks = [
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
  { label: 'API Documentation', href: '/api-docs' },
  { label: 'API Pricing', href: '/api-pricing' },
];

const legalLinks = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <section aria-labelledby="footer-brand" className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background text-primary">
                <SparklesIcon width={20} height={20} aria-hidden="true" />
              </span>
              <h2 id="footer-brand" className="font-playfair text-xl font-bold text-white">
                CelebrityPersona
              </h2>
            </Link>
            <p className="max-w-md text-sm leading-6 text-neutral-400">
              CelebrityPersona covers celebrity profiles, fashion inspiration, shoppable outfit
              ideas, entertainment articles, movie details, and reviews.
            </p>
          </section>

          <nav aria-labelledby="footer-explore" className="space-y-3">
            <h2 id="footer-explore" className="text-xs font-semibold uppercase tracking-wider text-primary">
              Explore
            </h2>
            {primaryNavigation.map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm text-neutral-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-labelledby="footer-account" className="space-y-3">
            <h2 id="footer-account" className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Account
            </h2>
            {accountLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm text-neutral-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-labelledby="footer-legal" className="space-y-3">
            <h2 id="footer-legal" className="text-xs font-semibold uppercase tracking-wider text-accent">
              Legal
            </h2>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm text-neutral-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 CelebrityPersona. All rights reserved.</p>
          <Link href="/celebrity-news" className="text-neutral-400 hover:text-white">
            Read the latest celebrity articles
          </Link>
        </div>
      </div>
    </footer>
  );
}
