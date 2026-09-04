export interface CurrencyInfo {
  code: string;
  name: string;
  symbol?: string;
}

export interface CurrencyConversion {
  amount: number;
  base: string;
  quote: string;
  rate: number;
  convertedAmount: number;
  date: string;
  provider?: string;
  durationMs: number;
}

const FRANKFURTER_ENDPOINT = 'https://api.frankfurter.dev/v2';
const REQUEST_TIMEOUT_MS = 15_000;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCIES_CACHE_MS = 24 * 60 * 60 * 1000;

let currenciesCache: { expiresAt: number; currencies: CurrencyInfo[] } | null = null;

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseApiError(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error && typeof record.error === 'object'
      ? record.error as Record<string, unknown>
      : {};
    return stringValue(record.message) || stringValue(nested.message) || `Frankfurter 响应异常（HTTP ${status}）`;
  }
  return `Frankfurter 响应异常（HTTP ${status}）`;
}

async function fetchFrankfurter(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${FRANKFURTER_ENDPOINT}${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as unknown;
    if (!response.ok) throw new Error(parseApiError(body, response.status));
    if (body === null) throw new Error(`Frankfurter 返回了无效 JSON（HTTP ${response.status}）`);
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Frankfurter 请求超时');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function validateCurrencyCode(value: string): string | null {
  return CURRENCY_PATTERN.test(value) ? null : '货币代码必须是 3 位大写字母';
}

export function validateConversionInput(base: string, quote: string, amount: number, date?: string): string | null {
  if (validateCurrencyCode(base) || validateCurrencyCode(quote)) return '请选择有效的基础货币和目标货币';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) return '金额必须大于 0 且不超过 1 万亿';
  if (date) {
    if (!DATE_PATTERN.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) return '日期格式无效';
    if (date > new Date().toISOString().slice(0, 10)) return '不能查询未来日期的汇率';
  }
  return null;
}

function normalizeCurrencies(body: unknown): CurrencyInfo[] {
  if (Array.isArray(body)) {
    return body.map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return {
        code: stringValue(row.iso_code || row.code).toUpperCase(),
        name: stringValue(row.name),
        symbol: stringValue(row.symbol) || undefined,
      };
    }).filter((currency) => CURRENCY_PATTERN.test(currency.code));
  }
  if (body && typeof body === 'object') {
    return Object.entries(body as Record<string, unknown>).map(([code, value]) => {
      if (typeof value === 'string') return { code: code.toUpperCase(), name: value };
      const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
      return {
        code: code.toUpperCase(),
        name: stringValue(row.name),
        symbol: stringValue(row.symbol) || undefined,
      };
    }).filter((currency) => CURRENCY_PATTERN.test(currency.code));
  }
  return [];
}

export async function getFrankfurterCurrencies(): Promise<CurrencyInfo[]> {
  if (currenciesCache && currenciesCache.expiresAt > Date.now()) return currenciesCache.currencies;
  const currencies = normalizeCurrencies(await fetchFrankfurter('/currencies'))
    .sort((left, right) => left.code.localeCompare(right.code));
  if (currencies.length === 0) throw new Error('Frankfurter 未返回货币列表');
  currenciesCache = { currencies, expiresAt: Date.now() + CURRENCIES_CACHE_MS };
  return currencies;
}

export async function convertWithFrankfurter(
  base: string,
  quote: string,
  amount: number,
  date?: string,
): Promise<CurrencyConversion> {
  const validationError = validateConversionInput(base, quote, amount, date);
  if (validationError) throw new Error(validationError);

  const startedAt = Date.now();
  if (base === quote) {
    return {
      amount, base, quote, rate: 1, convertedAmount: amount,
      date: date || new Date().toISOString().slice(0, 10), durationMs: Date.now() - startedAt,
    };
  }

  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  const body = await fetchFrankfurter(`/rate/${base}/${quote}${params}`);
  const row = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const rate = typeof row.rate === 'number' ? row.rate : Number(row.rate);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Frankfurter 未返回有效汇率');

  return {
    amount,
    base: stringValue(row.base) || base,
    quote: stringValue(row.quote) || quote,
    rate,
    convertedAmount: amount * rate,
    date: stringValue(row.date),
    provider: stringValue(row.provider) || undefined,
    durationMs: Date.now() - startedAt,
  };
}
