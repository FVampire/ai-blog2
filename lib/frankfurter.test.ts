import assert from 'node:assert/strict';
import test from 'node:test';

import {
  convertWithFrankfurter,
  getFrankfurterCurrencies,
  validateConversionInput,
} from './frankfurter.ts';

test('Frankfurter conversion input validation rejects malformed values', () => {
  assert.equal(validateConversionInput('EUR', 'USD', 10), null);
  assert.equal(validateConversionInput('EU', 'USD', 10), '请选择有效的基础货币和目标货币');
  assert.equal(validateConversionInput('EUR', 'USD', 0), '金额必须大于 0 且不超过 1 万亿');
  assert.equal(validateConversionInput('EUR', 'USD', 10, 'not-a-date'), '日期格式无效');
});

test('Frankfurter v2 currency list is normalized', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://api.frankfurter.dev/v2/currencies');
    return new Response(JSON.stringify([
      { iso_code: 'USD', name: 'United States Dollar', symbol: '$' },
      { iso_code: 'EUR', name: 'Euro', symbol: '€' },
    ]), { status: 200 });
  };
  try {
    const currencies = await getFrankfurterCurrencies();
    assert.deepEqual(currencies, [
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'United States Dollar', symbol: '$' },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('Frankfurter v2 rate is converted locally', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://api.frankfurter.dev/v2/rate/EUR/USD?date=2024-01-02');
    return new Response(JSON.stringify({ date: '2024-01-02', base: 'EUR', quote: 'USD', rate: 1.0956 }), { status: 200 });
  };
  try {
    const result = await convertWithFrankfurter('EUR', 'USD', 10, '2024-01-02');
    assert.equal(result.convertedAmount, 10.956);
    assert.equal(result.rate, 1.0956);
    assert.equal(result.date, '2024-01-02');
  } finally {
    globalThis.fetch = previousFetch;
  }
});
