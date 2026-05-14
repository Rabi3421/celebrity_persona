import Link from 'next/link';

export default function CTASection() {
  return (
    <section aria-labelledby="homepage-cta-heading" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl border-y border-white/10 py-14 text-center">
        <h2 id="homepage-cta-heading" className="font-playfair text-4xl font-bold leading-tight text-white md:text-6xl">
          Join the Celebrity Fashion Community
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
          Upload celebrity-inspired outfits, explore shoppable looks, and follow new profile, fashion, article, and movie updates.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?redirect=%2Fdashboard%3Fsection%3Duploads"
            className="w-full rounded-full bg-primary px-8 py-4 text-base font-semibold text-black transition hover:bg-primary/90 sm:w-auto"
          >
            Upload Your Outfit
          </Link>
          <Link
            href="/fashion-gallery"
            className="w-full rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-primary/60 hover:text-primary sm:w-auto"
          >
            Browse More Styles
          </Link>
        </div>
      </div>
    </section>
  );
}
