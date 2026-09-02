import { getCosPublicBaseUrl } from './storage/cos-config.ts';

const MEDIA_ROOT = 'uploads';

export function toMediaKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const segments = pathname.split('/').map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }).filter((segment) => segment && segment !== '.');

  if (segments.some((segment) => segment === '..')) return null;
  if (segments[0] !== MEDIA_ROOT) return null;
  return segments.join('/');
}

export function storedMediaUrl(key: string): string {
  return `/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function publicMediaUrl(input: string, env: NodeJS.ProcessEnv = process.env): string {
  const key = toMediaKey(input);
  if (!key) return input;
  const base = getCosPublicBaseUrl(env);
  if (!base) return storedMediaUrl(key);
  return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function exposeMediaUrl(input?: string | null, env: NodeJS.ProcessEnv = process.env): string {
  const value = (input || '').trim();
  if (!value) return '';
  return publicMediaUrl(value, env);
}

export function storeMediaUrl(input?: string | null): string {
  const value = (input || '').trim();
  if (!value) return '';
  const key = toMediaKey(value);
  return key ? storedMediaUrl(key) : value;
}

export function mediaReferencePrefixes(urlPrefix: string, env: NodeJS.ProcessEnv = process.env): string[] {
  const key = toMediaKey(urlPrefix);
  if (!key) return [urlPrefix];
  return [...new Set([storedMediaUrl(key), publicMediaUrl(key, env), urlPrefix].filter(Boolean))];
}

export function rewriteMarkdownMediaUrls(markdown: string, env: NodeJS.ProcessEnv = process.env): string {
  if (!markdown) return markdown;
  return markdown
    .replace(/(!\[[^\]]*]\()(\/uploads\/[^)\s]+)(\))/g, (_match, prefix: string, url: string, suffix: string) => {
      return `${prefix}${publicMediaUrl(url, env)}${suffix}`;
    })
    .replace(/(<img\b[^>]*\bsrc=["'])(\/uploads\/[^"']+)(["'])/gi, (_match, prefix: string, url: string, suffix: string) => {
      return `${prefix}${publicMediaUrl(url, env)}${suffix}`;
    });
}
