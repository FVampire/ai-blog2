'use client';

/**
 * VectorManager 组件
 * 后台管理向量数据
 */

import React, { useState, useEffect } from 'react';

interface VectorStats {
  totalPosts: number;
  postsWithVectors: number;
  postsWithoutVectors: number;
}

interface GenerationResult {
  processed: number;
  success: number;
  failed: number;
  total: number;
  results: { postId: number; success: boolean; error?: string }[];
}

export const VectorManager: React.FC = () => {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [limit, setLimit] = useState(50);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/vector');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGenerate = async (dryRun: boolean = false) => {
    setGenerating(true);
    setMessage({ type: '', text: '' });
    setResult(null);

    try {
      const response = await fetch(
        `/api/admin/vector?limit=${limit}&dry_run=${dryRun}`,
        {
          method: 'POST',
        }
      );
      const data = await response.json();

      if (data.success) {
        if (dryRun) {
          setMessage({
            type: 'info',
            text: `模拟模式：将为 ${data.data.total} 篇文章生成向量`,
          });
        } else {
          setResult(data.data);
          setMessage({
            type: data.data.failed === 0 ? 'success' : 'warning',
            text: data.message,
          });
          fetchStats(); // 刷新统计
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('确定要删除所有向量数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/vector?confirm=true', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchStats();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '删除失败' });
    }
  };

  return (
    <div className="vector-manager">
      <div className="vector-section">
        <h3 className="section-title">向量统计</h3>
        {loading ? (
          <p className="loading-text">加载中...</p>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalPosts}</div>
              <div className="stat-label">已发布文章</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats.postsWithVectors}</div>
              <div className="stat-label">已生成向量</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{stats.postsWithoutVectors}</div>
              <div className="stat-label">待生成向量</div>
            </div>
            <div className="stat-card info">
              <div className="stat-value">
                {stats.totalPosts > 0
                  ? Math.round((stats.postsWithVectors / stats.totalPosts) * 100)
                  : 0}
                %
              </div>
              <div className="stat-label">覆盖率</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="vector-section">
        <h3 className="section-title">批量生成向量</h3>
        <p className="section-desc">
          为尚未生成向量的文章自动创建Embedding向量，用于向量搜索功能。
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>每次处理数量</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
              min={1}
              max={100}
              className="form-input"
            />
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => handleGenerate(true)}
            disabled={generating}
          >
            模拟生成
          </button>
          <button
            className="btn-primary"
            onClick={() => handleGenerate(false)}
            disabled={generating || (stats?.postsWithoutVectors || 0) === 0}
          >
            {generating ? '生成中...' : '开始生成'}
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {result && (
          <div className="result-panel">
            <h4>生成结果</h4>
            <div className="result-stats">
              <span>总计: {result.total}</span>
              <span className="success">成功: {result.success}</span>
              {result.failed > 0 && (
                <span className="error">失败: {result.failed}</span>
              )}
            </div>
            {result.results.some((r) => !r.success) && (
              <div className="error-list">
                <h5>失败详情：</h5>
                {result.results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <div key={r.postId} className="error-item">
                      文章ID {r.postId}: {r.error}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vector-section danger">
        <h3 className="section-title">危险操作</h3>
        <p className="section-desc">
          删除所有向量数据后，需要重新生成才能使用向量搜索功能。
        </p>
        <button className="btn-danger" onClick={handleDeleteAll}>
          删除所有向量
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vector-manager {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .vector-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }

        .vector-section.danger {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #111827;
        }

        .section-desc {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .loading-text {
          color: #6b7280;
          font-style: italic;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          border: 2px solid transparent;
        }

        .stat-card.success {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .stat-card.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .stat-card.info {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .form-row {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 10px 24px;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .btn-danger {
          padding: 10px 24px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .message {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
        }

        .message.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .message.info {
          background: #dbeafe;
          color: #1e40af;
        }

        .result-panel {
          margin-top: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .result-panel h4 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #111827;
        }

        .result-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }

        .result-stats span {
          font-size: 0.9rem;
          color: #374151;
        }

        .result-stats .success {
          color: #059669;
        }

        .result-stats .error {
          color: #dc2626;
        }

        .error-list {
          margin-top: 12px;
        }

        .error-list h5 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #991b1b;
        }

        .error-item {
          font-size: 0.85rem;
          color: #dc2626;
          padding: 4px 0;
        }
      `}} />
    </div>
  );
};

export default VectorManager;
