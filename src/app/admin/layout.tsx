import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Admin',
  description: 'CelebrityPersona admin area.',
  path: '/admin',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
