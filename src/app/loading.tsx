import BrandLogo from '@/components/brand/BrandLogo';

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <BrandLogo variant="full" tone="dark" markClassName="h-16 w-16" />
        <div className="h-px w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <p className="font-montserrat text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
          Loading editorial experience
        </p>
      </div>
    </main>
  );
}
