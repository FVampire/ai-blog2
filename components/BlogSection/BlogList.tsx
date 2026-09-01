import React from "react";

import BlogPostCard from "../BlogPostCard";

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

interface BlogListProps {
  posts: Post[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无文章</p>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          title={post.title}
          date={post.date}
          author={post.author}
          excerpt={post.excerpt}
          slug={post.slug}
          image={post.image}
          tags={post.tags}
          category={post.category}
        />
      ))}
    </div>
  );
};

export default BlogList;
