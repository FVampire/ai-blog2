import { isIP } from 'node:net';

export type IpLocationProvider = 'ipwhois' | 'amap';

export interface IpLocation {
  ip: string;
  provider: IpLocationProvider;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  postalCode: string;
  adcode: string;
  rectangle: string;
}

export interface IpProviderResult {
  provider: IpLocationProvider;
  configured: boolean;
  success: boolean;
  cached: boolean;
  durationMs: number;
  data: IpLocation | null;
  error?: string;
}

export interface ResolvedIpLocation {
  ip: string;
  selected: IpLocation | null;
  results: IpProviderResult[];
}

interface CacheEntry {
  expiresAt: number;
  data: IpLocation;
}

const IPWHOIS_ENDPOINT = 'https://ipwho.is';
const AMAP_ENDPOINT = 'https://restapi.amap.com/v3/ip';
const REQUEST_TIMEOUT_MS = 3_500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 1_000;
const cache = new Map<string, CacheEntry>();

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return '数据源请求超时';
  if (error instanceof Error && error.message) return error.message;
  return '数据源请求失败';
}

function getAmapKey(): string {
  return process.env.AMAP_WEB_SERVICE_KEY?.trim() || process.env.AMAP_API_KEY?.trim() || '';
}

function cacheKey(provider: IpLocationProvider, ip: string): string {
  return `${provider}:${ip}`;
}

function readCache(provider: IpLocationProvider, ip: string): IpLocation | null {
  const key = cacheKey(provider, ip);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(data: IpLocation): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(cacheKey(data.provider, data.ip), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function fetchJson(url: URL): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      const upstreamMessage = stringValue(body?.message) || stringValue(body?.info);
      throw new Error(upstreamMessage || `数据源响应异常（HTTP ${response.status}）`);
    }
    if (!body) throw new Error('数据源返回了无效 JSON');
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeIpAddress(value: string): string | null {
  let ip = value.trim();
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);

  // Proxies sometimes expose IPv4 as an IPv4-mapped IPv6 address.
  const mappedIpv4 = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4 && isIP(mappedIpv4[1]) === 4) ip = mappedIpv4[1];

  return isIP(ip) ? ip : null;
}

export function isAmapConfigured(): boolean {
  return Boolean(getAmapKey());
}

export async function lookupIpWhoIs(input: string): Promise<IpProviderResult> {
  const startedAt = Date.now();
  const ip = normalizeIpAddress(input);
  if (!ip) {
    return { provider: 'ipwhois', configured: true, success: false, cached: false, durationMs: 0, data: null, error: 'IP 地址格式无效' };
  }

  const cached = readCache('ipwhois', ip);
  if (cached) {
    return { provider: 'ipwhois', configured: true, success: true, cached: true, durationMs: 0, data: cached };
  }

  try {
    const url = new URL(`/${encodeURIComponent(ip)}`, IPWHOIS_ENDPOINT);
    url.searchParams.set('lang', 'zh-CN');
    const raw = await fetchJson(url);
    if (raw.success === false) throw new Error(stringValue(raw.message) || 'ipwho.is 查询失败');

    const connection = (raw.connection && typeof raw.connection === 'object' ? raw.connection : {}) as Record<string, unknown>;
    const timezone = (raw.timezone && typeof raw.timezone === 'object' ? raw.timezone : {}) as Record<string, unknown>;
    const data: IpLocation = {
      ip: stringValue(raw.ip) || ip,
      provider: 'ipwhois',
      country: stringValue(raw.country),
      countryCode: stringValue(raw.country_code),
      region: stringValue(raw.region),
      city: stringValue(raw.city),
      district: '',
      latitude: numberValue(raw.latitude),
      longitude: numberValue(raw.longitude),
      timezone: stringValue(timezone.id),
      isp: stringValue(connection.isp),
      organization: stringValue(connection.org),
      asn: connection.asn === undefined || connection.asn === null ? '' : String(connection.asn),
      postalCode: stringValue(raw.postal),
      adcode: '',
      rectangle: '',
    };
    writeCache(data);
    return { provider: 'ipwhois', configured: true, success: true, cached: false, durationMs: Date.now() - startedAt, data };
  } catch (error) {
    return { provider: 'ipwhois', configured: true, success: false, cached: false, durationMs: Date.now() - startedAt, data: null, error: messageFrom(error) };
  }
}

export async function lookupAmapIp(input: string): Promise<IpProviderResult> {
  const startedAt = Date.now();
  const ip = normalizeIpAddress(input);
  const key = getAmapKey();
  if (!ip) {
    return { provider: 'amap', configured: Boolean(key), success: false, cached: false, durationMs: 0, data: null, error: 'IP 地址格式无效' };
  }
  if (!key) {
    return { provider: 'amap', configured: false, success: false, cached: false, durationMs: 0, data: null, error: '未配置 AMAP_WEB_SERVICE_KEY' };
  }
  if (isIP(ip) !== 4) {
    return { provider: 'amap', configured: true, success: false, cached: false, durationMs: 0, data: null, error: '高德基础 IP 定位仅支持 IPv4' };
  }

  const cached = readCache('amap', ip);
  if (cached) {
    return { provider: 'amap', configured: true, success: true, cached: true, durationMs: 0, data: cached };
  }

  try {
    const url = new URL(AMAP_ENDPOINT);
    url.searchParams.set('ip', ip);
    url.searchParams.set('key', key);
    url.searchParams.set('output', 'JSON');
    const raw = await fetchJson(url);
    if (String(raw.status) !== '1' || String(raw.infocode) !== '10000') {
      throw new Error(stringValue(raw.info) || '高德 IP 定位查询失败');
    }

    const province = stringValue(raw.province);
    const city = stringValue(raw.city);
    if (!province && !city) throw new Error('高德未返回国内城市信息');

    const data: IpLocation = {
      ip,
      provider: 'amap',
      country: '中国',
      countryCode: 'CN',
      region: province,
      city,
      district: '',
      latitude: null,
      longitude: null,
      timezone: 'Asia/Shanghai',
      isp: '',
      organization: '',
      asn: '',
      postalCode: '',
      adcode: stringValue(raw.adcode),
      rectangle: stringValue(raw.rectangle),
    };
    writeCache(data);
    return { provider: 'amap', configured: true, success: true, cached: false, durationMs: Date.now() - startedAt, data };
  } catch (error) {
    return { provider: 'amap', configured: true, success: false, cached: false, durationMs: Date.now() - startedAt, data: null, error: messageFrom(error) };
  }
}

export function selectPreferredLocation(results: IpProviderResult[]): IpLocation | null {
  const amap = results.find((result) => result.provider === 'amap' && result.success)?.data;
  const ipwhois = results.find((result) => result.provider === 'ipwhois' && result.success)?.data;

  // Amap's basic endpoint is China-only, so a usable city is the most precise
  // domestic result. ipwho.is remains the global and IPv6 fallback.
  if (amap?.city) return amap;
  if (ipwhois) return ipwhois;
  return amap || null;
}

export async function resolveIpLocation(input: string): Promise<ResolvedIpLocation> {
  const ip = normalizeIpAddress(input);
  if (!ip) return { ip: input.trim(), selected: null, results: [] };

  const results = await Promise.all([lookupIpWhoIs(ip), lookupAmapIp(ip)]);
  return { ip, selected: selectPreferredLocation(results), results };
}

export function formatIpCity(location: IpLocation | null): string {
  if (!location) return '';
  return location.city || location.region || location.country;
}
