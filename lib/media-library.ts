import path from 'path';

import { exposeMediaUrl, storedMediaUrl } from './media-url.ts';
import { getMediaStore } from './storage/index.ts';
import type { StoredObjectMeta } from './storage/types.ts';

export const MEDIA_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
export const MEDIA_ROOT_NAME = 'uploads';
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

export interface MediaFolderEntry {
  name: string;
  path: string;
  itemCount: number;
  modifiedAt: Date;
  protected: boolean;
}

export interface MediaImageEntry {
  filename: string;
  path: string;
  folder: string;
  url: string;
  size: number;
  uploadedAt: Date;
  modifiedAt: Date;
  extension: string;
}

export interface MediaBreadcrumb {
  name: string;
  path: string;
}

export class MediaLibraryError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(
    message: string,
    code: string,
    status = 400,
  ) {
    super(message);
    this.name = 'MediaLibraryError';
    this.code = code;
    this.status = status;
  }
}

export function normalizeMediaPath(input: unknown): string {
  if (input === undefined || input === null || input === '') return '';
  if (typeof input !== 'string') {
    throw new MediaLibraryError('文件夹路径格式错误', 'INVALID_PATH');
  }

  const normalized = input.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized) return '';

  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new MediaLibraryError('文件夹路径不合法', 'INVALID_PATH');
  }

  return segments.join('/');
}

export function isValidMediaName(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  const name = input.trim();
  if (!name || name.length > 100 || name === '.' || name === '..' || name.startsWith('.')) return false;
  if (name.endsWith('.') || name.endsWith(' ') || WINDOWS_RESERVED_NAMES.test(name)) return false;
  if (/[<>:"/\\|?*]/.test(name)) return false;
  return !Array.from(name).some((character) => character.charCodeAt(0) <= 31);
}

export function validateMediaName(input: unknown): string {
  if (!isValidMediaName(input)) {
    throw new MediaLibraryError(
      '名称不能为空、不能以点开头，且不能包含 \\ / : * ? " < > | 等字符',
      'INVALID_NAME',
    );
  }
  return input.trim();
}

function assertManagedPath(relativePath: string): void {
  const root = relativePath.split('/')[0];
  if (root !== MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('该目录不属于媒体库', 'UNMANAGED_FOLDER', 404);
  }
}

function wrapStoreError(error: unknown): never {
  if (error instanceof MediaLibraryError) throw error;
  const message = error instanceof Error ? error.message : '对象存储请求失败';
  if (message.includes('未配置腾讯云 COS')) {
    throw new MediaLibraryError(message, 'COS_NOT_CONFIGURED', 503);
  }
  throw new MediaLibraryError(message, 'STORAGE_ERROR', 502);
}

function folderPrefix(relativePath: string): string {
  return relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
}

function folderName(relativePath: string): string {
  const segments = relativePath.split('/').filter(Boolean);
  return segments[segments.length - 1] || MEDIA_ROOT_NAME;
}

function extensionOf(filename: string): string {
  return path.posix.extname(filename).toLowerCase();
}

export function mediaPathToStoredUrl(relativePath: string): string {
  const normalized = normalizeMediaPath(relativePath);
  assertManagedPath(normalized);
  return storedMediaUrl(normalized);
}

export function mediaPathToUrl(relativePath: string): string {
  const normalized = normalizeMediaPath(relativePath);
  assertManagedPath(normalized);
  return exposeMediaUrl(storedMediaUrl(normalized));
}

export async function resolveMediaFolder(folder: unknown, mustExist = true): Promise<{ relativePath: string; prefix: string }> {
  const relativePath = normalizeMediaPath(folder) || MEDIA_ROOT_NAME;
  assertManagedPath(relativePath);
  const prefix = folderPrefix(relativePath);

  if (mustExist && !(await mediaFolderExists(relativePath))) {
    throw new MediaLibraryError('文件夹不存在', 'FOLDER_NOT_FOUND', 404);
  }

  return { relativePath, prefix };
}

export async function resolveMediaFile(file: unknown): Promise<{ relativePath: string; url: string; storedUrl: string; size: number; lastModified: Date }> {
  const relativePath = normalizeMediaPath(file);
  if (!relativePath || !relativePath.includes('/')) {
    throw new MediaLibraryError('文件路径不合法', 'INVALID_FILE_PATH');
  }
  assertManagedPath(relativePath);

  try {
    const meta = await getMediaStore().headObject(relativePath);
    if (!meta || relativePath.endsWith('/')) {
      throw new MediaLibraryError('文件不存在', 'FILE_NOT_FOUND', 404);
    }
    return {
      relativePath,
      url: mediaPathToUrl(relativePath),
      storedUrl: mediaPathToStoredUrl(relativePath),
      size: meta.size,
      lastModified: meta.lastModified,
    };
  } catch (error) {
    wrapStoreError(error);
  }
}

async function mediaFolderExists(relativePath: string): Promise<boolean> {
  if (relativePath === MEDIA_ROOT_NAME) return true;
  try {
    const store = getMediaStore();
    const prefix = folderPrefix(relativePath);
    if (await store.headObject(prefix)) return true;
    const listing = await store.list(prefix, '/');
    return listing.prefixes.length > 0 || listing.objects.length > 0;
  } catch (error) {
    wrapStoreError(error);
  }
}

function toImageEntry(relativePath: string, folder: string, meta: StoredObjectMeta): MediaImageEntry | null {
  const filename = relativePath.slice(relativePath.lastIndexOf('/') + 1);
  const extension = extensionOf(filename);
  if (!filename || filename.startsWith('.') || !MEDIA_IMAGE_EXTENSIONS.includes(extension)) return null;
  return {
    filename,
    path: relativePath,
    folder,
    url: mediaPathToUrl(relativePath),
    size: meta.size,
    uploadedAt: meta.lastModified,
    modifiedAt: meta.lastModified,
    extension,
  };
}

async function toFolderEntry(relativePath: string): Promise<MediaFolderEntry> {
  const prefix = folderPrefix(relativePath);
  let modifiedAt = new Date(0);
  try {
    const store = getMediaStore();
    const marker = await store.headObject(prefix);
    const listing = await store.list(prefix, '/');
    const itemCount = listing.prefixes.length + listing.objects.filter((item) => {
      const filename = item.key.slice(item.key.lastIndexOf('/') + 1);
      return Boolean(filename) && MEDIA_IMAGE_EXTENSIONS.includes(extensionOf(filename));
    }).length;
    modifiedAt = marker?.lastModified || new Date();
    for (const item of listing.objects) {
      if (item.lastModified > modifiedAt) modifiedAt = item.lastModified;
    }
    return {
      name: folderName(relativePath),
      path: relativePath,
      itemCount,
      modifiedAt,
      protected: relativePath === MEDIA_ROOT_NAME,
    };
  } catch (error) {
    wrapStoreError(error);
  }
}

export async function listMediaFolder(folder: unknown): Promise<{
  currentFolder: string;
  breadcrumbs: MediaBreadcrumb[];
  folders: MediaFolderEntry[];
  images: MediaImageEntry[];
}> {
  const requestedFolder = normalizeMediaPath(folder);
  const storageFolder = requestedFolder || MEDIA_ROOT_NAME;
  const { prefix } = await resolveMediaFolder(storageFolder);
  const folders: MediaFolderEntry[] = [];
  const images: MediaImageEntry[] = [];

  try {
    const listing = await getMediaStore().list(prefix, '/');
    for (const childPrefix of listing.prefixes) {
      const relativePath = childPrefix.replace(/\/+$/, '');
      folders.push(await toFolderEntry(relativePath));
    }
    for (const item of listing.objects) {
      if (item.key.endsWith('/')) continue;
      const image = toImageEntry(item.key, storageFolder, item);
      if (image) images.push(image);
    }
  } catch (error) {
    wrapStoreError(error);
  }

  folders.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  images.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const breadcrumbs: MediaBreadcrumb[] = [{ name: '媒体库', path: '' }];
  const segments = storageFolder.split('/').slice(1);
  segments.forEach((segment, index) => {
    breadcrumbs.push({
      name: segment,
      path: [MEDIA_ROOT_NAME, ...segments.slice(0, index + 1)].join('/'),
    });
  });

  return {
    currentFolder: storageFolder === MEDIA_ROOT_NAME ? '' : storageFolder,
    breadcrumbs,
    folders,
    images,
  };
}

export async function createMediaFolder(parent: unknown, folderNameInput: unknown): Promise<MediaFolderEntry> {
  const name = validateMediaName(folderNameInput);
  const parentPath = normalizeMediaPath(parent) || MEDIA_ROOT_NAME;
  await resolveMediaFolder(parentPath);
  const relativePath = `${parentPath}/${name}`;

  if (await mediaFolderExists(relativePath)) {
    throw new MediaLibraryError('同名文件夹已存在', 'FOLDER_EXISTS', 409);
  }

  try {
    await getMediaStore().putObject(folderPrefix(relativePath), Buffer.alloc(0), 'application/x-directory');
  } catch (error) {
    wrapStoreError(error);
  }
  return toFolderEntry(relativePath);
}

async function listAllKeys(prefix: string): Promise<string[]> {
  const listing = await getMediaStore().list(prefix);
  const keys = listing.objects.map((item) => item.key);
  if (await getMediaStore().headObject(prefix)) keys.unshift(prefix);
  return keys;
}

export async function renameMediaFolder(folder: unknown, newFolderName: unknown): Promise<{
  oldPath: string;
  newPath: string;
  folder: MediaFolderEntry;
}> {
  const name = validateMediaName(newFolderName);
  const { relativePath: oldPath, prefix: oldPrefix } = await resolveMediaFolder(folder);

  if (oldPath === MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('系统媒体文件夹不能重命名', 'PROTECTED_FOLDER', 409);
  }

  const parentPath = oldPath.split('/').slice(0, -1).join('/');
  const newPath = parentPath ? `${parentPath}/${name}` : name;
  if (await mediaFolderExists(newPath)) {
    throw new MediaLibraryError('同名文件夹已存在', 'FOLDER_EXISTS', 409);
  }

  try {
    const store = getMediaStore();
    const keys = await listAllKeys(oldPrefix);
    const copied: string[] = [];
    for (const key of keys) {
      const nextKey = `${folderPrefix(newPath)}${key.slice(oldPrefix.length)}`;
      await store.copyObject(key, nextKey || folderPrefix(newPath));
      copied.push(nextKey || folderPrefix(newPath));
    }
    if (copied.length === 0) {
      await store.putObject(folderPrefix(newPath), Buffer.alloc(0), 'application/x-directory');
    }
    await store.deleteObjects(keys);
  } catch (error) {
    wrapStoreError(error);
  }

  return { oldPath, newPath, folder: await toFolderEntry(newPath) };
}

export async function deleteMediaFolder(folder: unknown, recursive = false): Promise<{ deletedPath: string }> {
  const { relativePath, prefix } = await resolveMediaFolder(folder);

  if (relativePath === MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('系统媒体文件夹不能删除', 'PROTECTED_FOLDER', 409);
  }

  try {
    const keys = await listAllKeys(prefix);
    if (keys.some((key) => key !== prefix) && !recursive) {
      throw new MediaLibraryError('文件夹不为空，需要确认递归删除', 'FOLDER_NOT_EMPTY', 409);
    }
    await getMediaStore().deleteObjects(keys.length > 0 ? keys : [prefix]);
  } catch (error) {
    wrapStoreError(error);
  }

  return { deletedPath: relativePath };
}

export async function putMediaFile(
  folder: unknown,
  filename: string,
  body: Buffer,
  contentType: string,
): Promise<{ relativePath: string; url: string; storedUrl: string }> {
  const { relativePath: folderPath } = await resolveMediaFolder(folder);
  const safeName = filename.trim();
  if (!safeName || safeName.includes('/') || safeName.includes('\\') || safeName === '.' || safeName === '..') {
    throw new MediaLibraryError('文件名不合法', 'INVALID_NAME');
  }
  const relativePath = `${folderPath}/${safeName}`;
  const extension = extensionOf(safeName);
  try {
    await getMediaStore().putObject(
      relativePath,
      body,
      contentType || CONTENT_TYPES[extension] || 'application/octet-stream',
    );
  } catch (error) {
    wrapStoreError(error);
  }
  return {
    relativePath,
    url: mediaPathToUrl(relativePath),
    storedUrl: mediaPathToStoredUrl(relativePath),
  };
}

export async function deleteMediaFile(file: unknown): Promise<{ relativePath: string; url: string; storedUrl: string }> {
  const target = await resolveMediaFile(file);
  try {
    await getMediaStore().deleteObject(target.relativePath);
  } catch (error) {
    wrapStoreError(error);
  }
  return target;
}
