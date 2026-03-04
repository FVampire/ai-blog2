import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TagCloud from '../components/TagCloud';
import PopularTags from '../components/PopularTags';

const TagsPage: React.FC = () => {
  return (
    <div>
      <Head>
        <title>Tags - My Blog</title>
        <meta name="description" content="All tags" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
};

export default TagsPage;