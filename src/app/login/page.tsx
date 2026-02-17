'use client';

import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LoginForm from './components/LoginForm';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function LoginPage() {
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
      <main className="min-h-screen bg-background pt-32 pb-20">
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}