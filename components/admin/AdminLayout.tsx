'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import AdminIcon, { AdminIconName } from './AdminIcon';
import { authJson, clearAdminCredentials } from './authFetch';
import ToastContainer from './Toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminUser {
  username: string;
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: AdminIconName;
  roles?: string[];
  badge?: 'pendingComments';
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: '工作台',
    items: [{ href: '/admin', label: '待办首页', icon: 'dashboard' }],
  },
  {
    label: '内容',
    items: [
      { href: '/admin/posts', label: '文章', icon: 'posts' },
      { href: '/admin/categories', label: '专栏', icon: 'categories', roles: ['admin', 'editor'] },
      { href: '/admin/tags', label: '标签', icon: 'tags', roles: ['admin', 'editor'] },
      { href: '/admin/media', label: '媒体', icon: 'media' },
      { href: '/admin/comments', label: '评论', icon: 'comments', roles: ['admin', 'editor'], badge: 'pendingComments' },
    ],
  },
  {
    label: '站点',
    items: [
      { href: '/admin/projects', label: '项目', icon: 'projects', roles: ['admin', 'editor'] },
      { href: '/admin/settings', label: '站点设置', icon: 'settings', roles: ['admin'] },
    ],
  },
  {
    label: '系统',
    items: [
      { href: '/admin/agent', label: 'Agent 控制台', icon: 'agent', roles: ['admin'] },
      { href: '/admin/tools', label: '管理员工具', icon: 'tools', roles: ['admin'] },
      { href: '/admin/users', label: '用户', icon: 'users', roles: ['admin'] },
      { href: '/admin/integrations', label: 'AI / 向量 / MCP', icon: 'integrations', roles: ['admin'] },
    ],
  },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingComments, setPendingComments] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // One-time cleanup for sessions created before cookie-only authentication.
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    let cancelled = false;

    authJson<{ user: AdminUser }>('/api/auth/me').then(async (result) => {
      if (cancelled || !result.success || !result.data?.user) return;
      setUser(result.data.user);
      if (['admin', 'editor'].includes(result.data.user.role)) {
        const commentsResult = await authJson('/api/comments?status=pending&page=1&limit=1');
        const pagination = commentsResult.pagination as { total?: number } | undefined;
        if (!cancelled && commentsResult.success) setPendingComments(pagination?.total || 0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  const handleLogout = () => {
    clearAdminCredentials();
    router.push('/admin/login');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('site-theme', next);
    setTheme(next);
  };

  const isActive = (path: string) => path === '/admin' ? pathname === path : pathname?.startsWith(path);
  const canSee = (item: NavItem) => !item.roles || item.roles.includes(user?.role || '');
  const roleLabel = ({ admin: '管理员', editor: '编辑', author: '作者' } as Record<string, string>)[user?.role || ''] || user?.role;

  if (!user) {
    return (
      <>
        <div className="admin-loading">加载中...</div>
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Blog Admin</h2>
        </div>

        <nav className="sidebar-nav" aria-label="后台导航">
          {navGroups.map((group) => {
            const items = group.items.filter(canSee);
            if (items.length === 0) return null;
            return (
              <div className="sidebar-group" key={group.label}>
                <div className="sidebar-group-label">{group.label}</div>
                {items.map((item) => (
                  <Link key={item.href} href={item.href} className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
                    <span className="sidebar-icon"><AdminIcon name={item.icon} /></span>
                    <span className="sidebar-text">{item.label}</span>
                    {item.badge === 'pendingComments' && pendingComments > 0 && <span className="sidebar-badge" aria-label={`${pendingComments} 条待审评论`}>{pendingComments > 99 ? '99+' : pendingComments}</span>}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-link">
            <span className="sidebar-icon"><AdminIcon name="home" /></span>
            <span className="sidebar-text">返回前台</span>
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="admin-main">
        {/* 顶部栏 */}
        <header className="admin-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? '收起侧栏' : '展开侧栏'}
          >
            <AdminIcon name="menu" size={22} />
          </button>

          <div className="header-right">
            <button type="button" className="admin-theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}>
              {theme === 'dark' ? '浅色' : '深色'}
            </button>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{roleLabel}</span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AdminLayout;
