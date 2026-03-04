import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';

interface SettingDetail {
  value: any;
  type: string;
  description: string;
}

type SettingsDetails = Record<string, SettingDetail>;

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [details, setDetails] = useState<SettingsDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data.settings);
        setDetails(data.data.details);
      } else {
        setMessage({ type: 'error', text: data.message || '获取设置失败' });
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      setMessage({ type: 'error', text: '获取设置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setMessage({ type: 'error', text: '登录已过期，请重新登录' });
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '设置已保存' });
      } else {
        setMessage({ type: 'error', text: data.message || '保存失败' });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage({ type: 'error', text: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key: string, detail: SettingDetail) => {
    const { type, description } = detail;
    const value = settings[key];

    if (type === 'boolean') {
      return (
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => handleChange(key, e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
          className="settings-input"
        />
      );
    }

    // AI 服务商下拉选择
    if (key === 'ai_provider') {
      return (
        <select
          value={value || 'openai'}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-select"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="deepseek">DeepSeek</option>
          <option value="moonshot">Moonshot (月之暗面)</option>
          <option value="qwen">通义千问</option>
          <option value="other">其他 (OpenAI 兼容)</option>
        </select>
      );
    }

    // API 密钥使用密码输入
    if (key === 'ai_api_key') {
      return (
        <input
          type="password"
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-input"
          placeholder="sk-..."
        />
      );
    }

    // 多行文本
    if (key === 'analytics_code' || key === 'footer_text' || key === 'ai_assistant_system_prompt' || key === 'ai_assistant_welcome') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className="settings-textarea"
          rows={key === 'ai_assistant_system_prompt' ? 4 : 3}
        />
      );
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleChange(key, e.target.value)}
        className="settings-input"
      />
    );
  };

  const tabs = [
    { id: 'basic', name: '基本设置', icon: '🌐' },
    { id: 'display', name: '显示设置', icon: '📱' },
    { id: 'comments', name: '评论设置', icon: '💬' },
    { id: 'users', name: '用户设置', icon: '👥' },
    { id: 'upload', name: '上传设置', icon: '📤' },
    { id: 'social', name: '社交媒体', icon: '🔗' },
    { id: 'ai', name: 'AI 设置', icon: '🤖' },
    { id: 'other', name: '其他设置', icon: '⚙️' },
  ];

  const settingGroups: Record<string, string[]> = {
    basic: ['site_name', 'site_description', 'site_keywords', 'site_logo', 'site_favicon'],
    display: ['posts_per_page', 'comments_per_page', 'excerpt_length'],
    comments: ['comments_enabled', 'comments_moderation', 'comments_guest_allowed'],
    users: ['registration_enabled', 'default_user_role'],
    upload: ['upload_max_size', 'upload_allowed_types'],
    social: ['social_github', 'social_twitter', 'social_weibo'],
    ai: [
      'ai_enabled', 'ai_provider', 'ai_api_key', 'ai_api_base_url', 'ai_model',
      'ai_assistant_enabled', 'ai_assistant_name', 'ai_assistant_welcome', 'ai_assistant_system_prompt',
    ],
    other: ['footer_text', 'analytics_code'],
  };

  const settingLabels: Record<string, string> = {
    site_name: '网站名称',
    site_description: '网站描述',
    site_keywords: '网站关键词',
    site_logo: '网站Logo URL',
    site_favicon: '网站Favicon URL',
    posts_per_page: '每页文章数',
    comments_per_page: '每页评论数',
    excerpt_length: '摘要字数',
    comments_enabled: '开启评论',
    comments_moderation: '评论需审核',
    comments_guest_allowed: '允许游客评论',
    registration_enabled: '开放注册',
    default_user_role: '默认用户角色',
    upload_max_size: '最大上传大小(MB)',
    upload_allowed_types: '允许的文件类型',
    social_github: 'GitHub',
    social_twitter: 'Twitter',
    social_weibo: '微博',
    footer_text: '页脚文字',
    analytics_code: '统计代码',
    // AI 设置
    ai_enabled: '启用AI功能',
    ai_provider: 'AI服务商',
    ai_api_key: 'API密钥',
    ai_api_base_url: 'API地址(可选)',
    ai_model: '模型名称',
    ai_assistant_enabled: '启用AI助手',
    ai_assistant_name: '助手名称',
    ai_assistant_welcome: '欢迎语',
    ai_assistant_system_prompt: '系统提示词',
  };

  if (loading) {
    return (
      <AdminLayout>
        <Head>
          <title>系统设置 - Blog Admin</title>
        </Head>
        <div className="settings-loading">
          <p>加载中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>系统设置 - Blog Admin</title>
      </Head>

      <div className="settings-page">
        <div className="page-header">
          <h1 className="page-title">系统设置</h1>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-container">
          {/* 标签导航 */}
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-name">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* 设置内容 */}
          <div className="settings-content">
            {settingGroups[activeTab]?.map(key => {
              const detail = details[key];
              if (!detail) return null;

              return (
                <div key={key} className="setting-item">
                  <div className="setting-label">
                    <span className="label-text">{settingLabels[key] || key}</span>
                    <span className="label-desc">{detail.description}</span>
                  </div>
                  <div className="setting-control">
                    {renderInput(key, detail)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          padding: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .btn-primary {
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .settings-container {
          display: flex;
          gap: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .settings-tabs {
          width: 200px;
          background: #f9fafb;
          padding: 16px 0;
          border-right: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          text-align: left;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .tab-btn.active {
          background: white;
          color: #3b82f6;
          border-right: 2px solid #3b82f6;
        }

        .tab-icon {
          margin-right: 10px;
          font-size: 16px;
        }

        .settings-content {
          flex: 1;
          padding: 24px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-label {
          flex: 1;
          padding-right: 24px;
        }

        .label-text {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .label-desc {
          display: block;
          font-size: 12px;
          color: #6b7280;
        }

        .setting-control {
          flex-shrink: 0;
          width: 300px;
        }

        .settings-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .settings-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .settings-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
        }

        .settings-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .settings-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .settings-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #3b82f6;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .settings-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .settings-container {
            flex-direction: column;
          }

          .settings-tabs {
            width: 100%;
            display: flex;
            overflow-x: auto;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .tab-btn {
            flex-shrink: 0;
            white-space: nowrap;
          }

          .tab-btn.active {
            border-right: none;
            border-bottom: 2px solid #3b82f6;
          }

          .setting-item {
            flex-direction: column;
          }

          .setting-label {
            padding-right: 0;
            margin-bottom: 12px;
          }

          .setting-control {
            width: 100%;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminSettings;
