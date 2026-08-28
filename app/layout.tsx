import type { Metadata } from 'next';

import '../styles/globals.css';
import '../styles/admin.css';
import { Providers } from './providers';

const SITE_NAME = '五月的火';
const SITE_DESCRIPTION = '记录技术、设计与开发的个人博客';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/og-default.png'],
  },
  alternates: {
    canonical: SITE_URL,
    types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
