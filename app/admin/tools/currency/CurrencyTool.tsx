'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';
import type { CurrencyConversion, CurrencyInfo } from '@/lib/frankfurter';

import styles from './currency.module.css';

const FALLBACK_CURRENCIES: CurrencyInfo[] = [
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', name: 'Singapore Dollar' },
];

function formatNumber(value: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('zh-CN', currency ? {
      style: 'currency', currency, maximumFractionDigits: 6,
    } : { maximumFractionDigits: 8 }).format(value);
  } catch {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 8 });
  }
}

export default function CurrencyTool() {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(FALLBACK_CURRENCIES);
  const [amount, setAmount] = useState('100');
  const [base, setBase] = useState('CNY');
  const [quote, setQuote] = useState('USD');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CurrencyConversion | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let cancelled = false;
    authJson<{ currencies: CurrencyInfo[] }>('/api/admin/frankfurter?action=currencies').then((response) => {
      if (cancelled) return;
      if (response.success && response.data?.currencies.length) setCurrencies(response.data.currencies);
      else toast.error(response.message || '货币列表加载失败，已使用常用货币');
    });
    return () => { cancelled = true; };
  }, []);

  const swap = () => {
    setBase(quote);
    setQuote(base);
    setResult(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return toast.error('请输入有效金额');

    setLoading(true);
    setResult(null);
    const params = new URLSearchParams({ action: 'convert', base, quote, amount: String(numericAmount) });
    if (date) params.set('date', date);
    const response = await authJson<CurrencyConversion>(`/api/admin/frankfurter?${params}`);
    setLoading(false);
    if (!response.success || !response.data) {
      toast.error(response.message || '汇率查询失败');
      return;
    }
    setResult(response.data);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><Link href="/admin/tools">管理员工具</Link> / 数据</p>
          <h1 className="page-title">Frankfurter 汇率查询</h1>
          <p className="page-description">查询最新或历史参考汇率，并换算金额；无需配置 API Key。</p>
        </div>
      </div>

      <form className={styles.panel} onSubmit={submit}>
        <label>
          <span>金额</span>
          <input type="number" min="0.000001" max="1000000000000" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label>
          <span>基础货币</span>
          <select value={base} onChange={(event) => setBase(event.target.value)}>
            {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.name}</option>)}
          </select>
        </label>
        <button className={styles.swap} type="button" onClick={swap} aria-label="交换基础货币和目标货币">⇄</button>
        <label>
          <span>目标货币</span>
          <select value={quote} onChange={(event) => setQuote(event.target.value)}>
            {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.name}</option>)}
          </select>
        </label>
        <label>
          <span>汇率日期（可选）</span>
          <input type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? '查询中…' : '换算'}</button>
      </form>

      {result && (
        <section className={styles.result}>
          <p>{formatNumber(result.amount, result.base)}</p>
          <span>按 {result.date || '最新工作日'} 汇率换算为</span>
          <strong>{formatNumber(result.convertedAmount, result.quote)}</strong>
          <dl>
            <div><dt>参考汇率</dt><dd>1 {result.base} = {formatNumber(result.rate)} {result.quote}</dd></div>
            <div><dt>反向汇率</dt><dd>1 {result.quote} = {formatNumber(1 / result.rate)} {result.base}</dd></div>
            <div><dt>数据日期</dt><dd>{result.date || '—'}</dd></div>
            <div><dt>响应耗时</dt><dd>{result.durationMs} ms</dd></div>
          </dl>
        </section>
      )}

      <aside className={styles.sourceNote}>
        <h2>数据说明</h2>
        <p>Frankfurter 聚合各国央行发布的每日参考汇率。周末及节假日通常返回最近一个可用工作日的数据，不适合作为交易报价。</p>
        <p><a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter v2 官方文档</a></p>
      </aside>
    </div>
  );
}
