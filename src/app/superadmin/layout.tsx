import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/site';

export const metadata: Metadata = createMetadata({
  title: 'Super Admin',
  description: 'CelebrityPersona super admin area.',
  path: '/superadmin',
  noIndex: true,
});

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
