import { siteBaseUrl } from '../site-url';

export function indexNowKeyLocation(env: NodeJS.ProcessEnv = process.env): string {
  return `${siteBaseUrl(env)}/indexnow-key.txt`;
}

export function buildIndexNowPayload(urls: string[], key: string, env: NodeJS.ProcessEnv = process.env) {
  const host = new URL(siteBaseUrl(env)).host;
  return {
    host,
    key,
    keyLocation: indexNowKeyLocation(env),
    urlList: urls,
  };
}

export async function pingIndexNow(urls: string[], key: string): Promise<{ ok: boolean; message: string }> {
  if (!key || urls.length === 0) {
    return { ok: false, message: 'IndexNow 未配置或没有 URL' };
  }

  const payload = buildIndexNowPayload(urls, key);
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  let lastError = 'IndexNow 请求失败';
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (response.ok || response.status === 202) {
        return { ok: true, message: `IndexNow 已提交 ${urls.length} 个 URL` };
      }
      lastError = `IndexNow ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'IndexNow 请求失败';
    }
  }
  return { ok: false, message: lastError };
}
