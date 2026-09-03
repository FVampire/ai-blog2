import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWechatDraft,
  getWechatAccessToken,
  rewriteWechatContentImages,
  WechatApiError,
} from './wechat-client.ts';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('getWechatAccessToken caches a valid token without exposing the secret', async () => {
  let calls = 0;
  const fetchMock = (async () => {
    calls += 1;
    return jsonResponse({ access_token: 'cached-token', expires_in: 7200 });
  }) as typeof fetch;

  const first = await getWechatAccessToken('cache-test-app', 'secret-value', fetchMock);
  const second = await getWechatAccessToken('cache-test-app', 'secret-value', fetchMock);

  assert.equal(first, 'cached-token');
  assert.equal(second, 'cached-token');
  assert.equal(calls, 1);
});

test('rewriteWechatContentImages uploads each unique non-WeChat image once', async () => {
  let downloads = 0;
  let uploads = 0;
  const fetchMock = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/cgi-bin/media/uploadimg')) {
      uploads += 1;
      return jsonResponse({ url: 'https://mmbiz.qpic.cn/uploaded.png' });
    }
    downloads += 1;
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  }) as typeof fetch;

  const html = '<p><img src="https://blog.test/a.png"><img alt="same" src="https://blog.test/a.png"><img src="https://mmbiz.qpic.cn/kept.png"></p>';
  const rewritten = await rewriteWechatContentImages(html, 'access-token', fetchMock);

  assert.equal(downloads, 1);
  assert.equal(uploads, 1);
  assert.equal((rewritten.match(/https:\/\/mmbiz\.qpic\.cn\/uploaded\.png/g) || []).length, 2);
  assert.match(rewritten, /https:\/\/mmbiz\.qpic\.cn\/kept\.png/);
});

test('createWechatDraft treats a WeChat errcode in an HTTP 200 response as failure', async () => {
  const fetchMock = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/cgi-bin/token')) {
      return jsonResponse({ access_token: 'draft-token', expires_in: 7200 });
    }
    if (url.includes('/cgi-bin/material/add_material')) {
      return jsonResponse({ media_id: 'cover-media-id' });
    }
    if (url.includes('/cgi-bin/draft/add')) {
      return jsonResponse({ errcode: 40007, errmsg: 'invalid media_id' });
    }
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    });
  }) as typeof fetch;

  await assert.rejects(
    () => createWechatDraft({
      appId: 'draft-error-test-app',
      appSecret: 'secret-value',
      title: '测试文章',
      digest: '测试摘要',
      content: '<p>正文</p>',
      sourceUrl: 'https://blog.test/posts/example',
      coverUrl: 'https://blog.test/cover.jpg',
    }, fetchMock),
    (error: unknown) => error instanceof WechatApiError && error.code === 40007,
  );
});
