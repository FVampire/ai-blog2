import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  buildAliyunSignedParameters,
  buildTencentAuthorization,
  translateWithAliyun,
  translateWithBaidu,
  translateWithTencent,
  validateTranslationInput,
} from './translation.ts';

const input = { text: 'hello', source: 'en', target: 'zh' };

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('validateTranslationInput enforces text and language constraints', () => {
  assert.equal(validateTranslationInput(input), null);
  assert.equal(validateTranslationInput({ ...input, text: '' }), '请输入要翻译的文本');
  assert.equal(validateTranslationInput({ ...input, target: 'en' }), '源语言和目标语言不能相同');
  assert.equal(validateTranslationInput({ ...input, target: 'auto' }), '不支持的目标语言');
});

test('Tencent TC3 authorization is deterministic and scoped to Hunyuan', () => {
  const authorization = buildTencentAuthorization(
    JSON.stringify({ Text: 'hello' }), 'AKIDEXAMPLE', 'secret', 1_725_163_200,
  );
  assert.match(authorization, /^TC3-HMAC-SHA256 Credential=AKIDEXAMPLE\/2024-09-01\/hunyuan\/tc3_request,/);
  assert.match(authorization, /SignedHeaders=content-type;host/);
  assert.match(authorization, /Signature=[a-f0-9]{64}$/);
});

test('Aliyun RPC parameters include a stable HMAC-SHA1 signature', () => {
  const params = buildAliyunSignedParameters(
    input, 'test-id', 'test-secret', new Date('2026-09-02T08:00:00Z'), 'fixed-nonce',
  );
  assert.equal(params.get('Action'), 'TranslateGeneral');
  assert.equal(params.get('Version'), '2018-10-12');
  assert.equal(params.get('SourceText'), 'hello');
  assert.equal(params.get('Signature'), 'aDp1HhyQ59yTY9YSGRJ6o2aSFag=');
});

test('Tencent Hunyuan response is normalized', async () => {
  const previousFetch = globalThis.fetch;
  const previousId = process.env.TENCENTCLOUD_SECRET_ID;
  const previousKey = process.env.TENCENTCLOUD_SECRET_KEY;
  process.env.TENCENTCLOUD_SECRET_ID = 'test-id';
  process.env.TENCENTCLOUD_SECRET_KEY = 'test-key';
  globalThis.fetch = async (_url, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('x-tc-action'), 'ChatTranslations');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.Text, 'hello');
    return new Response(JSON.stringify({ Response: {
      RequestId: 'tc-request', Choices: [{ Message: { Content: '你好' } }],
      Usage: { PromptTokens: 3, CompletionTokens: 2, TotalTokens: 5 },
    } }), { status: 200 });
  };
  try {
    const result = await translateWithTencent(input);
    assert.equal(result.success, true);
    assert.equal(result.translatedText, '你好');
    assert.equal(result.usage?.totalTokens, 5);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TENCENTCLOUD_SECRET_ID', previousId);
    restoreEnv('TENCENTCLOUD_SECRET_KEY', previousKey);
  }
});

test('Aliyun response is normalized', async () => {
  const previousFetch = globalThis.fetch;
  const previousId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const previousKey = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  process.env.ALIBABA_CLOUD_ACCESS_KEY_ID = 'test-id';
  process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET = 'test-key';
  globalThis.fetch = async () => new Response(JSON.stringify({
    Code: 200, Message: 'success', RequestId: 'ali-request',
    Data: { Translated: '你好', DetectedLanguage: 'en' },
  }), { status: 200 });
  try {
    const result = await translateWithAliyun(input);
    assert.equal(result.success, true);
    assert.equal(result.translatedText, '你好');
    assert.equal(result.detectedSource, 'en');
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('ALIBABA_CLOUD_ACCESS_KEY_ID', previousId);
    restoreEnv('ALIBABA_CLOUD_ACCESS_KEY_SECRET', previousKey);
  }
});

test('Baidu request maps language codes and signs the unencoded source text', async () => {
  const previousFetch = globalThis.fetch;
  const previousId = process.env.BAIDU_TRANSLATE_APP_ID;
  const previousKey = process.env.BAIDU_TRANSLATE_SECRET_KEY;
  process.env.BAIDU_TRANSLATE_APP_ID = 'test-app';
  process.env.BAIDU_TRANSLATE_SECRET_KEY = 'test-key';
  globalThis.fetch = async (_url, init) => {
    const params = new URLSearchParams(String(init?.body));
    const expected = createHash('md5').update(`test-apphello${params.get('salt')}test-key`).digest('hex');
    assert.equal(params.get('to'), 'zh');
    assert.equal(params.get('sign'), expected);
    return new Response(JSON.stringify({ from: 'en', to: 'zh', trans_result: [{ src: 'hello', dst: '你好' }] }), { status: 200 });
  };
  try {
    const result = await translateWithBaidu(input);
    assert.equal(result.success, true);
    assert.equal(result.translatedText, '你好');
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('BAIDU_TRANSLATE_APP_ID', previousId);
    restoreEnv('BAIDU_TRANSLATE_SECRET_KEY', previousKey);
  }
});
