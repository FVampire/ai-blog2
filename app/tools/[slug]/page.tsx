import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TransformToolView from '@/components/tools/TransformToolView';
import SpecialToolView from '@/components/tools/SpecialToolView';
import { getAvailableTools, getTool } from '@/lib/tools/registry';
import { hasTransform } from '@/lib/tools/transforms';

const CUSTOM_ROUTES = new Set(['weather', 'markdown-to-html', 'mcp-explorer', 'js-playground']);
export function generateStaticParams() { return getAvailableTools().filter(({ slug }) => !CUSTOM_ROUTES.has(slug)).map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const meta = getTool((await params).slug);
  return meta ? { title: `${meta.name} - 工具箱`, description: meta.description } : {};
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getTool(slug);
  if (!meta || meta.status === 'planned') notFound();
  if (hasTransform(slug)) return <TransformToolView slug={slug} />;
  if (['timestamp', 'timezone', 'cron', 'text-diff', 'regex-tester', 'color', 'palette', 'gradient', 'image-base64', 'image-compress', 'qrcode'].includes(slug)) return <SpecialToolView slug={slug} />;
  notFound();
}
