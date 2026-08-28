'use client';

import React, { useCallback, useState, useEffect } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';
import ImageUpload from '../../../components/ImageUpload';

interface ImageItem { filename: string; url: string; size: number; uploadedAt: string; modifiedAt: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const PAGE_SIZE = 50;

export default function AdminMedia() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const result = await authJson<{ images: ImageItem[]; total: number; pagination: Pagination }>(
      `/api/media/list?page=${page}&limit=${PAGE_SIZE}`
    );
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || '加载图片列表失败');
      return;
    }

    setImages(result.data.images);
    setPagination(result.data.pagination);
  }, [page]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleUploadSuccess = () => { setShowUploadModal(false); setPage(1); loadImages(); };

  const handleDelete = async (filename: string) => {
    if (!confirm('确定要删除这张图片吗？')) return;
    const result = await authJson('/api/media/delete', { method: 'DELETE', body: JSON.stringify({ filename }) });
    if (result.success) {
      toast.success('删除成功');
      setSelectedImage(null);
      setImages(prev => prev.filter(image => image.filename !== filename));
      loadImages();
    } else toast.error(result.message || '删除失败');
  };

  const handleCopyUrl = (url: string) => { navigator.clipboard.writeText(window.location.origin + url); toast.success('链接已复制到剪贴板'); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(2) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN');

  return (
    <AdminLayout>
      <div className="media-page">
        <div className="page-header">
          <h1 className="page-title">图片管理</h1>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}><span>📤</span> 上传图片</button>
        </div>
        <div className="media-stats">
          <div className="stat-item"><span className="stat-label">总图片数</span><span className="stat-value">{pagination.total}</span></div>
          <div className="stat-item"><span className="stat-label">本页大小</span><span className="stat-value">{formatSize(images.reduce((sum, img) => sum + img.size, 0))}</span></div>
        </div>
        {loading ? (<div className="loading-state">加载中...</div>) : images.length === 0 ? (
          <div className="empty-state"><p>还没有上传任何图片</p><button className="btn-primary" onClick={() => setShowUploadModal(true)}>上传第一张图片</button></div>
        ) : (
          <>
            <div className="media-grid">
              {images.map((image) => (
                <div key={image.filename} className="media-item" onClick={() => setSelectedImage(image)}>
                  <div className="media-thumbnail"><img src={image.url} alt={image.filename} /></div>
                  <div className="media-info"><div className="media-filename">{image.filename}</div><div className="media-size">{formatSize(image.size)}</div></div>
                </div>
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="pagination-admin">
                <button className="pagination-btn-admin" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>上一页</button>
                <span className="pagination-info">第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 张</span>
                <button className="pagination-btn-admin" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>下一页</button>
              </div>
            )}
          </>
        )}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>上传图片</h2><button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button></div>
              <div className="modal-body"><ImageUpload onUploadSuccess={handleUploadSuccess} onUploadError={(error) => console.error(error)} /></div>
            </div>
          </div>
        )}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>图片详情</h2><button className="modal-close" onClick={() => setSelectedImage(null)}>✕</button></div>
              <div className="modal-body">
                <div className="image-detail">
                  <div className="image-detail-preview"><img src={selectedImage.url} alt={selectedImage.filename} /></div>
                  <div className="image-detail-info">
                    <div className="info-row"><span className="info-label">文件名：</span><span className="info-value">{selectedImage.filename}</span></div>
                    <div className="info-row"><span className="info-label">大小：</span><span className="info-value">{formatSize(selectedImage.size)}</span></div>
                    <div className="info-row"><span className="info-label">上传时间：</span><span className="info-value">{formatDate(selectedImage.uploadedAt)}</span></div>
                    <div className="info-row"><span className="info-label">URL：</span><span className="info-value" style={{ wordBreak: 'break-all' }}>{selectedImage.url}</span></div>
                    <div className="image-detail-actions">
                      <button className="btn-secondary" onClick={() => handleCopyUrl(selectedImage.url)}>📋 复制链接</button>
                      <button className="btn-danger" onClick={() => handleDelete(selectedImage.filename)}>🗑️ 删除图片</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
