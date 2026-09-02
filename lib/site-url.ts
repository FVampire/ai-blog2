export function siteBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

export function absoluteUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = siteBaseUrl(env);
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
