-- Migration: Add AI settings
-- Run this migration to add AI-related settings

-- Insert AI settings
INSERT INTO settings (key, value, type, description) VALUES
  -- AI 基础配置
  ('ai_enabled', 'false', 'boolean', '是否启用AI功能'),
  ('ai_provider', 'openai', 'string', 'AI服务提供商(openai/anthropic/deepseek)'),
  ('ai_api_key', '', 'string', 'AI API密钥'),
  ('ai_api_base_url', '', 'string', 'AI API基础URL(可选,用于自定义端点)'),
  ('ai_model', 'gpt-3.5-turbo', 'string', 'AI模型名称'),
  ('ai_model_light', '', 'string', '轻量级AI模型名称(用于快速响应任务)'),
  ('ai_embedding_model', '', 'string', 'Embedding模型名称(用于文本向量化)'),

  -- AI 聊天助手配置
  ('ai_assistant_enabled', 'true', 'boolean', '是否启用AI聊天助手'),
  ('ai_assistant_name', '小助手', 'string', 'AI助手名称'),
  ('ai_assistant_avatar', '', 'string', 'AI助手头像URL'),
  ('ai_assistant_welcome', '你好！我是博客AI助手，可以帮你了解博客内容、回答技术问题。', 'string', 'AI助手欢迎语'),
  ('ai_assistant_system_prompt', '你是一个友好的博客AI助手，帮助用户了解博客内容和回答技术问题。请用简洁专业的方式回答。', 'string', 'AI助手系统提示词'),

  -- AI 功能开关
  ('ai_summary_enabled', 'false', 'boolean', '是否启用AI文章摘要'),
  ('ai_search_enabled', 'false', 'boolean', '是否启用AI智能搜索')
ON CONFLICT (key) DO NOTHING;
