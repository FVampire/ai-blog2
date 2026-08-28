'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { authJson, clearAdminCredentials } from './authFetch';
import ToastContainer from './Toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminUser {
  username: string;
  role: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token || !userStr) {
      clearAdminCredentials();
      router.push('/admin/login');
      return;
    }

    try {
      setUser(JSON.parse(userStr));
    } catch {
      clearAdminCredentials();
      router.push('/admin/login');
      return;
    }

    let cancelled = false;

    // 令牌可能已在服务端失效：拉一次当前用户，401 由 authFetch 统一处理（清凭据 + 回登录页）
    authJson<{ user: AdminUser }>('/api/auth/me').then((result) => {
      if (cancelled || !result.success || !result.data?.user) return;
      setUser(result.data.user);
      localStorage.setItem('adminUser', JSON.stringify(result.data.user));
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = () => {
    clearAdminCredentials();
    router.push('/admin/login');
  };

  const isActive = (path: string) => pathname === path;

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

        <nav className="sidebar-nav">
          <Link href="/admin" className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}>
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">仪表盘</span>
          </Link>

          <Link href="/admin/posts" className={`sidebar-link ${isActive('/admin/posts') ? 'active' : ''}`}>
            <span className="sidebar-icon">📝</span>
            <span className="sidebar-text">文章管理</span>
          </Link>

          <Link href="/admin/projects" className={`sidebar-link ${pathname?.startsWith('/admin/projects') ? 'active' : ''}`}>
            <span className="sidebar-icon">🚀</span>
            <span className="sidebar-text">项目管理</span>
          </Link>

          <Link href="/admin/users" className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}>
            <span className="sidebar-icon">👥</span>
            <span className="sidebar-text">用户管理</span>
          </Link>

          <Link href="/admin/media" className={`sidebar-link ${isActive('/admin/media') ? 'active' : ''}`}>
            <span className="sidebar-icon">🖼️</span>
            <span className="sidebar-text">图片管理</span>
          </Link>

          <Link href="/admin/tags" className={`sidebar-link ${isActive('/admin/tags') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏷️</span>
            <span className="sidebar-text">标签管理</span>
          </Link>

          <Link href="/admin/comments" className={`sidebar-link ${isActive('/admin/comments') ? 'active' : ''}`}>
            <span className="sidebar-icon">💬</span>
            <span className="sidebar-text">评论管理</span>
          </Link>

          <Link href="/admin/settings" className={`sidebar-link ${isActive('/admin/settings') ? 'active' : ''}`}>
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-text">系统设置</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span>
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
          >
            ☰
          </button>

          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
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
