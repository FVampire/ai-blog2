-- 更新关于页面的个人简介
INSERT INTO settings (key, value, type, description)
VALUES (
  'about_author_bio_short',
  '全栈与 AI 应用工程师，专注于将图形引擎、智能工作流与模型能力转化为可落地的产品，当前聚焦虚拟试穿、智能搭配与服装自动打版。',
  'string',
  '首页作者简介'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

UPDATE settings
SET value = '全栈与 AI 应用工程师，长期专注于复杂业务系统的产品化与工程落地。技术实践横跨图形引擎、医疗 AI、智能工作流与服装科技，擅长将交互体验、服务架构、模型能力与业务流程组装成稳定、可扩展的产品系统。',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'about_author_bio';

UPDATE settings
SET value = '曾参与在线 CAD 编辑器的核心研发，基于 Vue 3、Three.js、NestJS 与 MongoDB 构建浏览器端图形编辑与数据服务。在医疗 AI 领域，搭建过从扫码问卷、病历与影像资料上传，到语义解析、结构化数据生成和自研模型推理的完整链路，自动归纳现病史、既往史与主诉等临床信息，为医生提供诊疗决策的辅助参考。',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'about_author_bio_2';

UPDATE settings
SET value = '也曾负责桌面办公软件的工作流平台建设，在 n8n 基础上进行深度定制，统一集成内外部工具、MCP、Agent 与各类服务，并将工作流封装为 API 和 MCP 能力，供公司其他系统复用，完成与桌面端的端到端打通。目前聚焦 AI 与服装产业的深度融合，推进虚拟试穿、智能搭配与服装自动打版等方向的研发与落地。',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'about_author_bio_3';
