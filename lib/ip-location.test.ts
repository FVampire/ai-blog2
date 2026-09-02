import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatIpCity,
  lookupAmapIp,
  lookupIpWhoIs,
  normalizeIpAddress,
  selectPreferredLocation,
  type IpLocation,
  type IpProviderResult,
} from './ip-location.ts';

function location(provider: IpLocation['provider'], overrides: Partial<IpLocation> = {}): IpLocation {
  return {
    ip: '1.2.3.4', provider, country: '', countryCode: '', region: '', city: '', district: '',
    latitude: null, longitude: null, timezone: '', isp: '', organization: '', asn: '',
    postalCode: '', adcode: '', rectangle: '', ...overrides,
  };
}

function success(data: IpLocation): IpProviderResult {
  return { provider: data.provider, configured: true, success: true, cached: false, durationMs: 1, data };
}

test('normalizeIpAddress accepts IPv4, IPv6, brackets and mapped IPv4', () => {
  assert.equal(normalizeIpAddress(' 8.8.8.8 '), '8.8.8.8');
  assert.equal(normalizeIpAddress('[2001:4860:4860::8888]'), '2001:4860:4860::8888');
  assert.equal(normalizeIpAddress('::ffff:8.8.4.4'), '8.8.4.4');
  assert.equal(normalizeIpAddress('8.8.8.999'), null);
  assert.equal(normalizeIpAddress('example.com'), null);
});

test('selectPreferredLocation prefers a usable Amap city', () => {
  const global = location('ipwhois', { country: '中国', city: '杭州市' });
  const domestic = location('amap', { country: '中国', region: '浙江省', city: '杭州市' });
  assert.equal(selectPreferredLocation([success(global), success(domestic)]), domestic);
});

test('selectPreferredLocation falls back to ipwho.is when Amap has no city', () => {
  const global = location('ipwhois', { country: '美国', city: '山景城' });
  const domestic = location('amap', { country: '中国', region: '北京市' });
  assert.equal(selectPreferredLocation([success(global), success(domestic)]), global);
  assert.equal(formatIpCity(global), '山景城');
});

test('lookupIpWhoIs normalizes the upstream response', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    ip: '9.9.9.9',
    country: '美国',
    country_code: 'US',
    region: '纽约州',
    city: '纽约',
    latitude: 40.71,
    longitude: -74,
    postal: '10001',
    connection: { asn: 19281, org: 'Quad9', isp: 'Quad9' },
    timezone: { id: 'America/New_York' },
  }), { status: 200 });

  try {
    const result = await lookupIpWhoIs('9.9.9.9');
    assert.equal(result.success, true);
    assert.equal(result.data?.city, '纽约');
    assert.equal(result.data?.asn, '19281');
    assert.equal(result.data?.timezone, 'America/New_York');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('lookupAmapIp sends the server key and normalizes a domestic result', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.AMAP_WEB_SERVICE_KEY;
  let requestUrl = '';
  process.env.AMAP_WEB_SERVICE_KEY = 'test-server-key';
  globalThis.fetch = async (input) => {
    requestUrl = String(input);
    return new Response(JSON.stringify({
      status: '1', info: 'OK', infocode: '10000', province: '浙江省', city: '杭州市',
      adcode: '330100', rectangle: '119.9,29.9;120.5,30.6',
    }), { status: 200 });
  };

  try {
    const result = await lookupAmapIp('1.2.3.5');
    assert.equal(result.success, true);
    assert.equal(result.data?.provider, 'amap');
    assert.equal(result.data?.city, '杭州市');
    assert.equal(new URL(requestUrl).searchParams.get('key'), 'test-server-key');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AMAP_WEB_SERVICE_KEY;
    else process.env.AMAP_WEB_SERVICE_KEY = previousKey;
  }
});

test('lookupAmapIp treats an empty successful response as no result, not a request failure', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.AMAP_WEB_SERVICE_KEY;
  process.env.AMAP_WEB_SERVICE_KEY = 'test-server-key';
  globalThis.fetch = async () => new Response(JSON.stringify({
    status: '1', info: 'OK', infocode: '10000', province: [], city: [], adcode: [], rectangle: [],
  }), { status: 200 });

  try {
    const result = await lookupAmapIp('114.114.114.114');
    assert.equal(result.success, true);
    assert.equal(result.noResult, true);
    assert.equal(result.data, null);
    assert.match(result.message || '', /请求成功/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AMAP_WEB_SERVICE_KEY;
    else process.env.AMAP_WEB_SERVICE_KEY = previousKey;
  }
});

test('lookupAmapIp explains a platform-mismatched key', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.AMAP_WEB_SERVICE_KEY;
  process.env.AMAP_WEB_SERVICE_KEY = 'test-server-key';
  globalThis.fetch = async () => new Response(JSON.stringify({
    status: '0', info: 'USERKEY_PLAT_NOMATCH', infocode: '10009',
  }), { status: 200 });

  try {
    const result = await lookupAmapIp('114.114.114.115');
    assert.equal(result.success, false);
    assert.match(result.error || '', /“Web服务”类型 Key/);
    assert.match(result.error || '', /10009/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AMAP_WEB_SERVICE_KEY;
    else process.env.AMAP_WEB_SERVICE_KEY = previousKey;
  }
});
