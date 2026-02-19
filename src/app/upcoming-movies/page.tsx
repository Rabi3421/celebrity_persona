import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import UpcomingMoviesInteractive from './components/UpcomingMoviesInteractive';

export const metadata: Metadata = {
  title: 'Upcoming Movies 2026 | Latest Trailers & Release Dates - CelebrityPersona',
  description:
    'Discover the most anticipated upcoming movies of 2026. Watch exclusive trailers, check release dates, explore cast details, and get early reviews. Stay ahead with Hollywood\'s biggest releases.',
  keywords: 'upcoming movies 2026, movie trailers, release dates, Hollywood movies, cinema releases, movie previews',
  openGraph: {
    title: 'Upcoming Movies 2026 | Latest Trailers & Release Dates',
    description: 'Discover the most anticipated upcoming movies of 2026. Watch exclusive trailers and get early access to reviews.',
    type: 'website',
    images: [{
      url: '/assets/images/upcoming-movies-og.jpg',
      width: 1200,
      height: 630,
      alt: 'Upcoming Movies 2026 Preview'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upcoming Movies 2026 | Latest Trailers & Release Dates',
    description: 'Discover the most anticipated upcoming movies of 2026. Watch exclusive trailers and get early access to reviews.'
  }
};

export default function UpcomingMoviesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Upcoming Movies 2026",
    "description": "Discover the most anticipated upcoming movies of 2026 with trailers, release dates, and cast information.",
    "url": "https://celebritypersona.com/upcoming-movies",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Upcoming Movies 2026",
      "description": "A curated list of the most anticipated movies releasing in 2026"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="min-h-screen bg-background pt-32">
        <UpcomingMoviesInteractive />
      </main>
      <Footer />
    </>
  );
}
