import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/ImageUpload';

interface ImageItem {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  modifiedAt: string;
}

const AdminMedia: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 加载图片列表
  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media/list');
      const data = await response.json();

      if (data.success) {
        setImages(data.data.images);
      } else {
        alert('加载图片列表失败');
      }
    } catch (error) {
      console.error('Load images error:', error);
      alert('加载图片列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // 处理上传成功
  const handleUploadSuccess = (imageUrl: string) => {
    console.log('✅ 上传成功:', imageUrl);
    setShowUploadModal(false);
    loadImages(); // 重新加载图片列表
  };

  // 删除图片
  const handleDelete = async (filename: string) => {
    if (!confirm('确定要删除这张图片吗？')) {
      return;
    }

    try {
      const response = await fetch('/api/media/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();

      if (data.success) {
        alert('删除成功');
        setSelectedImage(null);
        loadImages();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  // 复制链接
  const handleCopyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    alert('链接已复制到剪贴板');
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <AdminLayout>
      <Head>
        <title>图片管理 - Blog Admin</title>
      </Head>

      <div className="media-page">
        <div className="page-header">
          <h1 className="page-title">图片管理</h1>
          <button
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            <span>📤</span> 上传图片
          </button>
        </div>

        {/* 统计信息 */}
        <div className="media-stats">
          <div className="stat-item">
            <span className="stat-label">总图片数</span>
            <span className="stat-value">{images.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">总大小</span>
            <span className="stat-value">
              {formatSize(images.reduce((sum, img) => sum + img.size, 0))}
            </span>
          </div>
        </div>

        {/* 图片网格 */}
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <p>还没有上传任何图片</p>
            <button
              className="btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              上传第一张图片
            </button>
          </div>
        ) : (
          <div className="media-grid">
            {images.map((image) => (
              <div
                key={image.filename}
                className="media-item"
                onClick={() => setSelectedImage(image)}
              >
                <div className="media-thumbnail">
                  <img src={image.url} alt={image.filename} />
                </div>
                <div className="media-info">
                  <div className="media-filename">{image.filename}</div>
                  <div className="media-size">{formatSize(image.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 上传模态框 */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>上传图片</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowUploadModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <ImageUpload
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => console.error(error)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 图片详情模态框 */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>图片详情</h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedImage(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="image-detail">
                  <div className="image-detail-preview">
                    <img src={selectedImage.url} alt={selectedImage.filename} />
                  </div>
                  <div className="image-detail-info">
                    <div className="info-row">
                      <span className="info-label">文件名：</span>
                      <span className="info-value">{selectedImage.filename}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">大小：</span>
                      <span className="info-value">{formatSize(selectedImage.size)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">上传时间：</span>
                      <span className="info-value">{formatDate(selectedImage.uploadedAt)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">URL：</span>
                      <span className="info-value" style={{ wordBreak: 'break-all' }}>
                        {selectedImage.url}
                      </span>
                    </div>
                    <div className="image-detail-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => handleCopyUrl(selectedImage.url)}
                      >
                        📋 复制链接
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(selectedImage.filename)}
                      >
                        🗑️ 删除图片
                      </button>
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
};

export default AdminMedia;
