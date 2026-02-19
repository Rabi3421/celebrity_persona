'use client';

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SignupForm from './components/SignupForm';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function SignupPage() {
  const { loading } = useRedirectIfAuthenticated();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex flex-col pt-20">
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}