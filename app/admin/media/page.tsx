'use client';

import React, { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import { useConfirmDialog } from '../../../components/admin/ConfirmDialog';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';
import ImageUpload from '../../../components/ImageUpload';

interface ImageItem {
  filename: string;
  path: string;
  folder: string;
  url: string;
  size: number;
  uploadedAt: string;
  modifiedAt: string;
}

interface FolderItem {
  name: string;
  path: string;
  itemCount: number;
  modifiedAt: string;
  protected: boolean;
}

interface Breadcrumb { name: string; path: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }
interface MediaListData {
  images: ImageItem[];
  folders: FolderItem[];
  breadcrumbs: Breadcrumb[];
  currentFolder: string;
  total: number;
  pagination: Pagination;
}

const PAGE_SIZE = 50;

export default function AdminMedia() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ name: '媒体库', path: '' }]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [folderDialog, setFolderDialog] = useState<{ mode: 'create' | 'rename'; folder?: FolderItem } | null>(null);
  const [folderName, setFolderName] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);
  const { confirm, confirmDialog } = useConfirmDialog();

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const result = await authJson<MediaListData>(
      `/api/media/list?folder=${encodeURIComponent(currentFolder)}&page=${page}&limit=${PAGE_SIZE}`,
    );
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || '加载媒体库失败');
      return;
    }

    setImages(result.data.images);
    setFolders(result.data.folders);
    setBreadcrumbs(result.data.breadcrumbs);
    setPagination(result.data.pagination);
  }, [currentFolder, page]);

  useEffect(() => { void loadMedia(); }, [loadMedia]);

  const navigateTo = (folder: string) => {
    setCurrentFolder(folder);
    setPage(1);
    setSelectedImage(null);
  };

  const openCreateDialog = () => {
    setFolderName('');
    setFolderDialog({ mode: 'create' });
  };

  const openRenameDialog = (folder: FolderItem) => {
    setFolderName(folder.name);
    setFolderDialog({ mode: 'rename', folder });
  };

  const saveFolder = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name || !folderDialog) return;

    setSavingFolder(true);
    const isCreate = folderDialog.mode === 'create';
    const result = await authJson('/api/media/folders', {
      method: isCreate ? 'POST' : 'PATCH',
      body: JSON.stringify(isCreate
        ? { parent: currentFolder, name }
        : { path: folderDialog.folder?.path, name }),
    });
    setSavingFolder(false);

    if (!result.success) {
      toast.error(result.message || `${isCreate ? '创建' : '重命名'}失败`);
      return;
    }

    toast.success(isCreate ? '文件夹已创建' : '文件夹已重命名');
    setFolderDialog(null);
    await loadMedia();
  };

  const deleteFolder = async (folder: FolderItem, recursive = false) => {
    const confirmed = await confirm({
      title: recursive ? '删除非空文件夹？' : '删除这个文件夹？',
      description: recursive ? `“${folder.name}”中的所有图片和子文件夹都会永久删除。` : `“${folder.name}”会从媒体库中移除。`,
      confirmLabel: recursive ? '删除全部内容' : '删除文件夹',
      dangerous: true,
    });
    if (!confirmed) return;

    const result = await authJson('/api/media/folders', {
      method: 'DELETE',
      body: JSON.stringify({ path: folder.path, recursive }),
    });

    if (result.success) {
      toast.success('文件夹已删除');
      await loadMedia();
      return;
    }

    if (result.code === 'FOLDER_NOT_EMPTY' && !recursive) {
      await deleteFolder(folder, true);
      return;
    }
    toast.error(result.message || '删除文件夹失败');
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setPage(1);
    void loadMedia();
  };

  const handleDeleteImage = async (image: ImageItem) => {
    if (!await confirm({ title: '删除这张图片？', description: `“${image.filename}”将从媒体库永久移除，引用它的页面可能出现缺图。`, confirmLabel: '删除图片', dangerous: true })) return;
    const result = await authJson('/api/media/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path: image.path }),
    });
    if (result.success) {
      toast.success('图片已删除');
      setSelectedImage(null);
      await loadMedia();
    } else {
      toast.error(result.message || '删除失败');
    }
  };

  const handleCopyUrl = async (url: string) => {
    const value = /^https?:\/\//i.test(url) ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(value);
    toast.success('链接已复制到剪贴板');
  };
  const formatSize = (bytes: number) => bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(2)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN');

  const isEmpty = folders.length === 0 && images.length === 0;
  const uploadFolder = currentFolder || 'uploads';

  return (
    <AdminLayout>
      <div className="media-page media-workspace">
        <div className="page-header media-page-header">
          <div>
            <h1 className="page-title">图片管理</h1>
            <p className="media-page-description">按文件夹整理站点图片，文章选择器会读取同一个媒体库。</p>
          </div>
          <div className="media-header-actions">
            <button type="button" className="btn-secondary" onClick={openCreateDialog}>＋ 新建文件夹</button>
            <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>↑ 上传图片</button>
          </div>
        </div>

        <div className="media-browser-toolbar">
          <nav className="media-breadcrumbs" aria-label="媒体文件夹路径">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path || 'root'}>
                {index > 0 && <span className="media-breadcrumb-separator">/</span>}
                <button
                  type="button"
                  className={index === breadcrumbs.length - 1 ? 'is-current' : ''}
                  onClick={() => navigateTo(crumb.path)}
                  disabled={index === breadcrumbs.length - 1}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
          <span className="media-browser-summary">{folders.length} 个文件夹 · {pagination.total} 张图片</span>
        </div>

        {loading ? (
          <div className="loading-state">正在读取媒体库...</div>
        ) : isEmpty ? (
          <div className="empty-state media-empty-state">
            <div className="media-empty-icon">▱</div>
            <p>{currentFolder ? '这个文件夹还是空的' : '媒体库中还没有文件夹'}</p>
            <span>{currentFolder ? '上传图片，或继续创建子文件夹。' : '先创建一个文件夹，再把图片上传到其中。'}</span>
            <button type="button" className="btn-primary" onClick={currentFolder ? () => setShowUploadModal(true) : openCreateDialog}>
              {currentFolder ? '上传第一张图片' : '创建第一个文件夹'}
            </button>
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <section className="media-library-section">
                <div className="media-section-heading"><h2>文件夹</h2><span>{folders.length}</span></div>
                <div className="media-folder-grid">
                  {folders.map((folder) => (
                    <div
                      key={folder.path}
                      className="media-folder-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigateTo(folder.path)}
                      onKeyDown={(event) => { if (event.key === 'Enter') navigateTo(folder.path); }}
                    >
                      <div className="media-folder-icon" aria-hidden="true"><span /></div>
                      <div className="media-folder-meta"><strong>{folder.name}</strong><span>{folder.itemCount} 个项目</span></div>
                      {!folder.protected && (
                        <div className="media-folder-actions">
                          <button type="button" title="重命名" onClick={(event) => { event.stopPropagation(); openRenameDialog(folder); }}>✎</button>
                          <button type="button" title="删除" className="is-danger" onClick={(event) => { event.stopPropagation(); void deleteFolder(folder); }}>×</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {images.length > 0 && (
              <section className="media-library-section">
                <div className="media-section-heading"><h2>图片</h2><span>{pagination.total}</span></div>
                <div className="media-grid">
                  {images.map((image) => (
                    <button key={image.path} type="button" className="media-item" onClick={() => setSelectedImage(image)}>
                      <div className="media-thumbnail"><img src={image.url} alt={image.filename} loading="lazy" /></div>
                      <div className="media-info"><div className="media-filename">{image.filename}</div><div className="media-size">{formatSize(image.size)}</div></div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {pagination.totalPages > 1 && (
              <div className="pagination-admin">
                <button className="pagination-btn-admin" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1}>上一页</button>
                <span className="pagination-info">第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 张</span>
                <button className="pagination-btn-admin" onClick={() => setPage(value => value + 1)} disabled={page >= pagination.totalPages}>下一页</button>
              </div>
            )}
          </>
        )}

        {folderDialog && (
          <div className="modal-overlay" onClick={() => setFolderDialog(null)}>
            <form className="modal-content media-folder-dialog" onSubmit={saveFolder} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header"><h2>{folderDialog.mode === 'create' ? '新建文件夹' : '重命名文件夹'}</h2><button type="button" className="modal-close" onClick={() => setFolderDialog(null)}>✕</button></div>
              <div className="modal-body">
                <label className="media-folder-field"><span>文件夹名称</span><input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} maxLength={100} placeholder="例如：文章封面" /></label>
                <p className="media-folder-hint">不能包含 \ / : * ? &quot; &lt; &gt; |，也不能以点开头。</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setFolderDialog(null)}>取消</button>
                <button type="submit" className="btn-primary" disabled={!folderName.trim() || savingFolder}>{savingFolder ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        )}

        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header"><div><h2>上传图片</h2><p className="media-modal-path">保存到 /{uploadFolder}</p></div><button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button></div>
              <div className="modal-body"><ImageUpload folder={uploadFolder} onUploadSuccess={handleUploadSuccess} onUploadError={(error) => console.error(error)} /></div>
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content modal-large" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header"><h2>图片详情</h2><button className="modal-close" onClick={() => setSelectedImage(null)}>✕</button></div>
              <div className="modal-body">
                <div className="image-detail">
                  <div className="image-detail-preview"><img src={selectedImage.url} alt={selectedImage.filename} /></div>
                  <div className="image-detail-info">
                    <div className="info-row"><span className="info-label">文件名：</span><span className="info-value">{selectedImage.filename}</span></div>
                    <div className="info-row"><span className="info-label">所在文件夹：</span><span className="info-value">/{selectedImage.folder}</span></div>
                    <div className="info-row"><span className="info-label">大小：</span><span className="info-value">{formatSize(selectedImage.size)}</span></div>
                    <div className="info-row"><span className="info-label">上传时间：</span><span className="info-value">{formatDate(selectedImage.uploadedAt)}</span></div>
                    <div className="info-row"><span className="info-label">URL：</span><span className="info-value break-all">{selectedImage.url}</span></div>
                    <div className="image-detail-actions">
                      <button className="btn-secondary" onClick={() => void handleCopyUrl(selectedImage.url)}>复制链接</button>
                      <button className="btn-danger" onClick={() => void handleDeleteImage(selectedImage)}>删除图片</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {confirmDialog}
      </div>
    </AdminLayout>
  );
}
