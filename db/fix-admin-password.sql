-- 修复admin用户密码
-- 密码: admin123

-- 方法1: 更新现有用户
UPDATE users
SET password_hash = '$2b$10$aiK0FN.xB8qIDdPVB0BUoOtEa0aSRZIaO2yUiF1hQAuKGnKZ2VzTG'
WHERE username = 'admin';

-- 方法2: 如果用户不存在则创建，存在则更新密码
INSERT INTO users (username, email, password_hash, role, status)
VALUES ('admin', 'admin@example.com', '$2b$10$aiK0FN.xB8qIDdPVB0BUoOtEa0aSRZIaO2yUiF1hQAuKGnKZ2VzTG', 'admin', 'active')
ON CONFLICT (username)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  status = 'active';

-- 验证用户已创建/更新
SELECT id, username, email, role, status,
       substring(password_hash, 1, 20) || '...' as password_hash_preview
FROM users
WHERE username = 'admin';
