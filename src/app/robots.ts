import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',
          '/assets/',
          '/brand/',
          '/favicon.ico',
          '/favicon.svg',
          '/icon.png',
          '/apple-touch-icon.png',
          '/android-chrome-192x192.png',
          '/android-chrome-512x512.png',
          '/manifest.json',
          '/site.webmanifest',
          '/og-image.png',
          '/twitter-image.png',
          '/robots.txt',
          '/sitemap.xml',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/admin',
          '/dashboard/',
          '/dashboard',
          '/superadmin/',
          '/superadmin',
          '/init-superadmin',
          '/login',
          '/signup',
          '/reset-password',
          '/auth/',
          '/account/',
          '/settings/',
          '/private/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
