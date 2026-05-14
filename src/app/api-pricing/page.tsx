import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ApiPricingContent from './components/ApiPricingContent';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'API Pricing',
  description:
    'Simple, transparent pricing for the CelebrityPersona API. Start free with 100 requests/month. Upgrade anytime with Razorpay.',
  path: '/api-pricing',
  keywords: ['celebrity API pricing', 'entertainment API pricing', 'CelebrityPersona API'],
});

export default function ApiPricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <ApiPricingContent />
      </main>
      <Footer />
    </>
  );
}
