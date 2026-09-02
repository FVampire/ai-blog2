'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '@/components/admin/AdminLayout';
import { authJson } from '@/components/admin/authFetch';
import { toast } from '@/components/admin/Toast';

interface AgentPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  prevPostId: number | null;
  nextPostId: number | null;
  updatedAt: string;
}

interface AgentSeries {
  id: string;
  posts: AgentPost[];
  issue?: 'broken' | 'cycle';
}

interface AgentActivity {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  actorUsername: string | null;
  createdAt: string;
}

interface ConsoleData {
  stats: {
    published30d: number;
    uploads30d: number;
    projects30d: number;
    lastActivityAt: string | null;
  };
  posts: AgentPost[];
  series: AgentSeries[];
  unassigned: AgentPost[];
  activity: AgentActivity[];
}

const emptyData: ConsoleData = {
  stats: { published30d: 0, uploads30d: 0, projects30d: 0, lastActivityAt: null },
  posts: [],
  series: [],
  unassigned: [],
  activity: [],
};

const actionLabels: Record<string, string> = {
  'agent.post.publish': '发布文章',
  'agent.post.relate': '编排文章关系',
  'agent.media.upload': '上传媒体',
  'agent.project.create': '创建项目',
};

function formatDate(value: string | null) {
  if (!value) return '暂无记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function activityTitle(item: AgentActivity) {
  const value = item.metadata?.title || item.metadata?.name || item.metadata?.originalName;
  return typeof value === 'string' && value ? value : `${item.resourceType} #${item.resourceId || '—'}`;
}

export default function AgentConsolePage() {
  const [data, setData] = useState<ConsoleData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previousIds, setPreviousIds] = useState<number[]>([]);
  const [candidateId, setCandidateId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await authJson<ConsoleData>('/api/admin/agent');
    if (result.success && result.data) setData(result.data);
    else toast.error(result.message || '加载 Agent 控制台失败');
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const postById = useMemo(() => new Map(data.posts.map((post) => [post.id, post])), [data.posts]);
  const availablePosts = useMemo(() => {
    const allowed = new Set([...data.unassigned.map((post) => post.id), ...previousIds]);
    return data.posts.filter((post) => allowed.has(post.id) && !selectedIds.includes(post.id));
  }, [data.posts, data.unassigned, previousIds, selectedIds]);
  const publishRecords = data.activity.filter((item) => item.action === 'agent.post.publish');

  const startSeries = (series?: AgentSeries) => {
    const ids = series?.posts.map((post) => post.id) || [];
    setSelectedIds(ids);
    setPreviousIds(ids);
    setCandidateId('');
    setEditing(true);
  };

  const closeEditor = () => {
    setEditing(false);
    setSelectedIds([]);
    setPreviousIds([]);
    setCandidateId('');
  };

  const addPost = () => {
    const id = Number(candidateId);
    if (!id) return;
    setSelectedIds((current) => [...current, id]);
    setCandidateId('');
  };

  const movePost = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    setSelectedIds((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const saveSeries = async () => {
    if (selectedIds.length < 2) {
      toast.error('一个系列至少需要两篇文章');
      return;
    }
    setSaving(true);
    const result = await authJson('/api/admin/agent', {
      method: 'PUT',
      body: JSON.stringify({ postIds: selectedIds, previousPostIds: previousIds }),
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.message || '保存系列失败');
      return;
    }
    toast.success(result.message || '系列顺序已保存');
    closeEditor();
    await loadData();
  };

  return (
    <AdminLayout>
      <div className="agent-console">
        <div className="page-header agent-console-header">
          <div>
            <h1>Agent 控制台</h1>
            <p>查看自动发布记录，并维护文章的上一篇 / 下一篇关系。</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void loadData()} disabled={loading}>
            {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>

        <section className="agent-stat-grid" aria-label="最近 30 天 Agent 数据">
          <article className="agent-stat-card"><span>发布文章</span><strong>{data.stats.published30d}</strong><small>最近 30 天</small></article>
          <article className="agent-stat-card"><span>上传媒体</span><strong>{data.stats.uploads30d}</strong><small>最近 30 天</small></article>
          <article className="agent-stat-card"><span>创建项目</span><strong>{data.stats.projects30d}</strong><small>最近 30 天</small></article>
          <article className="agent-stat-card"><span>最近活动</span><strong className="agent-stat-time">{formatDate(data.stats.lastActivityAt)}</strong><small>Agent API</small></article>
        </section>

        <div className="agent-console-grid">
          <section className="agent-panel agent-series-panel">
            <div className="agent-panel-header">
              <div><h2>系列编排</h2><p>按阅读顺序组织文章，保存后自动写入双向导航。</p></div>
              <button type="button" className="btn-primary" onClick={() => startSeries()} disabled={data.unassigned.length < 2}>新建系列</button>
            </div>

            {loading ? <div className="agent-empty">正在加载系列...</div> : data.series.length === 0 ? (
              <div className="agent-empty">还没有文章系列。至少准备两篇未编排文章后即可创建。</div>
            ) : (
              <div className="agent-series-list">
                {data.series.map((series) => (
                  <article className="agent-series-card" key={series.id}>
                    <div className="agent-series-heading">
                      <div>
                        <h3>{series.posts[0]?.title || '未命名系列'}</h3>
                        <span>{series.posts.length} 篇文章</span>
                      </div>
                      <div className="agent-series-actions">
                        {series.issue && <span className="status-badge pending">关系需检查</span>}
                        <button type="button" className="btn-small" onClick={() => startSeries(series)}>调整顺序</button>
                      </div>
                    </div>
                    <ol className="agent-series-order">
                      {series.posts.map((post) => (
                        <li key={post.id}>
                          <Link href={`/admin/posts/edit/${post.id}`}>{post.title}</Link>
                          <span>{post.status === 'published' ? '已发布' : post.status}</span>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="agent-panel agent-activity-panel">
            <div className="agent-panel-header"><div><h2>Agent 活动</h2><p>最近 80 条 API 操作。</p></div></div>
            {data.activity.length === 0 ? <div className="agent-empty compact">暂无审计记录</div> : (
              <div className="agent-activity-list">
                {data.activity.map((item) => (
                  <div className="agent-activity-item" key={item.id}>
                    <span className="agent-activity-dot" />
                    <div><strong>{actionLabels[item.action] || item.action}</strong><p>{activityTitle(item)}</p><time>{formatDate(item.createdAt)}</time></div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <section className="agent-panel agent-publish-panel">
          <div className="agent-panel-header"><div><h2>发布记录</h2><p>由 Agent Publish API 创建的文章。</p></div></div>
          {publishRecords.length === 0 ? <div className="agent-empty compact">暂无 Agent 发布记录</div> : (
            <div className="agent-publish-list">
              {publishRecords.map((item) => {
                const slug = typeof item.metadata?.slug === 'string' ? item.metadata.slug : '';
                return (
                  <div className="agent-publish-row" key={item.id}>
                    <div><strong>{activityTitle(item)}</strong><span>{formatDate(item.createdAt)}</span></div>
                    <div className="agent-publish-links">
                      {item.resourceId && <Link href={`/admin/posts/edit/${item.resourceId}`}>编辑</Link>}
                      {slug && <Link href={`/posts/${slug}`} target="_blank">查看文章</Link>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {editing && (
          <div className="admin-dialog-backdrop" role="presentation">
            <div className="admin-dialog agent-series-dialog" role="dialog" aria-modal="true" aria-labelledby="series-dialog-title">
              <div className="agent-panel-header">
                <div><h2 id="series-dialog-title">{previousIds.length ? '调整系列顺序' : '新建系列'}</h2><p>列表从上到下就是公开页的阅读顺序。</p></div>
              </div>
              <ol className="agent-series-editor-list">
                {selectedIds.map((id, index) => {
                  const post = postById.get(id);
                  if (!post) return null;
                  return (
                    <li key={id}>
                      <span className="agent-order-number">{index + 1}</span>
                      <span className="agent-editor-title">{post.title}</span>
                      <button type="button" aria-label="上移" onClick={() => movePost(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" aria-label="下移" onClick={() => movePost(index, 1)} disabled={index === selectedIds.length - 1}>↓</button>
                      <button type="button" className="agent-remove-post" onClick={() => setSelectedIds((current) => current.filter((postId) => postId !== id))}>移除</button>
                    </li>
                  );
                })}
              </ol>
              <div className="agent-add-post">
                <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
                  <option value="">选择未编排文章</option>
                  {availablePosts.map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}
                </select>
                <button type="button" className="btn-secondary" onClick={addPost} disabled={!candidateId}>添加</button>
              </div>
              <p className="agent-series-note">从原系列移除的文章会解除上下篇关系，但不会删除文章。</p>
              <div className="admin-dialog-actions">
                <button type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>取消</button>
                <button type="button" className="btn-primary" onClick={() => void saveSeries()} disabled={saving || selectedIds.length < 2}>{saving ? '保存中...' : '保存顺序'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
