export interface Taggable {
  name: string;
  slug: string;
  post_count?: number;
}

export interface TagGroup<T extends Taggable = Taggable> {
  id: string;
  label: string;
  tags: T[];
}

interface TagAlias {
  from: string[];
  to: string;
  toSlug: string;
}

interface TagGroupDefinition {
  id: string;
  label: string;
  slugs: string[];
}

const TAG_ALIASES: TagAlias[] = [
  { from: ['Ant Design', 'antd', 'ant-design'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['Tailwind CSS', 'tailwind', 'tailwind-css'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['CSS', 'css'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['Remix', 'remix'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['VitePress', 'vitepress'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['UI/UX', 'ui-ux', 'uiux'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['Web Development', 'web-development'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['WebAssembly', 'webassembly', 'wasm'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['Coding Standards', 'coding-standards'], to: 'Frontend', toSlug: 'frontend' },
  { from: ['Kafka', 'kafka'], to: 'Backend', toSlug: 'backend' },
  { from: ['MinIO', 'minio'], to: 'Database', toSlug: 'database' },
  { from: ['MongoDB', 'mongodb'], to: 'Database', toSlug: 'database' },
  { from: ['PostgreSQL', 'postgres', 'postgresql'], to: 'Database', toSlug: 'database' },
  { from: ['Caddy', 'caddy'], to: 'DevOps', toSlug: 'devops' },
  { from: ['Networking', 'networking'], to: 'DevOps', toSlug: 'devops' },
  { from: ['Proxy', 'proxy'], to: 'DevOps', toSlug: 'devops' },
  { from: ['可观测性'], to: 'DevOps', toSlug: 'devops' },
  { from: ['可靠性'], to: 'DevOps', toSlug: 'devops' },
  { from: ['Webhook', 'webhook'], to: 'API', toSlug: 'api' },
  { from: ['工作流'], to: 'n8n', toSlug: 'n8n' },
  { from: ['自动化'], to: 'n8n', toSlug: 'n8n' },
  { from: ['安全'], to: 'Security', toSlug: 'security' },
  { from: ['性能'], to: 'Performance', toSlug: 'performance' },
  { from: ['GDScript', 'gdscript'], to: 'Godot', toSlug: 'godot' },
  { from: ['2D', '2d'], to: 'Godot', toSlug: 'godot' },
  { from: ['Resource', 'resource'], to: 'Godot', toSlug: 'godot' },
  { from: ['架构'], to: 'Godot', toSlug: 'godot' },
  { from: ['导出'], to: 'Godot', toSlug: 'godot' },
  { from: ['游戏开发'], to: 'Godot', toSlug: 'godot' },
  { from: ['状态机'], to: 'Godot', toSlug: 'godot' },
  { from: ['Stable Diffusion', 'stable-diffusion'], to: 'AI', toSlug: 'ai' },
  { from: ['MCP', 'mcp'], to: 'AI', toSlug: 'ai' },
  { from: ['Obsidian', 'obsidian'], to: 'Productivity', toSlug: 'productivity' },
];

const TAG_GROUPS: TagGroupDefinition[] = [
  {
    id: 'stack',
    label: '语言与框架',
    slugs: ['typescript', 'javascript', 'react', 'nextjs', 'nodejs', 'nestjs', 'godot', 'rust'],
  },
  {
    id: 'area',
    label: '方向',
    slugs: ['frontend', 'backend', 'devops', 'ai'],
  },
  {
    id: 'infra',
    label: '基础设施',
    slugs: ['docker', 'database', 'api'],
  },
  {
    id: 'topic',
    label: '主题',
    slugs: ['n8n', 'security', 'performance', 'productivity'],
  },
];

const aliasByKey = new Map<string, TagAlias>();
for (const alias of TAG_ALIASES) {
  for (const from of alias.from) {
    aliasByKey.set(normalizeKey(from), alias);
  }
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveCanonicalTagName(name: string): string {
  const alias = aliasByKey.get(normalizeKey(name));
  return alias ? alias.to : name.trim();
}

export function resolveCanonicalTagSlug(slug: string): string | null {
  const alias = aliasByKey.get(normalizeKey(slug));
  if (!alias || alias.toSlug === normalizeKey(slug)) return null;
  return alias.toSlug;
}

export function getTagMergePairs(): Array<{ fromSlug: string; toSlug: string }> {
  const pairs = new Map<string, string>();
  for (const alias of TAG_ALIASES) {
    for (const from of alias.from) {
      const fromSlug = normalizeKey(from);
      if (fromSlug === alias.toSlug) continue;
      pairs.set(fromSlug, alias.toSlug);
    }
  }
  return [...pairs.entries()].map(([fromSlug, toSlug]) => ({ fromSlug, toSlug }));
}

export function groupTags<T extends Taggable>(tags: T[]): TagGroup<T>[] {
  const remaining = new Map(tags.map((tag) => [tag.slug, tag]));
  const groups: TagGroup<T>[] = [];

  for (const definition of TAG_GROUPS) {
    const grouped = definition.slugs
      .map((slug) => remaining.get(slug))
      .filter((tag): tag is T => Boolean(tag));
    if (grouped.length === 0) continue;
    for (const tag of grouped) remaining.delete(tag.slug);
    groups.push({ id: definition.id, label: definition.label, tags: grouped });
  }

  const leftover = [...remaining.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  if (leftover.length > 0) {
    groups.push({ id: 'other', label: '其他', tags: leftover });
  }

  return groups;
}
