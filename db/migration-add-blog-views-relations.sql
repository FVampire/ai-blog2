-- Migration: views + prev/next navigation for blogs table
-- Mirrors posts.prev_post_id / posts.next_post_id / posts.views

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS prev_blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS next_blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blogs_prev ON blogs(prev_blog_id);
CREATE INDEX IF NOT EXISTS idx_blogs_next ON blogs(next_blog_id);

COMMENT ON COLUMN blogs.views IS 'Page view count';
COMMENT ON COLUMN blogs.prev_blog_id IS 'Previous blog in a custom series';
COMMENT ON COLUMN blogs.next_blog_id IS 'Next blog in a custom series';
