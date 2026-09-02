'use client';

import React, { useState, useEffect } from 'react';
import { useConfirmDialog } from './ConfirmDialog';

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
  const { confirm, confirmDialog } = useConfirmDialog();

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
    const server = servers.find((item) => item.id === id);
    if (!await confirm({ title: '删除 MCP 服务器？', description: `${server?.name || '这个连接'} 将从后台配置中移除。`, confirmLabel: '删除服务器', dangerous: true })) return;

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
      <div className="setting-item" style={{ marginBottom: 24 }}>
        <div className="setting-label">
          <span className="label-text">本站 MCP Server</span>
          <span className="label-desc">
            Cursor / Claude Desktop 可把博客自己当成 MCP：搜索文章、读正文、列项目/系列、发布草稿。地址 <code>/api/mcp</code>，鉴权与 Agent API 相同，使用 Bearer AGENT_API_KEY。
          </span>
        </div>
      </div>

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

      {confirmDialog}
    </div>
  );
};

export default MCPManager;
