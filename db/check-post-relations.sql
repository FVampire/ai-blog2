-- 检查 posts 表结构，确认 prev_post_id 和 next_post_id 字段是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('prev_post_id', 'next_post_id')
ORDER BY column_name;
