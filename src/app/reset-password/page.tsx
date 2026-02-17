import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ResetPasswordForm from './components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password - CelebrityPersona',
  description: 'Reset your CelebrityPersona account password to regain access to your account.',
};

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-32 pb-20">
        <ResetPasswordForm />
      </main>
      <Footer />
    </>
  );
}