import React from 'react';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import ScrollToTop from '@/components/common/ScrollToTop';
import '../styles/index.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Celebrity Persona',
  description: 'A platform for celebrity news, fashion, and movie reviews',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ScrollToTop />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
