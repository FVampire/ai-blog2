"use client";

import { useEffect } from "react";

import { useArticle } from "../../../contexts/ArticleContext";

interface ArticleTrackerProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author_name: string;
    tags: { id: string | number; name: string; slug: string }[];
  };
}

export default function ArticleTracker({ post }: ArticleTrackerProps) {
  const { setArticle } = useArticle();

  useEffect(() => {
    setArticle({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      tags: post.tags,
    });

    return () => {
      setArticle(null);
    };
  }, [post, setArticle]);

  useEffect(() => {
    if (post && post.id) {
      fetch("/api/posts/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log(
              `View tracked for post ${post.id}, total views: ${data.data.views}`,
            );
          }
        })
        .catch((err) => {
          console.error("Failed to track view:", err);
        });
    }
  }, [post.id]);

  return null;
}
