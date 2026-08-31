import { query } from './db';

export interface SkillItem {
  id: number;
  name: string;
  category: string;
  sort_order: number;
}

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  'Frontend & Graphics': '前端与图形',
  'Backend & Data': '后端与数据',
  'AI & Agents': 'AI 与智能体',
  'Fashion Tech': '服装科技',
};

export const DEFAULT_SKILLS: SkillItem[] = [
  { id: 1, name: 'Vue 3', category: 'Frontend & Graphics', sort_order: 10 },
  { id: 2, name: 'React / Next.js', category: 'Frontend & Graphics', sort_order: 20 },
  { id: 3, name: 'TypeScript', category: 'Frontend & Graphics', sort_order: 30 },
  { id: 4, name: 'Three.js / CAD', category: 'Frontend & Graphics', sort_order: 40 },
  { id: 5, name: 'NestJS / Node.js', category: 'Backend & Data', sort_order: 50 },
  { id: 6, name: 'PostgreSQL', category: 'Backend & Data', sort_order: 60 },
  { id: 7, name: 'MongoDB', category: 'Backend & Data', sort_order: 70 },
  { id: 8, name: 'LLM Applications', category: 'AI & Agents', sort_order: 80 },
  { id: 9, name: 'MCP / Agent', category: 'AI & Agents', sort_order: 90 },
  { id: 10, name: 'n8n Workflow Orchestration', category: 'AI & Agents', sort_order: 100 },
  { id: 11, name: 'Virtual Try-on & Styling', category: 'Fashion Tech', sort_order: 110 },
  { id: 12, name: 'Automated Pattern Making', category: 'Fashion Tech', sort_order: 120 },
];

export async function getSkills(): Promise<SkillItem[]> {
  try {
    const tableResult = await query(`SELECT to_regclass('skills') AS table_name`);
    if (!tableResult.rows[0]?.table_name) return DEFAULT_SKILLS;

    const result = await query(
      `SELECT id, name, category, sort_order FROM skills ORDER BY sort_order, id`,
    );
    return result.rows.length > 0 ? (result.rows as SkillItem[]) : DEFAULT_SKILLS;
  } catch (error) {
    console.error('Failed to load skills:', error);
    return DEFAULT_SKILLS;
  }
}
