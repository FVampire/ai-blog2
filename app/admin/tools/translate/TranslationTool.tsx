'use client';

import { FormEvent, useEffect, useState } from 'react';

import Link from 'next/link';

import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';
import type { TranslationProvider, TranslationResult } from '@/lib/translation';

import styles from './translation.module.css';

type Configuration = Record<TranslationProvider, boolean>;

interface TranslationResponse {
  results: TranslationResult[];
  configuration: Configuration;
}

const providerMeta: Record<TranslationProvider, { name: string; detail: string }> = {
  tencent: { name: '腾讯混元翻译', detail: 'hunyuan-translation-lite' },
  aliyun: { name: '阿里云机器翻译', detail: 'TranslateGeneral' },
  baidu: { name: '百度通用翻译', detail: 'VIP Translate' },
};

const languages = [
  ['auto', '自动检测'], ['zh', '简体中文'], ['en', '英语'], ['ja', '日语'], ['ko', '韩语'],
  ['fr', '法语'], ['de', '德语'], ['es', '西班牙语'], ['ru', '俄语'], ['pt', '葡萄牙语'],
  ['it', '意大利语'], ['th', '泰语'], ['vi', '越南语'], ['ar', '阿拉伯语'],
] as const;

const allProviders = Object.keys(providerMeta) as TranslationProvider[];

function ResultCard({ result }: { result: TranslationResult }) {
  const meta = providerMeta[result.provider];
  const copy = async () => {
    if (!result.translatedText) return;
    await navigator.clipboard.writeText(result.translatedText);
    toast.success('译文已复制');
  };

  return (
    <article className={styles.resultCard}>
      <header className={styles.resultHeader}>
        <div><h2>{meta.name}</h2><p>{meta.detail} · {result.durationMs} ms</p></div>
        <span className={result.success ? styles.success : styles.error}>
          {result.success ? '成功' : result.configured ? '失败' : '未配置'}
        </span>
      </header>
      {result.success ? (
        <>
          <div className={styles.translation}>{result.translatedText}</div>
          <footer className={styles.resultFooter}>
            <span>{result.detectedSource ? `源语言：${result.detectedSource}` : '源语言：自动识别'}</span>
            {result.usage?.totalTokens !== undefined && <span>Token：{result.usage.totalTokens}</span>}
            <button type="button" onClick={copy}>复制译文</button>
          </footer>
        </>
      ) : <p className={styles.errorMessage}>{result.error || '翻译服务没有返回结果'}</p>}
    </article>
  );
}

export default function TranslationTool() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('auto');
  const [target, setTarget] = useState('zh');
  const [providers, setProviders] = useState<TranslationProvider[]>(allProviders);
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authJson<{ configuration: Configuration }>('/api/admin/translate').then((response) => {
      if (cancelled || !response.success || !response.data) return;
      setConfiguration(response.data.configuration);
      const configured = allProviders.filter((provider) => response.data?.configuration[provider]);
      if (configured.length > 0) setProviders(configured);
    });
    return () => { cancelled = true; };
  }, []);

  const toggleProvider = (provider: TranslationProvider) => {
    setProviders((current) => current.includes(provider)
      ? current.filter((item) => item !== provider)
      : [...current, provider]);
  };

  const swapLanguages = () => {
    if (source === 'auto') {
      setSource(target);
      setTarget(target === 'zh' ? 'en' : 'zh');
      return;
    }
    setSource(target);
    setTarget(source);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return toast.error('请输入要翻译的文本');
    if (providers.length === 0) return toast.error('请至少选择一个翻译服务');
    if (source !== 'auto' && source === target) return toast.error('源语言和目标语言不能相同');

    setLoading(true);
    setResults([]);
    const response = await authJson<TranslationResponse>('/api/admin/translate', {
      method: 'POST',
      body: JSON.stringify({ text, source, target, providers }),
    });
    setLoading(false);
    if (response.data) {
      setResults(response.data.results || []);
      setConfiguration(response.data.configuration);
    }
    if (!response.success) toast.error(response.message || '翻译失败');
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><Link href="/admin/tools">管理员工具</Link> / 文本处理</p>
          <h1 className="page-title">多源文本翻译</h1>
          <p className="page-description">选择一家翻译服务，或并行调用多家比较译文。</p>
        </div>
      </div>

      <form className={styles.panel} onSubmit={submit}>
        <div className={styles.languageBar}>
          <label><span>源语言</span><select value={source} onChange={(event) => setSource(event.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <button type="button" className={styles.swap} onClick={swapLanguages} aria-label="交换源语言和目标语言">⇄</button>
          <label><span>目标语言</span><select value={target} onChange={(event) => setTarget(event.target.value)}>{languages.filter(([code]) => code !== 'auto').map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        </div>

        <label className={styles.textField}>
          <span>原文</span>
          <textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 2000))} placeholder="输入需要翻译的文本…" rows={9} />
          <small>{text.length} / 2000</small>
        </label>

        <fieldset className={styles.providers}>
          <legend>翻译服务</legend>
          {allProviders.map((provider) => (
            <label key={provider} className={providers.includes(provider) ? styles.selectedProvider : ''}>
              <input type="checkbox" checked={providers.includes(provider)} onChange={() => toggleProvider(provider)} />
              <span><strong>{providerMeta[provider].name}</strong><small>{providerMeta[provider].detail}</small></span>
              <i className={configuration?.[provider] ? styles.configured : styles.unconfigured}>{configuration?.[provider] ? '已配置' : '未配置'}</i>
            </label>
          ))}
        </fieldset>

        <div className={styles.actions}>
          <p>多源对比会分别产生各服务商的调用量和费用，原文不会在本站持久化。</p>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? '翻译中…' : providers.length > 1 ? `并行调用 ${providers.length} 家` : '开始翻译'}</button>
        </div>
      </form>

      {results.length > 0 && <div className={styles.results}>{results.map((result) => <ResultCard key={result.provider} result={result} />)}</div>}

      <aside className={styles.sourceNote}>
        <strong>接口说明</strong>
        <span>腾讯使用混元 ChatTranslations；阿里云使用 TranslateGeneral；百度使用通用文本翻译。三家凭据均只保存在服务端环境变量。</span>
        <p><a href="https://cloud.tencent.com/document/product/1729/113395" target="_blank" rel="noreferrer">腾讯文档</a> · <a href="https://help.aliyun.com/zh/machine-translation/developer-reference/api-reference-machine-translation-universal-version-call-guide" target="_blank" rel="noreferrer">阿里云文档</a> · <a href="https://fanyi-api.baidu.com/product/113" target="_blank" rel="noreferrer">百度文档</a></p>
      </aside>
    </div>
  );
}
