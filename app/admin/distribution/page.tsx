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
  payload: { title?: string; text?: string; url?: string } | null;
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
    const text = job.payload?.text || JSON.stringify(job.payload, null, 2);
    await navigator.clipboard.writeText(text);
    toast.success('已复制平台文案');
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
                <span>{job.channel} · {STATUS_LABEL[job.status] || job.status}</span>
                {job.error && <p>{job.error}</p>}
              </div>
              <div className="agent-publish-links">
                {job.postSlug && <Link href={`/posts/${job.postSlug}`} target="_blank">文章</Link>}
                {(job.status === 'needs_manual' || job.payload?.text) && (
                  <button type="button" className="btn-small" onClick={() => void copyText(job)}>复制文案</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
