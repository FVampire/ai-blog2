'use client';

import { FormEvent, useState } from 'react';

import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';
import type { IpLocation, IpProviderResult } from '@/lib/ip-location';

import styles from './ip-lookup.module.css';

type LookupMode = 'auto' | 'all' | 'ipwhois' | 'amap';

interface LookupData {
  ip: string;
  mode: LookupMode;
  selected: IpLocation | null;
  results: IpProviderResult[];
  configuration: { ipwhois: boolean; amap: boolean };
}

const providerNames = { ipwhois: 'ipwho.is', amap: '高德 IP 定位' } as const;

function show(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function ResultCard({ result }: { result: IpProviderResult }) {
  const data = result.data;
  return (
    <article className={styles.resultCard}>
      <header className={styles.resultHeader}>
        <div>
          <h2>{providerNames[result.provider]}</h2>
          <p>{result.cached ? '命中 24 小时缓存' : `请求耗时 ${result.durationMs} ms`}</p>
        </div>
        <span className={result.success ? styles.statusSuccess : styles.statusError}>
          {result.success ? '查询成功' : result.configured ? '查询失败' : '未配置'}
        </span>
      </header>

      {!result.success || !data ? (
        <p className={styles.errorMessage}>{result.error || '该数据源没有返回结果'}</p>
      ) : (
        <dl className={styles.details}>
          <div><dt>城市</dt><dd>{show(data.city)}</dd></div>
          <div><dt>省 / 州</dt><dd>{show(data.region)}</dd></div>
          <div><dt>国家 / 地区</dt><dd>{show(data.country)} {data.countryCode ? `(${data.countryCode})` : ''}</dd></div>
          <div><dt>区县</dt><dd>{show(data.district)}</dd></div>
          <div><dt>经纬度</dt><dd>{data.latitude === null || data.longitude === null ? '—' : `${data.latitude}, ${data.longitude}`}</dd></div>
          <div><dt>时区</dt><dd>{show(data.timezone)}</dd></div>
          <div><dt>运营商</dt><dd>{show(data.isp)}</dd></div>
          <div><dt>组织 / ASN</dt><dd>{[data.organization, data.asn].filter(Boolean).join(' · ') || '—'}</dd></div>
          <div><dt>邮编</dt><dd>{show(data.postalCode)}</dd></div>
          <div><dt>行政区划码</dt><dd>{show(data.adcode)}</dd></div>
          <div className={styles.wide}><dt>城市矩形范围</dt><dd>{show(data.rectangle)}</dd></div>
        </dl>
      )}
    </article>
  );
}

export default function IpLookupTool() {
  const [ip, setIp] = useState('');
  const [mode, setMode] = useState<LookupMode>('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LookupData | null>(null);
  const visibleResults = data?.mode === 'auto' && data.selected
    ? data.results.filter((result) => result.provider === data.selected?.provider)
    : data?.results || [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = ip.trim();
    if (!value) {
      toast.error('请输入要查询的 IP 地址');
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ ip: value, provider: mode });
    const result = await authJson<LookupData>(`/api/admin/ip-location?${params}`);
    setLoading(false);
    if (!result.success || !result.data) {
      setData(null);
      toast.error(result.message || 'IP 查询失败');
      return;
    }
    setData(result.data);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">管理员工具</p>
          <h1 className="page-title">IP 城市查询</h1>
          <p className="page-description">查询并对照 ipwho.is 与高德结果；该工具及接口仅管理员可用。</p>
        </div>
      </div>

      <form className={styles.lookupPanel} onSubmit={submit}>
        <label className={styles.ipField}>
          <span>IPv4 / IPv6 地址</span>
          <input
            value={ip}
            onChange={(event) => setIp(event.target.value)}
            placeholder="例如 114.114.114.114 或 2001:4860:4860::8888"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className={styles.modeField}>
          <span>数据源</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as LookupMode)}>
            <option value="all">双源对比</option>
            <option value="auto">自动选择</option>
            <option value="ipwhois">仅 ipwho.is</option>
            <option value="amap">仅高德</option>
          </select>
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? '查询中…' : '查询'}
        </button>
        <div className={styles.samples}>
          快速填入：
          <button type="button" onClick={() => setIp('114.114.114.114')}>国内 IPv4</button>
          <button type="button" onClick={() => setIp('8.8.8.8')}>海外 IPv4</button>
          <button type="button" onClick={() => setIp('2001:4860:4860::8888')}>IPv6</button>
        </div>
      </form>

      {data && (
        <>
          <section className={styles.selection}>
            <span>本次映射结果</span>
            <strong>{data.selected ? [data.selected.country, data.selected.region, data.selected.city].filter(Boolean).join(' · ') : '没有可用结果'}</strong>
            <small>{data.selected ? `采用 ${providerNames[data.selected.provider]}` : '请检查数据源返回信息'}</small>
          </section>
          <div className={styles.results}>
            {visibleResults.map((result) => <ResultCard key={result.provider} result={result} />)}
          </div>
          {!data.configuration.amap && (
            <p className={styles.configHint}>高德尚未启用：请在服务端环境变量中配置 <code>AMAP_WEB_SERVICE_KEY</code>。</p>
          )}
        </>
      )}

      <aside className={styles.sourceNote}>
        <h2>映射策略与边界</h2>
        <p>评论城市映射会并发查询两个来源：高德返回有效国内城市时优先采用高德，否则使用 ipwho.is。成功结果在当前服务进程缓存 24 小时。</p>
        <p>ipwho.is 支持 IPv4 / IPv6；高德基础 IP 定位只支持国内 IPv4。查询结果是网络出口位置估算，不代表精确住址。</p>
        <p>
          官方文档：<a href="https://ipwhois.io/documentation" target="_blank" rel="noreferrer">ipwho.is</a>
          {' · '}
          <a href="https://lbs.amap.com/api/webservice/guide/api/ipconfig" target="_blank" rel="noreferrer">高德 IP 定位</a>
        </p>
      </aside>
    </div>
  );
}
