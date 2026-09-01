-- Curated multi-tag assignments for the existing article library.

INSERT INTO tags (name, slug, color) VALUES
  ('Coding Standards', 'coding-standards', '#64748B'),
  ('Caddy', 'caddy', '#0891B2'),
  ('DevOps', 'devops', '#F97316'),
  ('Remix', 'remix', '#7C3AED'),
  ('Tailwind CSS', 'tailwind-css', '#06B6D4'),
  ('NestJS', 'nestjs', '#E11D48'),
  ('VitePress', 'vitepress', '#10B981'),
  ('Ant Design', 'ant-design', '#1677FF'),
  ('Networking', 'networking', '#2563EB'),
  ('Proxy', 'proxy', '#4F46E5'),
  ('MongoDB', 'mongodb', '#16A34A'),
  ('MinIO', 'minio', '#DC2626'),
  ('Next.js', 'nextjs', '#475569'),
  ('AI', 'ai', '#DB2777'),
  ('Stable Diffusion', 'stable-diffusion', '#9333EA'),
  ('PostgreSQL', 'postgresql', '#336791'),
  ('API', 'api', '#0D9488'),
  ('Kafka', 'kafka', '#52525B'),
  ('MCP', 'mcp', '#8B5CF6'),
  ('Rust', 'rust', '#B45309'),
  ('WebAssembly', 'webassembly', '#654FF0'),
  ('Performance', 'performance', '#EA580C'),
  ('Docker', 'docker', '#2496ED'),
  ('Obsidian', 'obsidian', '#7C3AED'),
  ('Productivity', 'productivity', '#059669'),
  ('Security', 'security', '#DC2626')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  updated_at = CURRENT_TIMESTAMP;

WITH assignments(post_slug, tag_slug) AS (
  VALUES
    ('ProgrammingStandards', 'coding-standards'),

    ('caddy2UserGuide', 'caddy'),
    ('caddy2UserGuide', 'devops'),
    ('caddy2UserGuide', 'backend'),
    ('caddy2UserGuide', 'docker'),

    ('remix-tailwind-shadcn', 'remix'),
    ('remix-tailwind-shadcn', 'react'),
    ('remix-tailwind-shadcn', 'tailwind-css'),
    ('remix-tailwind-shadcn', 'typescript'),
    ('remix-tailwind-shadcn', 'frontend'),

    ('nest1', 'nestjs'),
    ('nest1', 'typescript'),
    ('nest1', 'nodejs'),
    ('nest1', 'backend'),
    ('nest2', 'nestjs'),
    ('nest2', 'typescript'),
    ('nest2', 'nodejs'),
    ('nest2', 'backend'),
    ('nest3', 'nestjs'),
    ('nest3', 'typescript'),
    ('nest3', 'nodejs'),
    ('nest3', 'backend'),

    ('vitepress', 'vitepress'),
    ('vitepress', 'typescript'),
    ('vitepress', 'frontend'),
    ('vitepress', 'web-development'),

    ('antdesign-tailwind', 'ant-design'),
    ('antdesign-tailwind', 'tailwind-css'),
    ('antdesign-tailwind', 'css'),
    ('antdesign-tailwind', 'frontend'),
    ('antdesign-tailwind', 'react'),

    ('lan_proxy_usag', 'networking'),
    ('lan_proxy_usag', 'proxy'),
    ('lan_proxy_usag', 'devops'),

    ('mongodb1', 'mongodb'),
    ('mongodb1', 'database'),
    ('mongodb1', 'backend'),
    ('mongodb1', 'docker'),

    ('caddy-minio', 'caddy'),
    ('caddy-minio', 'minio'),
    ('caddy-minio', 'devops'),
    ('caddy-minio', 'backend'),

    ('next-essay', 'nextjs'),
    ('next-essay', 'react'),
    ('next-essay', 'typescript'),
    ('next-essay', 'frontend'),

    ('stable-diffusion', 'stable-diffusion'),
    ('stable-diffusion', 'ai'),
    ('stable-diffusion', 'devops'),

    ('postgresql', 'postgresql'),
    ('postgresql', 'database'),
    ('postgresql', 'backend'),
    ('postgresql', 'devops'),

    ('zhihu_invites_designated_users', 'api'),
    ('zhihu_invites_designated_users', 'backend'),
    ('zhihu_invites_designated_users', 'web-development'),

    ('kafka', 'kafka'),
    ('kafka', 'backend'),
    ('kafka', 'docker'),

    ('mcp-server-node', 'mcp'),
    ('mcp-server-node', 'nestjs'),
    ('mcp-server-node', 'typescript'),
    ('mcp-server-node', 'nodejs'),
    ('mcp-server-node', 'backend'),
    ('mcp-server-node', 'ai'),

    ('wasm_optimization', 'rust'),
    ('wasm_optimization', 'webassembly'),
    ('wasm_optimization', 'performance'),
    ('wasm_optimization', 'javascript'),

    ('docker-image-resource', 'docker'),
    ('docker-image-resource', 'kafka'),
    ('docker-image-resource', 'devops'),

    ('obsdian-recommended-configuration', 'obsidian'),
    ('obsdian-recommended-configuration', 'productivity'),
    ('obsdian-recommended-configuration', 'javascript'),

    ('react-vulnerability', 'react'),
    ('react-vulnerability', 'nextjs'),
    ('react-vulnerability', 'security'),
    ('react-vulnerability', 'web-development')
)
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM assignments a
JOIN posts p ON p.slug = a.post_slug
JOIN tags t ON t.slug = a.tag_slug
ON CONFLICT (post_id, tag_id) DO NOTHING;
