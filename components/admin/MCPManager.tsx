'use client';

import React, { useState, useEffect } from 'react';

import { MCPServer, MCPTransportType } from '../../lib/repositories/MCPRepository';

interface MCPManagerProps {
  settings: Record<string, any>;
  details: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const MCPManager: React.FC<MCPManagerProps> = ({ settings, details, onChange }) => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transport: 'stdio' as MCPTransportType,
    command: 'npx',
    script_path: '',
    args: '',
    env_vars: '{}',
    url: '',
    headers: '',
    is_enabled: true,
    is_default: false,
    timeout_seconds: 30,
  });

  // 获取MCP服务器列表
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mcp');

      const data = await response.json();

      if (data.success) {
        setServers(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || '获取MCP服务器列表失败' });
      }
    } catch (error) {
      console.error('Fetch MCP servers error:', error);
      setMessage({ type: 'error', text: '获取MCP服务器列表失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingServer
        ? `/api/admin/mcp/${editingServer.id}`
        : '/api/admin/mcp';

      const method = editingServer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          args: formData.args ? JSON.parse(formData.args) : [],
          env_vars: formData.env_vars ? JSON.parse(formData.env_vars) : {},
          headers: formData.headers ? JSON.parse(formData.headers) : {},
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingServer ? '更新成功' : '创建成功' });
        setShowForm(false);
        setEditingServer(null);
        setFormData({
          name: '',
          description: '',
          transport: 'stdio',
          command: 'npx',
          script_path: '',
          args: '',
          env_vars: '{}',
          url: '',
          headers: '',
          is_enabled: true,
          is_default: false,
          timeout_seconds: 30,
        });
        fetchServers();
      } else {
        setMessage({ type: 'error', text: data.message || (editingServer ? '更新失败' : '创建失败') });
      }
    } catch (error) {
      console.error('Save MCP server error:', error);
      setMessage({ type: 'error', text: editingServer ? '更新失败' : '创建失败' });
    }
  };

  const handleEdit = (server: MCPServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      description: server.description,
      transport: server.transport || 'stdio',
      command: server.command,
      script_path: server.script_path,
      args: Array.isArray(server.args) ? JSON.stringify(server.args) : server.args,
      env_vars: server.env_vars ? JSON.stringify(server.env_vars) : '{}',
      url: server.url || '',
      headers: server.headers ? JSON.stringify(server.headers) : '',
      is_enabled: server.is_enabled,
      is_default: server.is_default,
      timeout_seconds: server.timeout_seconds,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个MCP服务器吗？')) return;

    try {
      const response = await fetch(`/api/admin/mcp/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '删除成功' });
        fetchServers();
      } else {
        setMessage({ type: 'error', text: data.message || '删除失败' });
      }
    } catch (error) {
      console.error('Delete MCP server error:', error);
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/mcp/${id}/default`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '设置默认服务器成功' });
        fetchServers();
      } else {
        setMessage({ type: 'error', text: data.message || '设置失败' });
      }
    } catch (error) {
      console.error('Set default MCP server error:', error);
      setMessage({ type: 'error', text: '设置失败' });
    }
  };

  const handleAddNew = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      description: '',
      transport: 'stdio',
      command: 'npx',
      script_path: '',
      args: '',
      env_vars: '{}',
      url: '',
      headers: '',
      is_enabled: true,
      is_default: false,
      timeout_seconds: 30,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingServer(null);
    setFormData({
      name: '',
      description: '',
      transport: 'stdio',
      command: 'npx',
      script_path: '',
      args: '',
      env_vars: '{}',
      url: '',
      headers: '',
      is_enabled: true,
      is_default: false,
      timeout_seconds: 30,
    });
  };

  // 渲染设置开关
  const renderToggle = (key: string, detail: any) => {
    const value = settings[key];
    return (
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(key, e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    );
  };

  // 渲染输入框
  const renderInput = (key: string, detail: any) => {
    const value = settings[key];
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(key, e.target.value)}
        className="settings-input"
      />
    );
  };

  // 设置标签映射
  const settingLabels: Record<string, string> = {
    mcp_enabled: '启用MCP功能',
    mcp_allow_user_select: '允许用户选择MCP服务器',
    mcp_default_server_id: '默认MCP服务器ID',
  };

  return (
    <div className="mcp-manager">
      <h3>MCP 服务器管理</h3>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* MCP设置开关 */}
      <div className="mcp-settings">
        {['mcp_enabled', 'mcp_allow_user_select'].map(key => {
          const detail = details[key];
          if (!detail) return null;

          return (
            <div key={key} className="setting-item">
              <div className="setting-label">
                <span className="label-text">{settingLabels[key] || key}</span>
                <span className="label-desc">{detail.description}</span>
              </div>
              <div className="setting-control">
                {renderToggle(key, detail)}
              </div>
            </div>
          );
        })}
      </div>

      {/* MCP服务器列表 */}
      <div className="mcp-servers">
        <div className="mcp-header">
          <h4>MCP服务器列表</h4>
          <button className="btn-primary" onClick={handleAddNew}>
            添加服务器
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="servers-table">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>传输类型</th>
                  <th>命令/URL</th>
                  <th>状态</th>
                  <th>默认</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.id}>
                    <td>
                      <div className="server-name">{server.name}</div>
                      <div className="server-desc">{server.description}</div>
                    </td>
                    <td>
                      <span className={`transport-badge ${server.transport || 'stdio'}`}>
                        {(server.transport || 'stdio').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {server.transport === 'sse' || server.transport === 'http'
                        ? (server.url || '-')
                        : `${server.command} ${server.script_path}`
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${server.is_enabled ? 'enabled' : 'disabled'}`}>
                        {server.is_enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>
                      {server.is_default ? (
                        <span className="default-badge">默认</span>
                      ) : (
                        <button
                          className="set-default-btn"
                          onClick={() => handleSetDefault(server.id)}
                        >
                          设为默认
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(server)}
                        >
                          编辑
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(server.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="mcp-form-overlay">
          <div className="mcp-form">
            <div className="form-header">
              <h4>{editingServer ? '编辑MCP服务器' : '添加MCP服务器'}</h4>
              <button className="form-close" onClick={handleCancel}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange as any}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>传输类型 *</label>
                <select
                  name="transport"
                  value={formData.transport}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="stdio">STDIO (标准输入输出)</option>
                  <option value="sse">SSE (服务器推送事件)</option>
                  <option value="http">HTTP (HTTP 请求)</option>
                </select>
                <span className="field-hint">
                  {formData.transport === 'stdio' && '通过子进程标准输入输出通信，适用于本地 MCP 服务器'}
                  {formData.transport === 'sse' && '通过 SSE 流式通信，适用于远程 MCP 服务器'}
                  {formData.transport === 'http' && '通过 HTTP 请求通信，适用于 RESTful MCP 服务器'}
                </span>
              </div>

              {/* STDIO 特有配置 */}
              {formData.transport === 'stdio' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>命令</label>
                      <select
                        name="command"
                        value={formData.command}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="npx">npx</option>
                        <option value="node">node</option>
                        <option value="python">python</option>
                        <option value="uvx">uvx</option>
                        <option value="docker">docker</option>
                        <option value="custom">custom</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>超时时间(秒)</label>
                      <input
                        type="number"
                        name="timeout_seconds"
                        value={formData.timeout_seconds}
                        onChange={handleInputChange}
                        className="form-input"
                        min="1"
                        max="300"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>脚本路径 *</label>
                    <input
                      type="text"
                      name="script_path"
                      value={formData.script_path}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="例如: @modelcontextprotocol/server-filesystem"
                      required={formData.transport === 'stdio'}
                    />
                  </div>

                  <div className="form-group">
                    <label>参数 (JSON数组格式)</label>
                    <textarea
                      name="args"
                      value={formData.args}
                      onChange={handleInputChange as any}
                      className="form-textarea"
                      rows={2}
                      placeholder='["arg1", "arg2"]'
                    />
                  </div>

                  <div className="form-group">
                    <label>环境变量 (JSON对象格式)</label>
                    <textarea
                      name="env_vars"
                      value={formData.env_vars}
                      onChange={handleInputChange as any}
                      className="form-textarea"
                      rows={2}
                      placeholder='{"KEY": "value", "API_KEY": "xxx"}'
                    />
                  </div>
                </>
              )}

              {/* SSE/HTTP 特有配置 */}
              {(formData.transport === 'sse' || formData.transport === 'http') && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>服务器 URL *</label>
                      <input
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="例如: http://localhost:3000/mcp"
                        required={formData.transport !== 'stdio'}
                      />
                    </div>

                    <div className="form-group">
                      <label>超时时间(秒)</label>
                      <input
                        type="number"
                        name="timeout_seconds"
                        value={formData.timeout_seconds}
                        onChange={handleInputChange}
                        className="form-input"
                        min="1"
                        max="300"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>请求头 (JSON对象格式)</label>
                    <textarea
                      name="headers"
                      value={formData.headers}
                      onChange={handleInputChange as any}
                      className="form-textarea"
                      rows={2}
                      placeholder='{"Authorization": "Bearer xxx", "X-Custom": "value"}'
                    />
                  </div>

                  <div className="form-group">
                    <label>脚本路径 (可选，用于本地代理)</label>
                    <input
                      type="text"
                      name="script_path"
                      value={formData.script_path}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="例如: /path/to/proxy.js"
                    />
                  </div>
                </>
              )}

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={formData.is_enabled}
                    onChange={handleInputChange}
                  />
                  <span>启用服务器</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                  />
                  <span>设为默认</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  取消
                </button>
                <button type="submit" className="btn-submit">
                  {editingServer ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .mcp-manager {
          padding: 20px 0;
        }

        .mcp-settings {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-label {
          flex: 1;
        }

        .label-text {
          display: block;
          font-weight: 500;
          color: #495057;
          margin-bottom: 4px;
        }

        .label-desc {
          display: block;
          font-size: 12px;
          color: #6c757d;
        }

        .setting-control {
          width: 80px;
          text-align: right;
        }

        .mcp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .mcp-header h4 {
          margin: 0;
          color: #495057;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .servers-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .server-name {
          font-weight: 500;
          color: #495057;
        }

        .server-desc {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.enabled {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.disabled {
          background: #f8d7da;
          color: #721c24;
        }

        .transport-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .transport-badge.stdio {
          background: #e3f2fd;
          color: #1565c0;
        }

        .transport-badge.sse {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .transport-badge.http {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .default-badge {
          padding: 4px 8px;
          background: #007bff;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .set-default-btn {
          padding: 4px 8px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .set-default-btn:hover {
          background: #5a6268;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-edit, .btn-delete {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-edit {
          background: #17a2b8;
          color: white;
        }

        .btn-edit:hover {
          background: #138496;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
          background: #c82333;
        }

        .mcp-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .mcp-form {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .form-header h4 {
          margin: 0;
          color: #495057;
        }

        .form-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6c757d;
        }

        .form-close:hover {
          color: #495057;
        }

        form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-row .form-group {
          flex: 1;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #495057;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
        }

        .form-textarea {
          resize: vertical;
        }

        .field-hint {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }

        .form-checkboxes {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #495057;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .btn-cancel {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: #5a6268;
        }

        .btn-submit {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-submit:hover {
          background: #0056b3;
        }

        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }

          th, td {
            padding: 8px 10px;
            font-size: 13px;
          }

          .server-desc {
            display: none;
          }
        }
      `}} />
    </div>
  );
};

export default MCPManager;
