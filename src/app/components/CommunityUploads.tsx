import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpTrayIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { fallbackUploads, type HomeUpload, safeImage } from './homepageContent';

type CommunityUploadsProps = {
  uploads?: HomeUpload[];
};

const uploadHref = '/login?redirect=%2Fdashboard%3Fsection%3Duploads';

export default function CommunityUploads({ uploads = [] }: CommunityUploadsProps) {
  const items = uploads.length > 0 ? uploads : fallbackUploads;

  return (
    <section id="community-uploads" aria-labelledby="community-uploads-heading" className="bg-card px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-secondary">
              Community fashion
            </p>
            <h2 id="community-uploads-heading" className="mt-3 font-playfair text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              User Outfit Inspiration
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-400">
              Approved community looks inspired by celebrity fashion, linked to crawlable public outfit pages.
            </p>
          </div>
          <Link
            href={uploadHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary/60 hover:text-secondary"
          >
            <ArrowUpTrayIcon width={16} height={16} aria-hidden="true" className="mr-2" />
            Upload your look
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((upload) => (
            <article key={upload.id} className="overflow-hidden rounded-lg border border-white/10 bg-background">
              <Link href={upload.path} className="group block h-full">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                  <Image
                    src={safeImage(upload.image)}
                    alt={upload.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                    {upload.category}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    By {upload.uploaderName}
                  </p>
                  <h3 className="mt-2 font-playfair text-xl font-semibold leading-snug text-white">{upload.title}</h3>
                  <div className="mt-4 flex items-center gap-5 text-sm text-neutral-400">
                    <span className="inline-flex items-center gap-2">
                      <HeartIcon width={16} height={16} aria-hidden="true" className="text-secondary" />
                      {upload.likes}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <EyeIcon width={16} height={16} aria-hidden="true" />
                      {upload.views}
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/fashion-gallery"
            className="inline-flex items-center rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90"
          >
            Explore more community style
          </Link>
        </div>
      </div>
    </section>
  );
}
