-- Migration: Add prev_post_id and next_post_id to posts table
-- This allows linking posts together in a series or sequence

-- Add columns for previous and next post relationships
ALTER TABLE posts ADD COLUMN IF NOT EXISTS prev_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS next_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_prev ON posts(prev_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_next ON posts(next_post_id);

-- Add comments for documentation
COMMENT ON COLUMN posts.prev_post_id IS 'ID of the previous post in a series';
COMMENT ON COLUMN posts.next_post_id IS 'ID of the next post in a series';
