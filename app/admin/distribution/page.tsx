"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import AdminLayout from "@/components/admin/AdminLayout";
import { authJson } from "@/components/admin/authFetch";
import { toast } from "@/components/admin/Toast";

import styles from "./distribution.module.css";

interface Job {
  id: number;
  postId: number;
  channel: string;
  status: string;
  payload: {
    title?: string;
    text?: string;
    tags?: string[];
    url?: string;
    coverUrl?: string;
  } | null;
  error: string | null;
  createdAt: string;
  postTitle?: string;
  postSlug?: string;
}

const STATUS_LABEL: Record<string, string> = {
  sent: "已发送",
  failed: "失败",
  skipped: "跳过",
  needs_manual: "待手动发布",
  pending: "等待中",
};

const CHANNEL_LABEL: Record<string, string> = {
  bilibili: "B 站",
  xiaohongshu: "小红书",
  douyin: "抖音",
  wechat: "微信公众号",
  telegram: "Telegram",
  discord: "Discord",
  webhook: "通用 Webhook",
  indexnow: "IndexNow",
};

const CREATOR_URL: Record<string, string> = {
  bilibili: "https://member.bilibili.com/platform/home",
  xiaohongshu: "https://creator.xiaohongshu.com/publish/publish",
  douyin: "https://creator.douyin.com/creator-micro/content/upload",
};

function publishingText(job: Job): string {
  if (!job.payload) return "";
  const tags = (job.payload.tags || []).map((tag) => `#${tag}`).join(" ");
  const body = job.payload.text || "";
  return [
    job.payload.title,
    body,
    tags && !body.includes(tags) ? tags : "",
    job.payload.url && !body.includes(job.payload.url) ? job.payload.url : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function DistributionPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    const result = await authJson<{ jobs: Job[] }>("/api/admin/distribution");
    if (result.success && result.data) setJobs(result.data.jobs);
    else {
      setLoadError(true);
      toast.error(result.message || "加载分发记录失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const copyText = async (job: Job) => {
    const text = publishingText(job) || JSON.stringify(job.payload, null, 2);
    await navigator.clipboard.writeText(text);
    toast.success("已复制平台文案");
  };

  const downloadPackage = (job: Job) => {
    const payload = {
      platform: job.channel,
      postId: job.postId,
      postTitle: job.postTitle,
      ...job.payload,
      publishingText: publishingText(job),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${job.channel}-${job.postSlug || job.postId}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success("发布包已下载");
  };

  const markPublished = async (job: Job) => {
    const result = await authJson("/api/admin/distribution", {
      method: "PATCH",
      body: JSON.stringify({ jobId: job.id }),
    });
    if (!result.success) {
      toast.error(result.message || "更新状态失败");
      return;
    }
    setJobs((current) =>
      current.map((item) =>
        item.id === job.id ? { ...item, status: "sent", error: null } : item,
      ),
    );
    toast.success("已标记为人工发布");
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className="page-header">
          <div>
            <p className="page-eyebrow">发布后的出站记录</p>
            <h1 className="page-title">分发记录</h1>
            <p className="page-description">
              Telegram / Discord / 公众号草稿会自动发出。B
              站、小红书、抖音若未配置 Webhook，会在这里留下可复制文案。
            </p>
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "刷新中..." : "刷新"}
          </button>
        </div>
        <section
          className={styles.panel}
          aria-label="分发记录列表"
          aria-busy={loading}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>
                发布记录 <span className={styles.count}>{jobs.length}</span>
              </h2>
              <p>查看各平台的发送结果，处理待手动发布的内容。</p>
            </div>
            <Link href="/admin/settings" className={styles.settingsLink}>
              站点设置 →
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className={styles.empty} role="status">
              <strong>
                {loading
                  ? "正在加载分发记录…"
                  : loadError
                    ? "暂时无法加载记录"
                    : "还没有分发记录"}
              </strong>
              <p>
                {loading
                  ? "正在获取各平台的发送状态，请稍候。"
                  : loadError
                    ? "请点击右上角刷新重试。"
                    : "发布一篇文章后，各平台的发送结果会显示在这里。"}
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {jobs.map((job) => (
                <article className={styles.row} key={job.id}>
                  <div className={styles.details}>
                    <div className={styles.meta}>
                      <span className={styles.channel}>
                        {CHANNEL_LABEL[job.channel] || job.channel}
                      </span>
                      <span className={styles.status} data-status={job.status}>
                        {STATUS_LABEL[job.status] || job.status}
                      </span>
                    </div>
                    <h3>{job.postTitle || `文章 #${job.postId}`}</h3>
                    <time className={styles.time} dateTime={job.createdAt}>
                      {new Date(job.createdAt).toLocaleString("zh-CN", {
                        hour12: false,
                      })}
                    </time>
                    {job.error && <p className={styles.error}>{job.error}</p>}
                  </div>
                  <div className={styles.actions}>
                    {job.postSlug && (
                      <Link
                        className={styles.button}
                        href={`/posts/${job.postSlug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        查看文章 ↗
                      </Link>
                    )}
                    {(job.status === "needs_manual" || job.payload?.text) && (
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => void copyText(job)}
                      >
                        复制文案
                      </button>
                    )}
                    {job.status === "needs_manual" &&
                      CREATOR_URL[job.channel] && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => downloadPackage(job)}
                        >
                          下载发布包
                        </button>
                      )}
                    {job.status === "needs_manual" &&
                      CREATOR_URL[job.channel] && (
                        <a
                          className={styles.button}
                          href={CREATOR_URL[job.channel]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          创作中心 ↗
                        </a>
                      )}
                    {job.status === "needs_manual" &&
                      CREATOR_URL[job.channel] && (
                        <button
                          type="button"
                          className={`${styles.button} ${styles.primary}`}
                          onClick={() => void markPublished(job)}
                        >
                          标记已发布
                        </button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
