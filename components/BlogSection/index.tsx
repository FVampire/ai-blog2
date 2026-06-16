import React from "react";

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
}

interface BlogSectionProps {
  posts: Post[];
  currentPage: number;
  totalPages: number;
}

const BlogSection: React.FC<BlogSectionProps> = ({ posts, currentPage, totalPages }) => {
  return (
    <div className="blog-section">
      <h1 className="section-title">Latest Articles</h1>
      <BlogList posts={posts} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
};

export default BlogSection;
