-- 为 About 页面增加可维护的技能列表
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_skills_name_category UNIQUE (name, category)
);

CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order, id);

INSERT INTO skills (name, category, sort_order) VALUES
  ('Vue 3', 'Frontend & Graphics', 10),
  ('React / Next.js', 'Frontend & Graphics', 20),
  ('TypeScript', 'Frontend & Graphics', 30),
  ('Three.js / CAD', 'Frontend & Graphics', 40),
  ('NestJS / Node.js', 'Backend & Data', 50),
  ('PostgreSQL', 'Backend & Data', 60),
  ('MongoDB', 'Backend & Data', 70),
  ('LLM Applications', 'AI & Agents', 80),
  ('MCP / Agent', 'AI & Agents', 90),
  ('n8n Workflow Orchestration', 'AI & Agents', 100),
  ('Virtual Try-on & Styling', 'Fashion Tech', 110),
  ('Automated Pattern Making', 'Fashion Tech', 120)
ON CONFLICT (name, category) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;
