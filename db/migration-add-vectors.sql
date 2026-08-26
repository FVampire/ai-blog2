-- Migration: Add Vector Search Support
-- 添加向量搜索支持，用于存储文章Embedding向量

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建文章向量表
CREATE TABLE IF NOT EXISTS post_vectors (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  content_vector vector(1024), --  bge-m3 维度
  excerpt_vector vector(1024), -- 摘要向量
  title_vector vector(1024),   -- 标题向量
  embedding_model VARCHAR(100) DEFAULT 'bge-m3', -- 使用的Embedding模型
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

-- 向量索引（表有数据后再建 IVFFlat 更稳，此处仅建普通索引）
CREATE INDEX IF NOT EXISTS idx_post_vectors_post_id ON post_vectors(post_id);

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_post_vectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_post_vectors_updated_at ON post_vectors;
CREATE TRIGGER update_post_vectors_updated_at
  BEFORE UPDATE ON post_vectors
  FOR EACH ROW EXECUTE FUNCTION update_post_vectors_updated_at();

-- 添加表注释
COMMENT ON TABLE post_vectors IS '存储博客文章的Embedding向量，用于向量搜索';
COMMENT ON COLUMN post_vectors.content_vector IS '文章内容的向量表示';
COMMENT ON COLUMN post_vectors.excerpt_vector IS '文章摘要的向量表示';
COMMENT ON COLUMN post_vectors.title_vector IS '文章标题的向量表示';
COMMENT ON COLUMN post_vectors.embedding_model IS '生成向量的Embedding模型名称';

-- 插入AI设置（如果不存在）
INSERT INTO settings (key, value, type, description) VALUES
  ('ai_embedding_provider', 'openai', 'string', 'Embedding服务提供商'),
  ('ai_embedding_api_key', '', 'string', 'Embedding API密钥'),
  ('ai_embedding_api_base_url', '', 'string', 'Embedding API基础URL'),
  ('ai_embedding_model', 'bge-m3', 'string', 'Embedding模型名称'),
  ('ai_vector_search_enabled', 'true', 'boolean', '是否启用向量搜索'),
  ('ai_vector_search_threshold', '0.7', 'string', '向量搜索相似度阈值(0-1)'),
  ('ai_vector_search_weight_title', '0.3', 'string', '标题向量搜索权重'),
  ('ai_vector_search_weight_content', '0.5', 'string', '内容向量搜索权重'),
  ('ai_vector_search_weight_excerpt', '0.2', 'string', '摘要向量搜索权重')
ON CONFLICT (key) DO NOTHING;
