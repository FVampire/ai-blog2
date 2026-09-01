-- 使用项目内的 AI 生成头像
INSERT INTO settings (key, value, type, description)
VALUES ('author_avatar', '/avatar-ai-256.png', 'string', '作者头像 URL')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
