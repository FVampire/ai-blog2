import assert from 'node:assert/strict';
import test from 'node:test';

import { generateGeminiContent, getGeminiConfiguration, validateGeminiInput } from './gemini.ts';

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('Gemini input validation enforces limits', () => {
  assert.equal(validateGeminiInput({ prompt: 'hello' }), null);
  assert.equal(validateGeminiInput({ prompt: '' }), '请输入提示词');
  assert.equal(validateGeminiInput({ prompt: 'hello', temperature: 2.1 }), '温度必须在 0 到 2 之间');
  assert.equal(validateGeminiInput({ prompt: 'hello', maxOutputTokens: 1.5 }), '最大输出 Token 必须是 1 到 8192 之间的整数');
  assert.equal(validateGeminiInput({ prompt: 'hello', model: '../secret' }), '模型名称格式无效');
});

test('Gemini configuration never exposes the API key', () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-secret';
  process.env.GEMINI_MODEL = 'gemini-test';
  try {
    assert.deepEqual(getGeminiConfiguration(), { configured: true, model: 'gemini-test' });
    assert.equal('apiKey' in getGeminiConfiguration(), false);
  } finally {
    restoreEnv('GEMINI_API_KEY', previousKey);
    restoreEnv('GEMINI_MODEL', previousModel);
  }
});

test('Gemini response and token usage are normalized', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-secret';
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /models\/gemini-2\.5-flash:generateContent$/);
    assert.equal(String(url).includes('test-secret'), false);
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-secret');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.contents[0].parts[0].text, 'hello');
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '你好' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 3, totalTokenCount: 5 },
    }), { status: 200 });
  };
  try {
    const result = await generateGeminiContent({ prompt: 'hello' });
    assert.equal(result.text, '你好');
    assert.equal(result.finishReason, 'STOP');
    assert.equal(result.usage.totalTokens, 5);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('GEMINI_API_KEY', previousKey);
  }
});
