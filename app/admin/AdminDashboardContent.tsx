'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import AdminLayout from '../../components/admin/AdminLayout';
import AdminIcon from '../../components/admin/AdminIcon';
import { authJson } from '../../components/admin/authFetch';

interface DashboardCounts { drafts: number; pendingComments: number; missingCover: number; missingCategory: number; }
interface DashboardPost { id: number; title: string; slug: string; status: string; date: string; missingCover?: boolean; missingCategory?: boolean; }
interface AdminDashboardContentProps { counts: DashboardCounts; recentAgentPosts: DashboardPost[]; attentionPosts: DashboardPost[]; }

export default function AdminDashboardContent({ counts, recentAgentPosts, attentionPosts }: AdminDashboardContentProps) {
  const [role, setRole] = useState('author');
  useEffect(() => { void authJson<{ user: { role: string } }>('/api/auth/me').then((result) => { if (result.data?.user.role) setRole(result.data.user.role); }); }, []);
  const tasks = [
    { label: '草稿待完成', value: counts.drafts, href: '/admin/posts?status=draft', tone: 'blue', icon: 'posts' as const, hint: '继续写作或安排发布' },
    { label: '评论待审核', value: counts.pendingComments, href: '/admin/comments?status=pending', tone: 'orange', icon: 'comments' as const, hint: '优先处理新留言', roles: ['admin', 'editor'] },
    { label: '文章缺少封面', value: counts.missingCover, href: '/admin/posts?attention=cover', tone: 'purple', icon: 'media' as const, hint: '补齐列表与分享展示' },
    { label: '文章未设专栏', value: counts.missingCategory, href: '/admin/posts?attention=category', tone: 'green', icon: 'categories' as const, hint: '整理内容归属' },
  ].filter((task) => !task.roles || task.roles.includes(role));

  return (
    <AdminLayout>
      <div className="dashboard workbench-dashboard">
        <div className="page-header dashboard-heading">
          <div>
            <p className="page-eyebrow">今日工作台</p>
            <h1 className="page-title">先处理需要你决定的事</h1>
            <p className="page-description">草稿、审核与内容完整性集中在这里，统计不再占据主要视线。</p>
          </div>
          <Link href="/admin/posts/new" className="btn-primary"><span aria-hidden="true">＋</span>写文章</Link>
        </div>

        <div className="todo-grid" aria-label="内容待办">
          {tasks.map((task) => (
            <Link href={task.href} className={`todo-card todo-${task.tone}`} key={task.label}>
              <span className="todo-icon"><AdminIcon name={task.icon} size={21} /></span>
              <span className="todo-copy"><strong>{task.label}</strong><small>{task.hint}</small></span>
              <span className="todo-count">{task.value}</span>
            </Link>
          ))}
        </div>

        <div className="dashboard-columns">
          <section className="dashboard-section dashboard-list-section">
            <div className="section-heading-row">
              <div><p className="section-kicker">Agent</p><h2 className="section-title">最近发布</h2></div>
              <Link href="/admin/posts" className="text-link">全部文章 →</Link>
            </div>
            {recentAgentPosts.length === 0 ? (
              <div className="compact-empty"><strong>还没有 Agent 发布记录</strong><span>通过 Agent API 发布的新文章会出现在这里。</span></div>
            ) : (
              <div className="work-list">
                {recentAgentPosts.map((post) => (
                  <Link href={`/admin/posts/edit/${post.id}`} className="work-list-item" key={post.id}>
                    <span><strong>{post.title}</strong><small>{post.date}</small></span>
                    <span className={`status-badge ${post.status === 'published' ? 'published' : 'draft'}`}>{post.status === 'published' ? '已发布' : '草稿'}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section dashboard-list-section">
            <div className="section-heading-row"><div><p className="section-kicker">内容质量</p><h2 className="section-title">需要补全</h2></div></div>
            {attentionPosts.length === 0 ? (
              <div className="compact-empty"><strong>内容信息都很完整</strong><span>最近文章均已设置封面和专栏。</span></div>
            ) : (
              <div className="work-list">
                {attentionPosts.map((post) => (
                  <Link href={`/admin/posts/edit/${post.id}`} className="work-list-item" key={post.id}>
                    <span><strong>{post.title}</strong><small>{post.date}</small></span>
                    <span className="attention-tags">{post.missingCover && <em>缺封面</em>}{post.missingCategory && <em>缺专栏</em>}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
