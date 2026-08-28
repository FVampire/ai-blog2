import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { markdownSanitizeSchema } from '../markdown/plugins';
import { themeCss } from './themes';

export async function renderMarkdown(markdown: string, options: { allowHtml: boolean; sanitize: boolean }) {
  let processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: options.allowHtml });
  if (options.allowHtml) processor = processor.use(rehypeRaw);
  if (options.sanitize) processor = processor.use(rehypeSanitize, markdownSanitizeSchema);
  return String(await processor.use(rehypeSlug).use(rehypeHighlight, { detect: true }).use(rehypeStringify, { allowDangerousHtml: options.allowHtml }).process(markdown));
}

export function standaloneHtml(fragment: string, theme: 'plain' | 'neon', title = 'Markdown Document') {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title.replace(/[<>&"]/g, '')}</title><style>html,body{margin:0;background:${theme === 'neon' ? '#0f1419' : '#fff'}}${themeCss(theme)}</style></head><body><article class="markdown-body">${fragment}</article></body></html>`;
}

export function inlineHtml(fragment: string, theme: 'plain' | 'neon') {
  const dark = theme === 'neon';
  const styles: Record<string, string> = {
    h1: `font-size:32px;line-height:1.25;margin:30px 0 16px;color:${dark ? '#62e7f8' : '#17212b'}`,
    h2: `font-size:25px;line-height:1.3;margin:28px 0 14px;color:${dark ? '#a78bfa' : '#17212b'};border-bottom:1px solid ${dark ? '#31515a' : '#d8dee4'};padding-bottom:8px`,
    h3: `font-size:20px;margin:24px 0 12px;color:${dark ? '#ff86bd' : '#17212b'}`,
    p: 'margin:12px 0;line-height:1.75', blockquote: `margin:16px 0;padding:8px 16px;border-left:4px solid #00a8c7;background:${dark ? '#17212b' : '#f6f8fa'}`,
    pre: `padding:16px;overflow:auto;border-radius:10px;color:#dce7ef;background:#0f1419`, table: 'width:100%;border-collapse:collapse;margin:16px 0', th: 'padding:8px;border:1px solid #b8c1ca;background:#eef2f5', td: 'padding:8px;border:1px solid #b8c1ca', img: 'max-width:100%;height:auto',
  };
  let result = fragment;
  Object.entries(styles).forEach(([tag, style]) => { result = result.replace(new RegExp(`<${tag}(?=[\\s>])`, 'gi'), `<${tag} style="${style}"`); });
  return `<section style="box-sizing:border-box;padding:28px;color:${dark ? '#dce7ef' : '#24292f'};background:${dark ? '#0f1419' : '#ffffff'};font:16px/1.72 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${result}</section>`;
}
