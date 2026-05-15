import Image from 'next/image';
import Link from 'next/link';

type FloatingCard = {
  id: string;
  type: 'celebrity' | 'fashion' | 'news' | 'movie';
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  position: string;
  href: string;
};

const floatingCards: FloatingCard[] = [
  {
    id: 'hero_card_1',
    type: 'celebrity',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d4aad93b-1770398321397.png',
    alt: 'Young woman with long brown hair in elegant black dress',
    title: 'Emma Watson',
    subtitle: 'Latest: Fashion Week 2026',
    position: 'top-[15%] left-[10%]',
    href: '/celebrity-profiles',
  },
  {
    id: 'hero_card_2',
    type: 'fashion',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_105afe58d-1768666763976.png',
    alt: 'Elegant beige blazer with gold buttons and white shirt',
    title: 'Trending Outfit',
    subtitle: 'Shop the Look',
    position: 'top-[20%] right-[10%]',
    href: '/fashion-gallery',
  },
  {
    id: 'hero_card_3',
    type: 'news',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_173546b70-1770609263557.png',
    alt: 'Entertainment event with red carpet and spotlights',
    title: 'Breaking News',
    subtitle: 'Oscars 2026 Nominations',
    position: 'bottom-[20%] left-[12%]',
    href: '/celebrity-news',
  },
  {
    id: 'hero_card_4',
    type: 'movie',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d7ea8e06-1766296438771.png',
    alt: 'Cinematic movie poster with dramatic lighting and city skyline',
    title: 'Upcoming Movie',
    subtitle: 'Releases March 2026',
    position: 'bottom-[15%] right-[16%]',
    href: '/upcoming-movies',
  },
];

function getGlowClass(type: FloatingCard['type']) {
  switch (type) {
    case 'celebrity':
      return 'glow-gold';
    case 'fashion':
      return 'glow-rose';
    case 'news':
      return 'glow-emerald';
    default:
      return '';
  }
}

export default function HeroSection() {
  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-title"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(251,191,36,0.08),transparent_35%,rgba(244,166,184,0.06)_70%,transparent)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="glass-card mb-6 inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 animate-fade-in-blur sm:mb-8">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" aria-hidden="true" />
          <span className="text-sm font-medium text-neutral-300">
            Trending Celebrity Fashion
          </span>
        </p>

        <h1
          id="home-hero-title"
          className="mb-5 font-playfair text-4xl font-bold leading-tight text-white animate-fade-in-up delay-100 min-[390px]:text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Discover
          <br />
          <span className="text-gradient-gold">Celebrity Style</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl font-inter text-base leading-7 text-neutral-400 animate-fade-in-up delay-200 sm:text-lg md:mb-12 md:text-xl">
          Fashion, Profiles, Movies & More - Your one-stop destination for celebrity-inspired style
        </p>

        <div className="mx-auto flex w-full max-w-sm flex-col items-stretch justify-center gap-3 animate-fade-in-up delay-300 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/fashion-gallery"
            className="glass-card rounded-full px-6 py-3.5 text-center transition-all hover:glow-gold sm:px-8 sm:py-4"
          >
            <span className="text-base font-medium text-white">Explore Now</span>
          </Link>
          <Link
            href="/celebrity-profiles"
            className="glass-card rounded-full border-2 border-white/20 px-6 py-3.5 text-center transition-all hover:border-primary/50 sm:px-8 sm:py-4"
          >
            <span className="text-base font-medium text-neutral-300">View Profiles</span>
          </Link>
        </div>
      </div>

      <div className="hidden lg:block">
        {floatingCards.map((card, index) => (
          <article
            key={card.id}
            className={`absolute ${card.position} w-64 overflow-hidden rounded-2xl glass-card ${getGlowClass(
              card.type
            )} animate-float transition-all duration-500 hover:scale-105`}
            style={{ animationDelay: `${index * 0.5}s` }}
          >
            <Link href={card.href} className="block">
              <div className="relative aspect-[4/5]">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-4">
                <h2 className="mb-1 font-playfair text-lg font-semibold text-white">
                  {card.title}
                </h2>
                <p className="text-sm text-neutral-400">{card.subtitle}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
