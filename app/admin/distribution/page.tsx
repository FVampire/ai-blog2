'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import AdminLayout from '@/components/admin/AdminLayout';
import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';

interface Job {
  id: number;
  postId: number;
  channel: string;
  status: string;
  payload: { title?: string; text?: string; tags?: string[]; url?: string; coverUrl?: string } | null;
  error: string | null;
  createdAt: string;
  postTitle?: string;
  postSlug?: string;
}

const STATUS_LABEL: Record<string, string> = {
  sent: '已发送',
  failed: '失败',
  skipped: '跳过',
  needs_manual: '待手动发布',
  pending: '等待中',
};

const CHANNEL_LABEL: Record<string, string> = {
  bilibili: 'B 站',
  xiaohongshu: '小红书',
  douyin: '抖音',
  wechat: '微信公众号',
  telegram: 'Telegram',
  discord: 'Discord',
  webhook: '通用 Webhook',
  indexnow: 'IndexNow',
};

const CREATOR_URL: Record<string, string> = {
  bilibili: 'https://member.bilibili.com/platform/home',
  xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
  douyin: 'https://creator.douyin.com/creator-micro/content/upload',
};

function publishingText(job: Job): string {
  if (!job.payload) return '';
  const tags = (job.payload.tags || []).map((tag) => `#${tag}`).join(' ');
  const body = job.payload.text || '';
  return [
    job.payload.title,
    body,
    tags && !body.includes(tags) ? tags : '',
    job.payload.url && !body.includes(job.payload.url) ? job.payload.url : '',
  ].filter(Boolean).join('\n\n');
}

export default function DistributionPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await authJson<{ jobs: Job[] }>('/api/admin/distribution');
    if (result.success && result.data) setJobs(result.data.jobs);
    else toast.error(result.message || '加载分发记录失败');
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const copyText = async (job: Job) => {
    const text = publishingText(job) || JSON.stringify(job.payload, null, 2);
    await navigator.clipboard.writeText(text);
    toast.success('已复制平台文案');
  };

  const downloadPackage = (job: Job) => {
    const payload = {
      platform: job.channel,
      postId: job.postId,
      postTitle: job.postTitle,
      ...job.payload,
      publishingText: publishingText(job),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${job.channel}-${job.postSlug || job.postId}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success('发布包已下载');
  };

  const markPublished = async (job: Job) => {
    const result = await authJson('/api/admin/distribution', {
      method: 'PATCH',
      body: JSON.stringify({ jobId: job.id }),
    });
    if (!result.success) {
      toast.error(result.message || '更新状态失败');
      return;
    }
    setJobs((current) => current.map((item) => (
      item.id === job.id ? { ...item, status: 'sent', error: null } : item
    )));
    toast.success('已标记为人工发布');
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">发布后的出站记录</p>
          <h1 className="page-title">分发记录</h1>
          <p className="page-description">
            Telegram / Discord / 公众号草稿会自动发出。B 站、小红书、抖音若未配置 Webhook，会在这里留下可复制文案。
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void load()} disabled={loading}>
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>
      {jobs.length === 0 ? (
        <div className="agent-empty">还没有分发记录。发布一篇文章后会出现在这里。</div>
      ) : (
        <div className="agent-panel">
          {jobs.map((job) => (
            <div className="agent-publish-row" key={job.id}>
              <div>
                <strong>{job.postTitle || `文章 #${job.postId}`}</strong>
                <span>{CHANNEL_LABEL[job.channel] || job.channel} · {STATUS_LABEL[job.status] || job.status}</span>
                {job.error && <p>{job.error}</p>}
              </div>
              <div className="agent-publish-links">
                {job.postSlug && <Link href={`/posts/${job.postSlug}`} target="_blank">文章</Link>}
                {(job.status === 'needs_manual' || job.payload?.text) && (
                  <button type="button" className="btn-small" onClick={() => void copyText(job)}>复制文案</button>
                )}
                {job.status === 'needs_manual' && CREATOR_URL[job.channel] && (
                  <button type="button" className="btn-small" onClick={() => downloadPackage(job)}>下载发布包</button>
                )}
                {job.status === 'needs_manual' && CREATOR_URL[job.channel] && (
                  <a href={CREATOR_URL[job.channel]} target="_blank" rel="noreferrer">打开创作中心</a>
                )}
                {job.status === 'needs_manual' && CREATOR_URL[job.channel] && (
                  <button type="button" className="btn-small" onClick={() => void markPublished(job)}>标记已发布</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
