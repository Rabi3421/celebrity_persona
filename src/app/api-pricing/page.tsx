import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ApiPricingContent from './components/ApiPricingContent';

export const metadata: Metadata = {
  title: 'API Pricing – CelebrityPersona',
  description:
    'Simple, transparent pricing for the CelebrityPersona API. Start free with 100 requests/month. Upgrade anytime with Razorpay.',
};

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
