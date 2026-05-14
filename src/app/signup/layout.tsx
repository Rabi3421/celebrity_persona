import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Sign Up',
  description: 'Create a CelebrityPersona account.',
  path: '/signup',
  noIndex: true,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
