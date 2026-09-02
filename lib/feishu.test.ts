import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCommentNotificationBody,
  buildFeishuSign,
  escapeLarkMd,
  isFeishuWebhookUrl,
  resolveFeishuConfig,
  sendFeishuWebhook,
  truncateText,
} from './feishu.ts';

const validUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

test('isFeishuWebhookUrl accepts official custom-bot URLs only', () => {
  assert.equal(isFeishuWebhookUrl(validUrl), true);
  assert.equal(
    isFeishuWebhookUrl('https://open.larksuite.com/open-apis/bot/v2/hook/abc_def-123'),
    true,
  );
  assert.equal(isFeishuWebhookUrl('http://open.feishu.cn/open-apis/bot/v2/hook/abc'), false);
  assert.equal(isFeishuWebhookUrl('https://evil.example/open-apis/bot/v2/hook/abc'), false);
  assert.equal(isFeishuWebhookUrl('https://open.feishu.cn.evil.com/open-apis/bot/v2/hook/abc'), false);
  assert.equal(isFeishuWebhookUrl('https://open.feishu.cn/open-apis/bot/v2/hook/abc?x=1'), false);
  assert.equal(isFeishuWebhookUrl('https://user:pass@open.feishu.cn/open-apis/bot/v2/hook/abc'), false);
});

test('buildFeishuSign matches HMAC-SHA256 of timestamp + secret', () => {
  assert.equal(
    buildFeishuSign('test-secret', '1599360473'),
    'wSds2BzzFIIGf/WrhUO+NI1q/9j+FRJd3JNHKAq0NZY=',
  );
});

test('escapeLarkMd and truncateText keep card text bounded', () => {
  assert.equal(escapeLarkMd('a *b* [c]'), 'a \\*b\\* \\[c\\]');
  assert.equal(truncateText('  hi  ', 10), 'hi');
  assert.equal(truncateText('abcdefghij', 4), 'abcd…');
});

test('resolveFeishuConfig prefers env webhook and can be disabled', () => {
  const enabled = resolveFeishuConfig(
    { FEISHU_WEBHOOK_URL: validUrl },
    { feishu_notify_enabled: false, feishu_webhook_url: '' },
  );
  assert.deepEqual(
    { enabled: enabled.enabled, source: enabled.source, webhookUrl: enabled.webhookUrl },
    { enabled: true, source: 'env', webhookUrl: validUrl },
  );

  const disabled = resolveFeishuConfig(
    { FEISHU_WEBHOOK_URL: validUrl, FEISHU_NOTIFY_COMMENTS: 'false' },
    { feishu_notify_enabled: true },
  );
  assert.equal(disabled.enabled, false);

  const fromSettings = resolveFeishuConfig(
    {},
    { feishu_notify_enabled: true, feishu_webhook_url: validUrl, feishu_webhook_secret: 's' },
  );
  assert.equal(fromSettings.enabled, true);
  assert.equal(fromSettings.source, 'settings');
  assert.equal(fromSettings.secret, 's');

  const settingsOff = resolveFeishuConfig(
    {},
    { feishu_notify_enabled: false, feishu_webhook_url: validUrl },
  );
  assert.equal(settingsOff.enabled, false);
});

test('buildCommentNotificationBody includes review actions and optional sign', () => {
  const body = buildCommentNotificationBody(
    {
      postTitle: 'Hello *World*',
      postUrl: 'https://blog.example/posts/hello',
      adminUrl: 'https://blog.example/admin/comments',
      visitorId: 'abcdef12-3456-7890',
      city: '杭州',
      content: '不错 **啊**',
      status: 'pending',
      needsReview: true,
    },
    'secret',
    '111',
  );

  assert.equal(body.msg_type, 'interactive');
  assert.equal(body.timestamp, '111');
  assert.equal(body.sign, buildFeishuSign('secret', '111'));
  const card = body.card as { header: { title: { content: string } }; elements: Array<{ text?: { content: string } }> };
  assert.match(card.header.title.content, /待审核/);
  assert.match(card.elements[0].text?.content || '', /杭州/);
  assert.match(card.elements[1].text?.content || '', /不错 \\\*\\\*啊\\\*\\\*/);
});

test('sendFeishuWebhook posts JSON and treats code 0 as success', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    return new Response(JSON.stringify({ code: 0, msg: 'success' }), { status: 200 });
  };

  const result = await sendFeishuWebhook(validUrl, { msg_type: 'text' }, fetchImpl);
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, validUrl);
  assert.equal((calls[0].init.headers as Record<string, string>)['Content-Type'], 'application/json');
});

test('sendFeishuWebhook rejects non-Feishu URLs without fetching', async () => {
  let fetched = false;
  const fetchImpl: typeof fetch = async () => {
    fetched = true;
    return new Response('{}');
  };
  const result = await sendFeishuWebhook('https://example.com/hook', { msg_type: 'text' }, fetchImpl);
  assert.equal(result.ok, false);
  assert.equal(fetched, false);
  assert.match(result.message, /无效/);
});
