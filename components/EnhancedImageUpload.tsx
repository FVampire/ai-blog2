'use client';

import React, { useEffect, useState, useRef, ChangeEvent, DragEvent } from 'react';

import { authJson, authUpload } from './admin/authFetch';
import { toast } from './admin/Toast';

interface ImageItem {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  modifiedAt: string;
}

interface EnhancedImageUploadProps {
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  defaultImage?: string;
  disabled?: boolean;
  onSelectImage?: (imageUrl: string) => void;
}

const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  defaultImage = '',
  disabled = false,
  onSelectImage,
}) => {
  const [preview, setPreview] = useState<string>(defaultImage);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(defaultImage);
  }, [defaultImage]);

  // 加载已上传的图片列表
  const loadImages = async () => {
    setLoadingImages(true);
    const result = await authJson<{ images: ImageItem[] }>('/api/media/list?page=1&limit=100');
    setLoadingImages(false);

    if (result.success && result.data) {
      setImages(result.data.images);
    } else {
      toast.error(result.message || '加载图片列表失败');
    }
  };

  // 打开选择图片模态框时加载图片
  const handleOpenSelectModal = () => {
    setShowSelectModal(true);
    loadImages();
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      const errorMsg = '请选择图片文件';
      toast.error(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = '图片大小不能超过10MB';
      toast.error(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // 生成预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const { url: imageUrl } = await authUpload('/api/upload', file, setUploadProgress);

      setPreview(imageUrl);

      if (onUploadSuccess) {
        onUploadSuccess(imageUrl);
      }
    } catch (error) {
      console.error('上传失败:', error);
      const errorMsg = error instanceof Error ? error.message : '上传失败';
      toast.error(errorMsg);
      if (onUploadError) {
        onUploadError(errorMsg);
      }
      // 清除预览
      setPreview(defaultImage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    if (onUploadSuccess) {
      onUploadSuccess('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理选择已上传的图片
  const handleSelectImage = (imageUrl: string) => {
    setPreview(imageUrl);
    setShowSelectModal(false);
    if (onSelectImage) {
      onSelectImage(imageUrl);
    }
    if (onUploadSuccess) {
      onUploadSuccess(imageUrl);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="enhanced-image-upload-container">
      <div
        className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${
          uploading ? 'uploading' : ''
        } ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            {!disabled && !uploading && (
              <button
                className="remove-image-btn"
                onClick={handleRemove}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {uploading ? '上传中...' : '点击或拖拽图片到这里上传'}
            </div>
            <div className="upload-hint">支持 JPG、PNG、GIF 格式，最大 10MB</div>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(uploadProgress)}%</div>
          </div>
        )}
      </div>

      {/* 选择已上传图片的按钮 */}
      <div className="select-image-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleOpenSelectModal}
          disabled={disabled}
        >
          从已上传图片中选择
        </button>
      </div>

      {/* 选择图片模态框 */}
      {showSelectModal && (
        <div className="modal-overlay" onClick={() => setShowSelectModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>选择图片</h2>
              <button
                className="modal-close"
                onClick={() => setShowSelectModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {loadingImages ? (
                <div className="loading-state">加载中...</div>
              ) : images.length === 0 ? (
                <div className="empty-state">
                  <p>还没有上传任何图片</p>
                </div>
              ) : (
                <div className="media-grid">
                  {images.map((image) => (
                    <div
                      key={image.filename}
                      className="media-item media-item-selectable"
                      onClick={() => handleSelectImage(image.url)}
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
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSelectModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedImageUpload;
