'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpTrayIcon,
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { primaryNavigation } from '@/app/components/homepageContent';
import BrandLogo from '@/components/brand/BrandLogo';

const uploadHref = '/login?redirect=%2Fdashboard%3Fsection%3Duploads';
const movieNavigationHrefs = ['/movie-details', '/upcoming-movies', '/reviews'];

export default function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const desktopNavigation = primaryNavigation.filter(
    (link) => !movieNavigationHrefs.includes(link.href)
  );
  const movieNavigation = primaryNavigation.filter((link) =>
    movieNavigationHrefs.includes(link.href)
  );
  const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isMovieNavigationActive = movieNavigation.some((link) => isActivePath(link.href));

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="CelebrityPersona home" className="flex min-w-0 items-center">
          <BrandLogo
            variant="compact"
            tone="dark"
            markClassName="h-9 w-9 sm:h-10 sm:w-10"
            textClassName="max-w-[11rem] sm:max-w-none"
          />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {desktopNavigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                isActivePath(link.href)
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="group relative">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                isMovieNavigationActive
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Movies
              <ChevronDownIcon width={14} height={14} aria-hidden="true" />
            </button>
            <div className="invisible absolute right-0 top-full z-20 min-w-48 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-2xl border border-white/10 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                {movieNavigation.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActivePath(link.href)
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-primary/60 hover:text-primary"
          >
            Login
          </Link>
          <Link
            href={uploadHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-primary/90"
          >
            <ArrowUpTrayIcon width={16} height={16} aria-hidden="true" />
            Upload Outfit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-expanded={isMenuOpen}
          aria-controls="public-mobile-menu"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition hover:border-primary/50 lg:hidden"
        >
          {isMenuOpen ? (
            <XMarkIcon width={22} height={22} aria-hidden="true" />
          ) : (
            <Bars3Icon width={22} height={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-white/10 bg-background/98 shadow-2xl lg:hidden"
        >
          <div className="mx-auto max-h-[calc(100dvh-4.25rem)] max-w-7xl overflow-y-auto px-4 py-4 sm:px-6">
            <nav aria-label="Mobile primary navigation" className="grid gap-1">
              {primaryNavigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    pathname === link.href
                      ? 'bg-primary text-black'
                      : 'text-neutral-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 min-[420px]:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-primary/60 hover:text-primary"
              >
                Login
              </Link>
              <Link
                href={uploadHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-primary/90"
              >
                <ArrowUpTrayIcon width={16} height={16} aria-hidden="true" />
                Upload Outfit
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
