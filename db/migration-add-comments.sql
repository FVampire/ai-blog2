-- Add comments table for blog posts
-- Migration: Create comments system with visitor tracking

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_id VARCHAR(36) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  city VARCHAR(100),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_visitor_id ON comments(visitor_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Add comments
COMMENT ON TABLE comments IS 'User comments on blog posts';
COMMENT ON COLUMN comments.post_id IS 'Reference to the post being commented on';
COMMENT ON COLUMN comments.visitor_id IS 'Anonymous visitor identifier (UUID stored in cookie)';
COMMENT ON COLUMN comments.ip_address IS 'IP address of the commenter (IPv4 or IPv6)';
COMMENT ON COLUMN comments.content IS 'Comment text content';
COMMENT ON COLUMN comments.status IS 'Comment status: pending, approved, rejected';
COMMENT ON COLUMN comments.created_at IS 'When the comment was created';
COMMENT ON COLUMN comments.updated_at IS 'When the comment was last updated';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Verification query
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'comments'
ORDER BY ordinal_position;
