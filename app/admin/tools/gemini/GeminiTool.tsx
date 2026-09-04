'use client';

import { FormEvent, useEffect, useState } from 'react';

import Link from 'next/link';

import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';
import type { GeminiResult } from '@/lib/gemini';

import styles from './gemini.module.css';

interface GeminiConfiguration {
  configured: boolean;
  model: string;
}

const EXAMPLE_PROMPTS = [
  '为一篇介绍 Server Actions 的技术文章生成 5 个标题。',
  '把下面内容改写得更简洁，并保留原意：',
  '审查这段文案中的事实断言和潜在歧义：',
];

export default function GeminiTool() {
  const [configuration, setConfiguration] = useState<GeminiConfiguration | null>(null);
  const [prompt, setPrompt] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('你是一名严谨、简洁的中文内容助手。');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(2048);
  const [result, setResult] = useState<GeminiResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authJson<GeminiConfiguration>('/api/admin/gemini').then((response) => {
      if (cancelled || !response.success || !response.data) return;
      setConfiguration(response.data);
      setModel(response.data.model);
    });
    return () => { cancelled = true; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return toast.error('请输入提示词');

    setLoading(true);
    setResult(null);
    const response = await authJson<GeminiResult>('/api/admin/gemini', {
      method: 'POST',
      body: JSON.stringify({ prompt, systemInstruction, model, temperature, maxOutputTokens }),
    });
    setLoading(false);
    if (!response.success || !response.data) {
      toast.error(response.message || 'Gemini 请求失败');
      return;
    }
    setResult(response.data);
  };

  const copyResult = async () => {
    if (!result?.text) return;
    await navigator.clipboard.writeText(result.text);
    toast.success('结果已复制');
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><Link href="/admin/tools">管理员工具</Link> / AI</p>
          <h1 className="page-title">Gemini API 调用台</h1>
          <p className="page-description">从服务端调用 Gemini，快速验证模型配置、提示词和生成效果。</p>
        </div>
        <span className={configuration?.configured ? styles.configured : styles.unconfigured}>
          {configuration === null ? '检查配置中' : configuration.configured ? 'API 已配置' : 'API 未配置'}
        </span>
      </div>

      <form className={styles.panel} onSubmit={submit}>
        <div className={styles.settingsRow}>
          <label className={styles.modelField}>
            <span>模型</span>
            <input value={model} onChange={(event) => setModel(event.target.value)} spellCheck={false} />
          </label>
          <label>
            <span>温度：{temperature.toFixed(1)}</span>
            <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
          </label>
          <label>
            <span>最大输出 Token</span>
            <input type="number" min="1" max="8192" value={maxOutputTokens} onChange={(event) => setMaxOutputTokens(Number(event.target.value))} />
          </label>
        </div>

        <label className={styles.textField}>
          <span>系统提示词</span>
          <textarea rows={3} maxLength={10000} value={systemInstruction} onChange={(event) => setSystemInstruction(event.target.value)} />
          <small>{systemInstruction.length} / 10000</small>
        </label>

        <label className={styles.textField}>
          <span>用户提示词</span>
          <textarea rows={10} maxLength={20000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="输入要发送给 Gemini 的内容…" />
          <small>{prompt.length} / 20000</small>
        </label>

        <div className={styles.samples}>
          示例：{EXAMPLE_PROMPTS.map((example) => <button type="button" key={example} onClick={() => setPrompt(example)}>{example}</button>)}
        </div>
        <div className={styles.actions}>
          <p>提示词不会持久化；API Key 只从服务端环境变量读取。</p>
          <button className="btn-primary" type="submit" disabled={loading || configuration?.configured === false}>
            {loading ? '生成中…' : '发送请求'}
          </button>
        </div>
      </form>

      {configuration?.configured === false && (
        <p className={styles.configHint}>请在服务端环境变量中设置 <code>GEMINI_API_KEY</code>，可用 <code>GEMINI_MODEL</code> 覆盖默认模型。</p>
      )}

      {result && (
        <section className={styles.result}>
          <header>
            <div><h2>生成结果</h2><p>{result.model} · {result.durationMs} ms · {result.finishReason || '完成'}</p></div>
            <button type="button" onClick={copyResult}>复制结果</button>
          </header>
          <div className={styles.output}>{result.text}</div>
          <footer>
            <span>输入 {result.usage.promptTokens ?? '—'} Token</span>
            <span>输出 {result.usage.completionTokens ?? '—'} Token</span>
            <span>合计 {result.usage.totalTokens ?? '—'} Token</span>
          </footer>
        </section>
      )}

      <aside className={styles.sourceNote}>
        <strong>接口说明</strong>
        <span>调用 Google Gemini generateContent API。管理员接口限制每分钟 20 次请求，单次提示词最多 20000 字符。</span>
        <a href="https://ai.google.dev/api/generate-content" target="_blank" rel="noreferrer">Gemini API 官方文档</a>
      </aside>
    </div>
  );
}
