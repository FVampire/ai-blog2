-- Series as first-class records, plus outbound distribution jobs and settings.

CREATE TABLE IF NOT EXISTS post_series (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(160) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS series_id INTEGER REFERENCES post_series(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_series_id ON posts (series_id);

CREATE TABLE IF NOT EXISTS distribution_jobs (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  channel VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payload JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_distribution_jobs_post ON distribution_jobs (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_distribution_jobs_channel ON distribution_jobs (channel, status);

INSERT INTO settings (key, value, type, description) VALUES
  ('distribute_enabled', 'true', 'boolean', '发布后运行分发流水线（向量、摘要、出站通知）'),
  ('distribute_on_update', 'false', 'boolean', '已发布文章再次保存时是否重新分发到社交渠道'),
  ('distribute_indexnow_enabled', 'false', 'boolean', '发布后向搜索引擎发送 IndexNow 通知'),
  ('distribute_indexnow_key', '', 'string', 'IndexNow 密钥，也可通过 INDEXNOW_KEY 环境变量配置'),
  ('distribute_webhook_url', '', 'string', '通用出站 Webhook，发布后 POST JSON 文章摘要'),
  ('distribute_telegram_enabled', 'false', 'boolean', '发布后发送 Telegram 消息'),
  ('distribute_telegram_bot_token', '', 'string', 'Telegram Bot Token，也可通过 TELEGRAM_BOT_TOKEN 配置'),
  ('distribute_telegram_chat_id', '', 'string', 'Telegram Chat ID，也可通过 TELEGRAM_CHAT_ID 配置'),
  ('distribute_discord_webhook_url', '', 'string', 'Discord Incoming Webhook，也可通过 DISCORD_WEBHOOK_URL 配置'),
  ('distribute_wechat_enabled', 'false', 'boolean', '发布后调用公众号草稿箱 API 创建草稿'),
  ('distribute_wechat_app_id', '', 'string', '微信公众号 AppID，也可通过 WECHAT_APP_ID 配置'),
  ('distribute_wechat_app_secret', '', 'string', '微信公众号 AppSecret，也可通过 WECHAT_APP_SECRET 配置'),
  ('distribute_bilibili_webhook', '', 'string', 'B 站分发 Webhook（官方不提供个人发文 API，接到 n8n 等自动化）'),
  ('distribute_xiaohongshu_webhook', '', 'string', '小红书分发 Webhook（官方不提供个人发文 API）'),
  ('distribute_douyin_webhook', '', 'string', '抖音分发 Webhook（官方不提供个人图文 API）')
ON CONFLICT (key) DO NOTHING;

-- Backfill series from existing prev/next chains.
WITH RECURSIVE heads AS (
  SELECT p.id AS head_id, p.id, p.next_post_id, p.title, p.excerpt, p.image_url
  FROM posts p
  WHERE p.prev_post_id IS NULL AND p.next_post_id IS NOT NULL
),
chain AS (
  SELECT head_id, id, next_post_id, title, excerpt, image_url, 1 AS position
  FROM heads
  UNION ALL
  SELECT c.head_id, n.id, n.next_post_id, c.title, c.excerpt, c.image_url, c.position + 1
  FROM chain c
  JOIN posts n ON n.id = c.next_post_id
)
INSERT INTO post_series (slug, title, description, cover_url)
SELECT
  'series-' || h.head_id,
  h.title,
  COALESCE(h.excerpt, ''),
  h.image_url
FROM heads h
ON CONFLICT (slug) DO NOTHING;

WITH RECURSIVE heads AS (
  SELECT p.id AS head_id, p.id, p.next_post_id
  FROM posts p
  WHERE p.prev_post_id IS NULL AND p.next_post_id IS NOT NULL
),
chain AS (
  SELECT head_id, id, next_post_id
  FROM heads
  UNION ALL
  SELECT c.head_id, n.id, n.next_post_id
  FROM chain c
  JOIN posts n ON n.id = c.next_post_id
)
UPDATE posts
SET series_id = s.id
FROM chain c
JOIN post_series s ON s.slug = 'series-' || c.head_id
WHERE posts.id = c.id
  AND posts.series_id IS NULL;
