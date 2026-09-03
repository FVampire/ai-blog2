import { publicMediaUrl } from '../media-url';
import { absoluteUrl } from '../site-url';

type FetchLike = typeof fetch;

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface WechatResponse {
  errcode?: number;
  errmsg?: string;
  media_id?: string;
  publish_id?: string;
  url?: string;
}

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export interface WechatDraftInput {
  appId: string;
  appSecret: string;
  title: string;
  author?: string;
  digest: string;
  content: string;
  sourceUrl: string;
  coverUrl: string;
}

export interface WechatDraftResult {
  mediaId: string;
  response: WechatResponse;
}

const tokenCache = new Map<string, TokenCacheEntry>();
const TOKEN_EXPIRY_SAFETY_MS = 5 * 60 * 1000;

export class WechatApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'WechatApiError';
  }
}

function mediaUrl(url: string): string {
  const exposed = publicMediaUrl(url);
  return /^https?:\/\//i.test(exposed) ? exposed : absoluteUrl(exposed);
}

async function readWechatResponse(response: Response, operation: string): Promise<WechatResponse> {
  let data: WechatResponse;
  try {
    data = await response.json() as WechatResponse;
  } catch {
    throw new WechatApiError(`${operation}返回了无效数据`);
  }

  if (!response.ok) {
    throw new WechatApiError(`${operation}失败（HTTP ${response.status}）`, data.errcode);
  }
  if (typeof data.errcode === 'number' && data.errcode !== 0) {
    throw new WechatApiError(`${operation}失败：${data.errmsg || `错误码 ${data.errcode}`}`, data.errcode);
  }
  return data;
}

export async function getWechatAccessToken(
  appId: string,
  appSecret: string,
  fetchImpl: FetchLike = fetch,
  forceRefresh = false,
): Promise<string> {
  const cached = tokenCache.get(appId);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.token;

  const params = new URLSearchParams({
    grant_type: 'client_credential',
    appid: appId,
    secret: appSecret,
  });
  const response = await fetchImpl(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`);
  let data: AccessTokenResponse;
  try {
    data = await response.json() as AccessTokenResponse;
  } catch {
    throw new WechatApiError('获取公众号 access_token 时返回了无效数据');
  }
  if (!response.ok || !data.access_token || (data.errcode && data.errcode !== 0)) {
    throw new WechatApiError(
      `获取公众号 access_token 失败：${data.errmsg || `HTTP ${response.status}`}`,
      data.errcode,
    );
  }

  const expiresIn = Math.max(600, Number(data.expires_in) || 7200);
  tokenCache.set(appId, {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000 - TOKEN_EXPIRY_SAFETY_MS,
  });
  return data.access_token;
}

export function clearWechatAccessToken(appId: string): void {
  tokenCache.delete(appId);
}

function safeFilename(url: string, contentType: string | null): string {
  const pathname = (() => {
    try { return new URL(url).pathname; } catch { return url; }
  })();
  const candidate = pathname.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '') || '';
  if (/\.(?:jpe?g|png|gif|webp)$/i.test(candidate)) return candidate;
  if (contentType?.includes('png')) return 'image.png';
  if (contentType?.includes('gif')) return 'image.gif';
  if (contentType?.includes('webp')) return 'image.webp';
  return 'image.jpg';
}

async function downloadImage(imageUrl: string, fetchImpl: FetchLike): Promise<{ blob: Blob; filename: string }> {
  const resolvedUrl = mediaUrl(imageUrl);
  const response = await fetchImpl(resolvedUrl);
  if (!response.ok) throw new WechatApiError(`下载文章图片失败（HTTP ${response.status}）`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return {
    blob: new Blob([bytes], { type: contentType }),
    filename: safeFilename(resolvedUrl, contentType),
  };
}

async function uploadWechatImage(
  accessToken: string,
  imageUrl: string,
  kind: 'cover' | 'content',
  fetchImpl: FetchLike,
): Promise<string> {
  const image = await downloadImage(imageUrl, fetchImpl);
  const form = new FormData();
  form.append('media', image.blob, image.filename);
  const endpoint = kind === 'cover'
    ? `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`
    : `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;
  const response = await fetchImpl(endpoint, { method: 'POST', body: form });
  const result = await readWechatResponse(response, kind === 'cover' ? '上传公众号封面' : '上传公众号正文图片');
  const value = kind === 'cover' ? result.media_id : result.url;
  if (!value) throw new WechatApiError(kind === 'cover' ? '公众号封面上传成功但未返回 media_id' : '公众号正文图片上传成功但未返回 URL');
  return value;
}

export async function rewriteWechatContentImages(
  html: string,
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const imagePattern = /<img\b[^>]*?\bsrc=(['"])(.*?)\1[^>]*>/gi;
  const sources: string[] = [];
  for (const match of html.matchAll(imagePattern)) {
    const source = match[2]?.trim();
    if (source && !source.startsWith('data:') && !/\.qpic\.cn\//i.test(source) && !sources.includes(source)) {
      sources.push(source);
    }
  }
  if (sources.length === 0) return html;

  const replacements = new Map<string, string>();
  for (const source of sources) {
    replacements.set(source, await uploadWechatImage(accessToken, source, 'content', fetchImpl));
  }
  return html.replace(imagePattern, (tag, _quote: string, source: string) => {
    const replacement = replacements.get(source.trim());
    return replacement ? tag.replace(source, replacement) : tag;
  });
}

async function createDraftWithToken(
  input: WechatDraftInput,
  accessToken: string,
  fetchImpl: FetchLike,
): Promise<WechatDraftResult> {
  const content = await rewriteWechatContentImages(input.content, accessToken, fetchImpl);
  const thumbMediaId = await uploadWechatImage(accessToken, input.coverUrl, 'cover', fetchImpl);
  const payload = {
    articles: [{
      title: input.title,
      author: input.author || '',
      digest: input.digest,
      content,
      content_source_url: input.sourceUrl,
      thumb_media_id: thumbMediaId,
      need_open_comment: 0,
      only_fans_can_comment: 0,
    }],
  };
  const response = await fetchImpl(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
  );
  const result = await readWechatResponse(response, '创建公众号草稿');
  if (!result.media_id) throw new WechatApiError('公众号草稿创建成功但未返回 media_id');
  return { mediaId: result.media_id, response: result };
}

function isExpiredToken(error: unknown): boolean {
  return error instanceof WechatApiError && (error.code === 40014 || error.code === 42001);
}

export async function createWechatDraft(
  input: WechatDraftInput,
  fetchImpl: FetchLike = fetch,
): Promise<WechatDraftResult> {
  if (!input.coverUrl) throw new WechatApiError('公众号草稿需要封面图片');
  let accessToken = await getWechatAccessToken(input.appId, input.appSecret, fetchImpl);
  try {
    return await createDraftWithToken(input, accessToken, fetchImpl);
  } catch (error) {
    if (!isExpiredToken(error)) throw error;
    clearWechatAccessToken(input.appId);
    accessToken = await getWechatAccessToken(input.appId, input.appSecret, fetchImpl, true);
    return createDraftWithToken(input, accessToken, fetchImpl);
  }
}

export async function submitWechatDraft(
  appId: string,
  appSecret: string,
  mediaId: string,
  fetchImpl: FetchLike = fetch,
): Promise<{ publishId: string; response: WechatResponse }> {
  let accessToken = await getWechatAccessToken(appId, appSecret, fetchImpl);
  const submit = async () => {
    const response = await fetchImpl(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: mediaId }) },
    );
    const result = await readWechatResponse(response, '提交公众号发布');
    if (!result.publish_id) throw new WechatApiError('公众号发布已提交但未返回 publish_id');
    return { publishId: result.publish_id, response: result };
  };
  try {
    return await submit();
  } catch (error) {
    if (!isExpiredToken(error)) throw error;
    clearWechatAccessToken(appId);
    accessToken = await getWechatAccessToken(appId, appSecret, fetchImpl, true);
    return submit();
  }
}
