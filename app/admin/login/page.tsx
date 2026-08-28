'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import apiClient from '../../../lib/api-client';

export default function AdminLogin() {
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
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
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
          </form>
        </div>
      </div>
    </div>
  );
}
