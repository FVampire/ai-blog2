-- Migration: Add settings table for system configuration
-- Run this migration to add the settings table

-- Settings table (key-value store for system settings)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, type, description) VALUES
  -- 网站基本设置
  ('site_name', '我的博客', 'string', '网站名称'),
  ('site_description', '一个分享技术与生活的个人博客', 'string', '网站描述'),
  ('site_keywords', '博客,技术,编程,Web开发', 'string', '网站关键词(SEO)'),
  ('site_logo', '', 'string', '网站Logo URL'),
  ('site_favicon', '', 'string', '网站Favicon URL'),

  -- 显示设置
  ('posts_per_page', '10', 'number', '每页显示文章数量'),
  ('comments_per_page', '20', 'number', '每页显示评论数量'),
  ('excerpt_length', '200', 'number', '文章摘要字数'),

  -- 评论设置
  ('comments_enabled', 'true', 'boolean', '是否开启评论功能'),
  ('comments_moderation', 'true', 'boolean', '评论是否需要审核'),
  ('comments_guest_allowed', 'true', 'boolean', '是否允许游客评论'),

  -- 用户设置
  ('registration_enabled', 'false', 'boolean', '是否开放用户注册'),
  ('default_user_role', 'author', 'string', '新用户默认角色'),

  -- 上传设置
  ('upload_max_size', '5', 'number', '最大上传文件大小(MB)'),
  ('upload_allowed_types', 'jpg,jpeg,png,gif,webp', 'string', '允许上传的文件类型'),

  -- 社交媒体
  ('social_github', '', 'string', 'GitHub链接'),
  ('social_twitter', '', 'string', 'Twitter链接'),
  ('social_weibo', '', 'string', '微博链接'),

  -- 其他设置
  ('footer_text', '© 2024 我的博客. All rights reserved.', 'string', '页脚版权文字'),
  ('analytics_code', '', 'string', '统计分析代码'),

  -- 关于页面设置
  ('about_author_name', 'John Doe', 'string', '作者名称'),
  ('about_author_bio', 'I am a full-stack developer with over 10 years of experience building web applications. My passion lies in creating beautiful, functional, and user-friendly digital experiences.', 'string', '作者简介（第一段）'),
  ('about_author_bio_2', 'Throughout my career, I have worked with startups and enterprises alike, helping them transform their ideas into successful products. I specialize in modern JavaScript frameworks like React and Node.js.', 'string', '作者简介（第二段）'),
  ('about_author_bio_3', 'When I am not coding, you can find me hiking in the mountains, reading science fiction novels, or experimenting with new cooking recipes.', 'string', '作者简介（第三段）'),
  ('about_social_links', '[{"platform":"twitter","name":"Twitter","url":"https://twitter.com"},{"platform":"github","name":"GitHub","url":"https://github.com"},{"platform":"linkedin","name":"LinkedIn","url":"https://linkedin.com"}]', 'json', '社交链接列表')
ON CONFLICT (key) DO NOTHING;
