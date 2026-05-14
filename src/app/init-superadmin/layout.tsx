import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Initialize Super Admin',
  description: 'Protected CelebrityPersona setup page.',
  path: '/init-superadmin',
  noIndex: true,
});

export default function InitSuperAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
