'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';

import { authUpload } from './admin/authFetch';
import { toast } from './admin/Toast';

interface ImageUploadProps {
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  defaultImage?: string;
  disabled?: boolean;
  folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  defaultImage = '',
  disabled = false,
  folder = 'uploads',
}) => {
  const [preview, setPreview] = useState<string>(defaultImage);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { url: imageUrl } = await authUpload('/api/upload', file, setUploadProgress, { folder });

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

  return (
    <div className="image-upload-container">
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
    </div>
  );
};

export default ImageUpload;
