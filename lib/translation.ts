import { createHash, createHmac, randomUUID } from 'node:crypto';

export type TranslationProvider = 'tencent' | 'aliyun' | 'baidu';

export interface TranslationInput {
  text: string;
  source: string;
  target: string;
}

export interface TranslationResult {
  provider: TranslationProvider;
  configured: boolean;
  success: boolean;
  durationMs: number;
  translatedText: string;
  detectedSource: string;
  requestId: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  error?: string;
}

export const TRANSLATION_PROVIDERS: TranslationProvider[] = ['tencent', 'aliyun', 'baidu'];
export const TRANSLATION_LANGUAGES = [
  'auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'pt', 'it', 'th', 'vi', 'ar',
] as const;

const REQUEST_TIMEOUT_MS = 20_000;
const HUNYUAN_HOST = 'hunyuan.tencentcloudapi.com';
const ALIYUN_ENDPOINT = 'https://mt.cn-hangzhou.aliyuncs.com/';
const BAIDU_ENDPOINT = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

const baiduLanguageCodes: Record<string, string> = {
  auto: 'auto', zh: 'zh', en: 'en', ja: 'jp', ko: 'kor', fr: 'fra', de: 'de', es: 'spa',
  ru: 'ru', pt: 'pt', it: 'it', th: 'th', vi: 'vie', ar: 'ara',
};

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(algorithm: string, key: string | Buffer, value: string): Buffer {
  return createHmac(algorithm, key).update(value).digest();
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return '翻译请求超时';
  if (error instanceof Error && error.message) return error.message;
  return '翻译请求失败';
}

async function fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, cache: 'no-store', signal: controller.signal });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) throw new Error(`翻译服务返回了无效 JSON（HTTP ${response.status}）`);
    if (!response.ok) {
      const responseBody = (body.Response && typeof body.Response === 'object' ? body.Response : body) as Record<string, unknown>;
      const nestedError = (responseBody.Error && typeof responseBody.Error === 'object' ? responseBody.Error : {}) as Record<string, unknown>;
      throw new Error(stringValue(nestedError.Message) || stringValue(body.Message) || `翻译服务响应异常（HTTP ${response.status}）`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function unavailable(provider: TranslationProvider, startedAt: number, error: string): TranslationResult {
  return {
    provider, configured: false, success: false, durationMs: Date.now() - startedAt,
    translatedText: '', detectedSource: '', requestId: '', error,
  };
}

function failed(provider: TranslationProvider, startedAt: number, error: unknown): TranslationResult {
  return {
    provider, configured: true, success: false, durationMs: Date.now() - startedAt,
    translatedText: '', detectedSource: '', requestId: '', error: errorMessage(error),
  };
}

export function getTranslationConfiguration(): Record<TranslationProvider, boolean> {
  return {
    tencent: Boolean(process.env.TENCENTCLOUD_SECRET_ID?.trim() && process.env.TENCENTCLOUD_SECRET_KEY?.trim()),
    aliyun: Boolean(process.env.ALIBABA_CLOUD_ACCESS_KEY_ID?.trim() && process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET?.trim()),
    baidu: Boolean(process.env.BAIDU_TRANSLATE_APP_ID?.trim() && process.env.BAIDU_TRANSLATE_SECRET_KEY?.trim()),
  };
}

export function validateTranslationInput(input: TranslationInput): string | null {
  if (!input.text.trim()) return '请输入要翻译的文本';
  if (input.text.length > 2_000) return '单次翻译最多 2000 个字符';
  if (!TRANSLATION_LANGUAGES.includes(input.source as typeof TRANSLATION_LANGUAGES[number])) return '不支持的源语言';
  if (input.target === 'auto' || !TRANSLATION_LANGUAGES.includes(input.target as typeof TRANSLATION_LANGUAGES[number])) return '不支持的目标语言';
  if (input.source !== 'auto' && input.source === input.target) return '源语言和目标语言不能相同';
  return null;
}

export function buildTencentAuthorization(
  payload: string,
  secretId: string,
  secretKey: string,
  timestamp: number,
  host = HUNYUAN_HOST,
): string {
  const algorithm = 'TC3-HMAC-SHA256';
  const service = 'hunyuan';
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const signedHeaders = 'content-type;host';
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`;
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256(payload)}`;
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const secretDate = hmac('sha256', `TC3${secretKey}`, date);
  const secretService = hmac('sha256', secretDate, service);
  const secretSigning = hmac('sha256', secretService, 'tc3_request');
  const signature = createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  return `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

export async function translateWithTencent(input: TranslationInput): Promise<TranslationResult> {
  const startedAt = Date.now();
  const secretId = process.env.TENCENTCLOUD_SECRET_ID?.trim() || '';
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY?.trim() || '';
  if (!secretId || !secretKey) return unavailable('tencent', startedAt, '未配置腾讯云 SecretId / SecretKey');

  try {
    const body: Record<string, unknown> = {
      Model: process.env.TENCENTCLOUD_HUNYUAN_TRANSLATION_MODEL?.trim() || 'hunyuan-translation-lite',
      Stream: false,
      Text: input.text,
      Target: input.target,
    };
    if (input.source !== 'auto') body.Source = input.source;
    const payload = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000);
    const authorization = buildTencentAuthorization(payload, secretId, secretKey, timestamp);
    const raw = await fetchJson(`https://${HUNYUAN_HOST}/`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json; charset=utf-8',
        Host: HUNYUAN_HOST,
        'X-TC-Action': 'ChatTranslations',
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Version': '2023-09-01',
      },
      body: payload,
    });
    const response = (raw.Response && typeof raw.Response === 'object' ? raw.Response : {}) as Record<string, unknown>;
    const apiError = (response.Error && typeof response.Error === 'object' ? response.Error : null) as Record<string, unknown> | null;
    if (apiError) throw new Error(stringValue(apiError.Message) || stringValue(apiError.Code) || '腾讯混元翻译失败');
    const choices = Array.isArray(response.Choices) ? response.Choices : [];
    const first = (choices[0] && typeof choices[0] === 'object' ? choices[0] : {}) as Record<string, unknown>;
    const message = (first.Message && typeof first.Message === 'object' ? first.Message : {}) as Record<string, unknown>;
    const translatedText = stringValue(message.Content);
    if (!translatedText) throw new Error('腾讯混元未返回译文');
    const usageRaw = (response.Usage && typeof response.Usage === 'object' ? response.Usage : {}) as Record<string, unknown>;
    return {
      provider: 'tencent', configured: true, success: true, durationMs: Date.now() - startedAt,
      translatedText, detectedSource: input.source === 'auto' ? '' : input.source,
      requestId: stringValue(response.RequestId) || stringValue(response.Id),
      usage: {
        promptTokens: typeof usageRaw.PromptTokens === 'number' ? usageRaw.PromptTokens : undefined,
        completionTokens: typeof usageRaw.CompletionTokens === 'number' ? usageRaw.CompletionTokens : undefined,
        totalTokens: typeof usageRaw.TotalTokens === 'number' ? usageRaw.TotalTokens : undefined,
      },
    };
  } catch (error) {
    return failed('tencent', startedAt, error);
  }
}

function aliyunPercentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function buildAliyunSignedParameters(
  input: TranslationInput,
  accessKeyId: string,
  accessKeySecret: string,
  timestamp = new Date(),
  nonce: string = randomUUID(),
): URLSearchParams {
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'TranslateGeneral',
    Format: 'JSON',
    FormatType: 'text',
    RegionId: 'cn-hangzhou',
    Scene: 'general',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: nonce,
    SignatureVersion: '1.0',
    SourceLanguage: input.source,
    SourceText: input.text,
    TargetLanguage: input.target,
    Timestamp: timestamp.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2018-10-12',
  };
  const canonicalized = Object.keys(params).sort().map((key) => `${aliyunPercentEncode(key)}=${aliyunPercentEncode(params[key])}`).join('&');
  const stringToSign = `POST&%2F&${aliyunPercentEncode(canonicalized)}`;
  const signature = createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64');
  return new URLSearchParams({ ...params, Signature: signature });
}

export async function translateWithAliyun(input: TranslationInput): Promise<TranslationResult> {
  const startedAt = Date.now();
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID?.trim() || '';
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET?.trim() || '';
  if (!accessKeyId || !accessKeySecret) return unavailable('aliyun', startedAt, '未配置阿里云 AccessKey');

  try {
    const params = buildAliyunSignedParameters(input, accessKeyId, accessKeySecret);
    const raw = await fetchJson(ALIYUN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: params.toString(),
    });
    const response = (raw.TranslateGeneralResponse && typeof raw.TranslateGeneralResponse === 'object'
      ? raw.TranslateGeneralResponse : raw) as Record<string, unknown>;
    const code = Number(response.Code);
    if (code !== 200) throw new Error(stringValue(response.Message) || `阿里云翻译失败（${showCode(response.Code)}）`);
    const data = (response.Data && typeof response.Data === 'object' ? response.Data : {}) as Record<string, unknown>;
    const translatedText = stringValue(data.Translated);
    if (!translatedText) throw new Error('阿里云未返回译文');
    return {
      provider: 'aliyun', configured: true, success: true, durationMs: Date.now() - startedAt,
      translatedText, detectedSource: stringValue(data.DetectedLanguage) || input.source,
      requestId: stringValue(response.RequestId),
    };
  } catch (error) {
    return failed('aliyun', startedAt, error);
  }
}

function showCode(value: unknown): string {
  return value === undefined || value === null ? '未知错误' : String(value);
}

export async function translateWithBaidu(input: TranslationInput): Promise<TranslationResult> {
  const startedAt = Date.now();
  const appId = process.env.BAIDU_TRANSLATE_APP_ID?.trim() || '';
  const secretKey = process.env.BAIDU_TRANSLATE_SECRET_KEY?.trim() || '';
  if (!appId || !secretKey) return unavailable('baidu', startedAt, '未配置百度翻译 APP ID / 密钥');

  try {
    const salt = randomUUID();
    const sign = createHash('md5').update(`${appId}${input.text}${salt}${secretKey}`).digest('hex');
    const params = new URLSearchParams({
      q: input.text,
      from: baiduLanguageCodes[input.source],
      to: baiduLanguageCodes[input.target],
      appid: appId,
      salt,
      sign,
    });
    const raw = await fetchJson(BAIDU_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: params.toString(),
    });
    if (raw.error_code) throw new Error(stringValue(raw.error_msg) || `百度翻译失败（${showCode(raw.error_code)}）`);
    const translations = Array.isArray(raw.trans_result) ? raw.trans_result : [];
    const translatedText = translations.map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return stringValue(row.dst);
    }).filter(Boolean).join('\n');
    if (!translatedText) throw new Error('百度翻译未返回译文');
    return {
      provider: 'baidu', configured: true, success: true, durationMs: Date.now() - startedAt,
      translatedText, detectedSource: stringValue(raw.from) || input.source,
      requestId: '',
    };
  } catch (error) {
    return failed('baidu', startedAt, error);
  }
}

export function translateWithProvider(provider: TranslationProvider, input: TranslationInput): Promise<TranslationResult> {
  if (provider === 'tencent') return translateWithTencent(input);
  if (provider === 'aliyun') return translateWithAliyun(input);
  return translateWithBaidu(input);
}
