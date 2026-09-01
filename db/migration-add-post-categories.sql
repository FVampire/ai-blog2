-- High-level article categories (displayed as "专栏")

CREATE TABLE IF NOT EXISTS post_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6C757D',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS category_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_category'
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT fk_posts_category
      FOREIGN KEY (category_id) REFERENCES post_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_post_categories_slug ON post_categories(slug);

INSERT INTO post_categories (name, slug, description, color, sort_order) VALUES
  ('前端与体验', 'frontend-experience', '界面开发、框架实践与 Web 体验', '#7C5CFC', 10),
  ('后端工程', 'backend-engineering', '服务端框架、接口与系统实现', '#2563EB', 20),
  ('数据与中间件', 'data-middleware', '数据库、消息系统与数据基础设施', '#0F9D82', 30),
  ('部署与运维', 'devops-infrastructure', '部署、代理、容器与基础设施', '#F97316', 40),
  ('AI 与自动化', 'ai-automation', '生成式 AI、智能工具与自动化实践', '#DB2777', 50),
  ('工程实践', 'engineering-practice', '开发规范、性能探索与效率工具', '#64748B', 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'frontend-experience')
WHERE slug IN ('remix-tailwind-shadcn', 'vitepress', 'antdesign-tailwind', 'next-essay', 'react-vulnerability');

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'backend-engineering')
WHERE slug IN ('nest1', 'nest2', 'nest3');

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'data-middleware')
WHERE slug IN ('mongodb1', 'postgresql', 'kafka');

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'devops-infrastructure')
WHERE slug IN ('caddy2UserGuide', 'lan_proxy_usag', 'caddy-minio', 'docker-image-resource');

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'ai-automation')
WHERE slug IN ('stable-diffusion', 'zhihu_invites_designated_users', 'mcp-server-node');

UPDATE posts SET category_id = (SELECT id FROM post_categories WHERE slug = 'engineering-practice')
WHERE slug IN ('ProgrammingStandards', 'wasm_optimization', 'obsdian-recommended-configuration');

-- Keep every article that existed before this migration associated with a category.
UPDATE posts
SET category_id = (SELECT id FROM post_categories WHERE slug = 'engineering-practice')
WHERE category_id IS NULL;

DROP TRIGGER IF EXISTS update_post_categories_updated_at ON post_categories;
CREATE TRIGGER update_post_categories_updated_at BEFORE UPDATE ON post_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
