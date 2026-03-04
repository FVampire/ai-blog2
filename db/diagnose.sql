-- 诊断脚本 - 检查用户和数据库状态

-- 1. 检查users表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'users'
) as users_table_exists;

-- 2. 检查所有用户
SELECT id, username, email, role, status,
       substring(password_hash, 1, 30) || '...' as password_preview,
       created_at
FROM users
ORDER BY created_at DESC;

-- 3. 检查admin用户
SELECT *
FROM users
WHERE username = 'admin';

-- 4. 检查posts表
SELECT COUNT(*) as total_posts,
       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts
FROM posts;

-- 5. 检查tags表
SELECT COUNT(*) as total_tags FROM tags;

-- 6. 检查所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
