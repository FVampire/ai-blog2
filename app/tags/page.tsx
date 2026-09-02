import React from 'react';

import type { Metadata } from 'next';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import PopularTags from '../../components/PopularTags';
import TagCloud from '../../components/TagCloud';

const PAGE_TITLE = '全部标签';
const PAGE_DESCRIPTION = '按标签浏览站点上的文章。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  icons: { icon: '/favicon.ico' },
  alternates: { canonical: `${SITE_URL}/tags` },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/tags`,
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['/og-default.png'],
  },
};

export default function TagsPage() {
  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">{PAGE_TITLE}</h1>
              <TagCloud variant="page" />
            </div>
          </div>

          <div className="sidebar">
            <PopularTags />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
