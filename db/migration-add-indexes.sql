-- Migration: Add performance indexes
-- 补充列表页排序、标签过滤、全文检索所需的索引
-- 本脚本可重复执行（全部使用 CREATE INDEX IF NOT EXISTS）

-- 文章列表页最高频的排序路径。
-- PostRepository.getPublicPosts / getRelatedPosts、TagRepository.getPostsByTagSlug
-- 都使用 ORDER BY published_at DESC NULLS LAST。
-- PostgreSQL 中 DESC 默认是 NULLS FIRST，索引必须显式声明 NULLS LAST
-- 才能与查询的排序方向一致，否则规划器无法用它来避免排序。
CREATE INDEX IF NOT EXISTS idx_posts_published_at
  ON posts (published_at DESC NULLS LAST);

-- post_tags 只有 (post_id, tag_id) 复合主键，以 tag_id 为前导列的查询
-- （按标签查文章、统计标签下文章数）无法利用该主键索引。
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id
  ON post_tags (tag_id);

-- 全文检索索引，服务于 lib/repositories/PostRepository.ts 的 searchPosts。
--
-- 索引表达式必须与查询中的 to_tsvector(...) 逐字符一致（词典、列顺序、
-- COALESCE 写法都算在内），否则规划器不会命中它。查询中的写法是：
--   to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(p.content, ''))
--
-- 注意：searchPosts 用的是 'english' 词典，而本站内容以中文为主。
-- PostgreSQL 内置词典不做中文分词，连续的中文会被当作单个 token 处理，
-- plainto_tsquery('english', '中文词') 的召回效果因此相当有限
-- （要真正支持中文分词需要引入 zhparser / pg_jieba 之类的扩展，
--  届时索引和查询里的词典名要一起改）。
-- 即便如此本索引仍有价值：它让 WHERE ... @@ ... 不必对全表逐行现算 tsvector。
--
-- 已知限制：单篇文章正文过长时（tsvector 超过 1MB）建索引会失败，
-- 出现该错误说明需要改为只对 title/excerpt 建索引。
CREATE INDEX IF NOT EXISTS idx_posts_fulltext_english
  ON posts USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, ''))
  );
