import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Dashboard',
  description: 'Manage your CelebrityPersona account.',
  path: '/dashboard',
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
