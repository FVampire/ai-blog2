import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/tools/rate-limit';

const bodySchema = z.object({
  input: z.string().max(1_000_000),
  options: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
const SERVER_TOOLS = new Set(['yaml-json', 'code-format', 'sql-format']);

async function execute(slug: string, input: string, options: Record<string, string | number | boolean>) {
  if (slug === 'yaml-json') {
    const yaml = await import('js-yaml');
    return options.direction === 'json-yaml'
      ? yaml.dump(JSON.parse(input), { noRefs: true, lineWidth: 100 })
      : JSON.stringify(yaml.load(input), null, 2);
  }
  if (slug === 'code-format') {
    const prettier = await import('prettier');
    const allowed = new Set(['babel', 'typescript', 'css', 'json', 'html']);
    const parser = allowed.has(String(options.parser)) ? String(options.parser) : 'babel';
    return prettier.format(input, { parser, semi: options.semi !== false, tabWidth: 2, printWidth: 100 });
  }
  if (slug === 'sql-format') {
    const formatter = await import('sql-formatter');
    const allowed = new Set(['sql', 'postgresql', 'mysql', 'sqlite']);
    const language = allowed.has(String(options.language)) ? String(options.language) : 'sql';
    const keywordCase = ['upper', 'lower', 'preserve'].includes(String(options.keywordCase)) ? String(options.keywordCase) : 'upper';
    return formatter.format(input, { language: language as 'sql', keywordCase: keywordCase as 'upper' });
  }
  throw new Error('未知的服务端工具');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SERVER_TOOLS.has(slug)) return NextResponse.json({ success: false, error: '工具不存在或不支持服务端执行。' }, { status: 404 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(`server-transform:${ip}`, 20)) return NextResponse.json({ success: false, error: '请求过于频繁，请稍后再试。' }, { status: 429 });
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: '输入无效或超过 1 MB 限制。' }, { status: 400 });
    const output = await execute(slug, parsed.data.input, parsed.data.options);
    return NextResponse.json({ success: true, data: { output }, meta: { execution: 'server', persisted: false } });
  } catch (reason) {
    return NextResponse.json({ success: false, error: reason instanceof Error ? reason.message : '处理失败' }, { status: 400 });
  }
}
