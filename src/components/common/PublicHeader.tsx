import Link from 'next/link';
import { ArrowUpTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { primaryNavigation } from '@/app/components/homepageContent';

const uploadHref = '/login?redirect=%2Fdashboard%3Fsection%3Duploads';

export default function PublicHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="CelebrityPersona home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">
              <SparklesIcon width={20} height={20} aria-hidden="true" />
            </span>
            <span className="font-playfair text-xl font-bold text-white sm:text-2xl">
              CelebrityPersona
            </span>
          </Link>

          <Link
            href={uploadHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary/90 lg:hidden"
          >
            <ArrowUpTrayIcon width={16} height={16} aria-hidden="true" />
            Upload
          </Link>
        </div>

        <nav aria-label="Primary navigation" className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {primaryNavigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
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
      </div>
    </header>
  );
}
