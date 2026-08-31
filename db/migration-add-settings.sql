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
  ('about_author_bio_short', '全栈与 AI 应用工程师，专注于将图形引擎、智能工作流与模型能力转化为可落地的产品，当前聚焦虚拟试穿、智能搭配与服装自动打版。', 'string', '首页作者简介'),
  ('about_author_bio', '全栈与 AI 应用工程师，长期专注于复杂业务系统的产品化与工程落地。技术实践横跨图形引擎、医疗 AI、智能工作流与服装科技，擅长将交互体验、服务架构、模型能力与业务流程组装成稳定、可扩展的产品系统。', 'string', '作者简介（第一段）'),
  ('about_author_bio_2', '曾参与在线 CAD 编辑器的核心研发，基于 Vue 3、Three.js、NestJS 与 MongoDB 构建浏览器端图形编辑与数据服务。在医疗 AI 领域，搭建过从扫码问卷、病历与影像资料上传，到语义解析、结构化数据生成和自研模型推理的完整链路，自动归纳现病史、既往史与主诉等临床信息，为医生提供诊疗决策的辅助参考。', 'string', '作者简介（第二段）'),
  ('about_author_bio_3', '也曾负责桌面办公软件的工作流平台建设，在 n8n 基础上进行深度定制，统一集成内外部工具、MCP、Agent 与各类服务，并将工作流封装为 API 和 MCP 能力，供公司其他系统复用，完成与桌面端的端到端打通。目前聚焦 AI 与服装产业的深度融合，推进虚拟试穿、智能搭配与服装自动打版等方向的研发与落地。', 'string', '作者简介（第三段）'),
  ('about_author_bio_4', '除行业项目外，我也持续用完整作品验证对产品、AI 与交互设计的理解。《墨灵 Moling》是一套面向长篇小说创作的桌面 AI 工作台，将故事规划、章节生产、Canon 记忆、审稿与修订组织为可追踪的创作闭环；《遗忘潮汐 The Forgetting Tide》则是一个从世界观、角色与核心玩法，到产品界面、场景美术与原创配乐的完整叙事构筑游戏案例。它们代表了我对“从概念到可运行产品”的长期坚持。', 'string', '作者简介（代表项目）'),
  ('about_social_links', '[{"platform":"twitter","name":"Twitter","url":"https://twitter.com"},{"platform":"github","name":"GitHub","url":"https://github.com"},{"platform":"linkedin","name":"LinkedIn","url":"https://linkedin.com"}]', 'json', '社交链接列表')
ON CONFLICT (key) DO NOTHING;
