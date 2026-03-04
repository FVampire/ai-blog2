import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import apiClient from '../../lib/api-client';

const AdminLogin: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.login(username, password);

      if (response.success && response.data) {
        // 保存token和用户信息到localStorage
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));

        // 跳转到后台首页
        router.push('/admin');
      } else {
        setError(response.error || response.message || '登录失败');
        setLoading(false);
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <Head>
        <title>管理员登录 - Blog Admin</title>
        <meta name="description" content="Blog管理系统登录页面" />
      </Head>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">后台管理系统</h1>
            <p className="login-subtitle">请登录以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username" className="form-label">用户名</label>
              <input
                type="text"
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">密码</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="login-hint">
              <p>测试账号：admin / admin123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
