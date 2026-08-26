-- Add color column to tags table
-- Migration: Add tag color support

-- Add color field to tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#FF6B6B';

-- Add comment
COMMENT ON COLUMN tags.color IS 'Tag color in hex format (e.g., #FF6B6B)';

-- Set default colors for existing tags
-- Use a variety of warm colors to differentiate tags
UPDATE tags
SET color = CASE
  WHEN id % 3 = 1 THEN '#FF6B6B'  -- Coral Red
  WHEN id % 3 = 2 THEN '#FFAB73'  -- Peach Orange
  ELSE '#FF9ECD'                  -- Pink
END
WHERE color IS NULL OR color = '#FF6B6B';

