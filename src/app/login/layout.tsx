import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Login',
  description: 'Sign in to your CelebrityPersona account.',
  path: '/login',
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
