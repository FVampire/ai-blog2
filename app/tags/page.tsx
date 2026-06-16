import React from 'react';

import type { Metadata } from 'next';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import PopularTags from '../../components/PopularTags';
import TagCloud from '../../components/TagCloud';

export const metadata: Metadata = {
  title: 'Tags - 五月的火',
  description: 'All tags',
  icons: { icon: '/favicon.ico' },
};

export default function TagsPage() {
  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">All Tags</h1>
              <TagCloud />
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
