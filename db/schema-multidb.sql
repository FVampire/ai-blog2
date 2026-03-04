-- Database Schema for Blog System
-- Multi-database compatible version

-- NOTES FOR MULTI-DATABASE COMPATIBILITY:
--
-- PostgreSQL:
--   - Uses SERIAL for auto-incrementing IDs
--   - Uses TIMESTAMP WITH TIME ZONE for timestamps
--   - Uses PL/pgSQL for triggers
--
-- MySQL:
--   - Use INT AUTO_INCREMENT instead of SERIAL
--   - Use TIMESTAMP for timestamps (converts to UTC)
--   - Use different trigger syntax
--
-- SQLite:
--   - Use INTEGER PRIMARY KEY for auto-incrementing IDs
--   - Use DATETIME for timestamps
--   - Triggers work but with some differences
--   - Does not support multiple statements in single query

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,  -- PostgreSQL: SERIAL, MySQL: INT AUTO_INCREMENT, SQLite: INTEGER PRIMARY KEY
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url VARCHAR(255),
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- PostgreSQL: TIMESTAMP WITH TIME ZONE, others: DATETIME
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url VARCHAR(255),
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Post_Tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Default data

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, status) VALUES (
  1, 'admin', 'admin@example.com', '$2b$10$aiK0FN.xB8qIDdPVB0BUoOtEa0aSRZIaO2yUiF1hQAuKGnKZ2VzTG', 'admin', 'active'
);

-- For MySQL, use this instead:
-- INSERT IGNORE INTO users (id, username, email, password_hash, role, status) VALUES (
--   1, 'admin', 'admin@example.com', '$2b$10$aiK0FN.xB8qIDdPVB0BUoOtEa0aSRZIaO2yUiF1hQAuKGnKZ2VzTG', 'admin', 'active'
-- );

-- Insert some sample tags
INSERT OR IGNORE INTO tags (id, name, slug) VALUES
  (1, 'JavaScript', 'javascript'),
  (2, 'React', 'react'),
  (3, 'TypeScript', 'typescript'),
  (4, 'Node.js', 'nodejs'),
  (5, 'Web Development', 'web-development'),
  (6, 'UI/UX', 'ui-ux'),
  (7, 'Backend', 'backend'),
  (8, 'Frontend', 'frontend'),
  (9, 'Database', 'database'),
  (10, 'CSS', 'css');

-- For MySQL, you would need to use multiple INSERT IGNORE statements or ON DUPLICATE KEY UPDATE