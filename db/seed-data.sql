-- Insert mock blog posts data

-- First, let's ensure we have the admin user
-- The admin user should already exist from schema.sql, but we'll reference it

-- Insert mock blog posts
INSERT INTO posts (title, slug, excerpt, content, image_url, author_id, status, views, published_at)
VALUES
  (
    'Understanding Modern Web Development',
    'understanding-modern-web-development',
    'Explore the latest trends in web development and how modern frameworks are shaping the future of the web...',
    'In this comprehensive guide, we dive deep into modern web development practices. From React to Vue, from server-side rendering to static site generation, we cover it all. The web development landscape has evolved dramatically over the past few years, with new tools and frameworks emerging constantly. Understanding these changes is crucial for any developer looking to stay relevant in the field.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    1,
    'published',
    1234,
    '2024-05-15 10:30:00'
  ),
  (
    'The Art of UI/UX Design',
    'the-art-of-ui-ux-design',
    'Discover the principles that make user interfaces intuitive and user experiences memorable...',
    'User interface and user experience design are crucial aspects of modern web development. In this article, we explore the fundamental principles of good design, including visual hierarchy, color theory, typography, and user psychology. Learn how to create interfaces that not only look beautiful but also provide exceptional user experiences.',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    1,
    'published',
    892,
    '2024-04-28 14:20:00'
  ),
  (
    'Building Scalable Backend Systems',
    'building-scalable-backend-systems',
    'Learn how to design backend architectures that can handle growth and maintain performance...',
    'Scalability is a critical concern for any modern web application. This guide walks you through the essential patterns and practices for building backend systems that can grow with your user base. We cover topics like database optimization, caching strategies, load balancing, microservices architecture, and more.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
    1,
    'draft',
    0,
    NULL
  ),
  (
    'Introduction to TypeScript',
    'introduction-to-typescript',
    'Learn the fundamentals of TypeScript and how it can improve your JavaScript development workflow...',
    'TypeScript has become an essential tool in modern JavaScript development. This comprehensive introduction covers the basics of TypeScript, including type annotations, interfaces, generics, and more. Discover how TypeScript can help you catch bugs early, improve code maintainability, and enhance your development experience.',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    1,
    'published',
    2103,
    '2024-03-30 09:15:00'
  ),
  (
    'Mastering CSS Grid Layout',
    'mastering-css-grid-layout',
    'Dive deep into CSS Grid and discover how to create complex layouts with ease...',
    'CSS Grid is a powerful layout system that has revolutionized how we build web layouts. In this detailed tutorial, we explore all aspects of CSS Grid, from basic concepts to advanced techniques. Learn how to create responsive, flexible layouts that work across all devices and screen sizes.',
    'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=400&fit=crop',
    1,
    'published',
    756,
    '2024-03-15 11:45:00'
  ),
  (
    'React Performance Optimization',
    'react-performance-optimization',
    'Learn advanced techniques to optimize your React applications for better performance...',
    'Performance optimization is crucial for creating fast, responsive React applications. This guide covers various optimization techniques including memoization, code splitting, lazy loading, virtual scrolling, and more. Discover how to identify performance bottlenecks and implement solutions that make your React apps blazing fast.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    1,
    'published',
    1567,
    '2024-02-28 16:30:00'
  ),
  (
    'Getting Started with Node.js',
    'getting-started-with-nodejs',
    'A comprehensive guide to building server-side applications with Node.js...',
    'Node.js has transformed JavaScript into a powerful server-side language. This beginner-friendly guide introduces you to Node.js development, covering everything from setting up your environment to building your first API. Learn about modules, npm, Express.js, and asynchronous programming in Node.js.',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
    1,
    'draft',
    0,
    NULL
  ),
  (
    'Modern JavaScript ES6+ Features',
    'modern-javascript-es6-features',
    'Explore the latest JavaScript features that make your code more elegant and efficient...',
    'JavaScript has evolved significantly with ES6 and beyond. This comprehensive guide explores modern JavaScript features including arrow functions, destructuring, spread operators, template literals, async/await, and more. Learn how these features can help you write cleaner, more maintainable code.',
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=400&fit=crop',
    1,
    'published',
    934,
    '2024-01-30 13:00:00'
  ),
  (
    'Web Accessibility Best Practices',
    'web-accessibility-best-practices',
    'Learn how to build inclusive web applications that work for everyone...',
    'Web accessibility is not just a nice-to-have, it''s essential for creating inclusive web experiences. This guide covers WCAG guidelines, semantic HTML, ARIA attributes, keyboard navigation, screen reader compatibility, and more. Discover how to make your websites accessible to all users, regardless of their abilities.',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop',
    1,
    'published',
    645,
    '2024-01-15 10:00:00'
  ),
  (
    'API Design Principles',
    'api-design-principles',
    'Discover the key principles for designing clean and maintainable RESTful APIs...',
    'Designing a good API is crucial for building scalable, maintainable applications. This article covers REST principles, endpoint design, HTTP methods, status codes, versioning strategies, authentication, and documentation best practices. Learn how to create APIs that are intuitive, consistent, and developer-friendly.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    1,
    'published',
    823,
    '2023-12-30 15:30:00'
  );

-- Insert post-tag relationships
-- First, let's get the IDs of posts and tags and create associations

-- Get JavaScript tag for relevant posts
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('understanding-modern-web-development', 'introduction-to-typescript', 'getting-started-with-nodejs', 'modern-javascript-es6-features')
AND t.slug = 'javascript';

-- Get React tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('understanding-modern-web-development', 'react-performance-optimization')
AND t.slug = 'react';

-- Get TypeScript tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug = 'introduction-to-typescript'
AND t.slug = 'typescript';

-- Get UI/UX tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug = 'the-art-of-ui-ux-design'
AND t.slug = 'ui-ux';

-- Get Backend tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('building-scalable-backend-systems', 'getting-started-with-nodejs', 'api-design-principles')
AND t.slug = 'backend';

-- Get Node.js tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('building-scalable-backend-systems', 'getting-started-with-nodejs')
AND t.slug = 'nodejs';

-- Get CSS tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug = 'mastering-css-grid-layout'
AND t.slug = 'css';

-- Get Frontend tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('the-art-of-ui-ux-design', 'mastering-css-grid-layout')
AND t.slug = 'frontend';

-- Get Web Development tag
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.slug IN ('understanding-modern-web-development', 'web-accessibility-best-practices')
AND t.slug = 'web-development';

-- Verification query (optional - comment out in production)
-- SELECT p.title, p.status, p.views, p.published_at,
--        array_agg(t.name) as tags
-- FROM posts p
-- LEFT JOIN post_tags pt ON p.id = pt.post_id
-- LEFT JOIN tags t ON pt.tag_id = t.id
-- GROUP BY p.id
-- ORDER BY p.published_at DESC NULLS LAST;
