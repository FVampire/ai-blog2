import React from "react";

import Link from "next/link";

import BlogList from "./BlogList";
import Pagination from "./Pagination";

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: Array<{ name: string; color: string }>;
  category?: { name: string; slug: string; color: string };
}

interface BlogSectionProps {
  posts: Post[];
  currentPage: number;
  totalPages: number;
}

const BlogSection: React.FC<BlogSectionProps> = ({ posts, currentPage, totalPages }) => {
  return (
    <div className="blog-section">
      <div className="home-latest-header">
        <div>
          <span className="section-eyebrow">RECENT NOTES</span>
          <h1 className="section-title">最新文章</h1>
          <p>近期写下的开发记录、问题复盘与实践心得。</p>
        </div>
        <Link href="/articles" className="section-more-link">浏览全部文章 <span>→</span></Link>
      </div>
      <BlogList posts={posts} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
};

export default BlogSection;
