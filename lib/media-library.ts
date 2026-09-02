import fs from 'fs';
import path from 'path';

export const MEDIA_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
export const MEDIA_ROOT_NAME = 'uploads';
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

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

function getPublicRoot(): string {
  return path.resolve(process.cwd(), 'public');
}

function getMediaRoot(): string {
  return path.resolve(getPublicRoot(), MEDIA_ROOT_NAME);
}

function ensureMediaRoot(): void {
  fs.mkdirSync(getMediaRoot(), { recursive: true });
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

function assertNoSymlinkSegments(targetPath: string): void {
  const publicRoot = getPublicRoot();
  const relative = path.relative(publicRoot, targetPath);
  if (!relative) return;

  let current = publicRoot;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new MediaLibraryError('媒体目录不能包含符号链接', 'SYMLINK_NOT_ALLOWED');
    }
  }
}

function assertInsidePublic(targetPath: string): void {
  const publicRoot = getPublicRoot();
  const relative = path.relative(publicRoot, targetPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new MediaLibraryError('媒体路径超出允许范围', 'PATH_OUTSIDE_MEDIA_ROOT');
  }
}

function assertManagedPath(relativePath: string): void {
  const root = relativePath.split('/')[0];
  if (root !== MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('该目录不属于媒体库', 'UNMANAGED_FOLDER', 404);
  }
}

export function resolveMediaFolder(folder: unknown, mustExist = true): { relativePath: string; absolutePath: string } {
  ensureMediaRoot();
  const relativePath = normalizeMediaPath(folder) || MEDIA_ROOT_NAME;
  assertManagedPath(relativePath);

  const absolutePath = path.resolve(getPublicRoot(), ...relativePath.split('/'));
  assertInsidePublic(absolutePath);
  assertNoSymlinkSegments(absolutePath);

  if (mustExist) {
    if (!fs.existsSync(absolutePath) || !fs.lstatSync(absolutePath).isDirectory()) {
      throw new MediaLibraryError('文件夹不存在', 'FOLDER_NOT_FOUND', 404);
    }
  }

  return { relativePath, absolutePath };
}

export function resolveMediaFile(file: unknown): { relativePath: string; absolutePath: string; url: string } {
  const relativePath = normalizeMediaPath(file);
  if (!relativePath || !relativePath.includes('/')) {
    throw new MediaLibraryError('文件路径不合法', 'INVALID_FILE_PATH');
  }
  assertManagedPath(relativePath);

  const absolutePath = path.resolve(getPublicRoot(), ...relativePath.split('/'));
  assertInsidePublic(absolutePath);
  assertNoSymlinkSegments(absolutePath);

  if (!fs.existsSync(absolutePath) || !fs.lstatSync(absolutePath).isFile()) {
    throw new MediaLibraryError('文件不存在', 'FILE_NOT_FOUND', 404);
  }

  return { relativePath, absolutePath, url: mediaPathToUrl(relativePath) };
}

export function mediaPathToUrl(relativePath: string): string {
  const normalized = normalizeMediaPath(relativePath);
  assertManagedPath(normalized);
  return `/${normalized.split('/').map(encodeURIComponent).join('/')}`;
}

function countVisibleItems(directory: string): number {
  return fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) return false;
    if (entry.isDirectory()) return true;
    return entry.isFile() && MEDIA_IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase());
  }).length;
}

function toFolderEntry(name: string, relativePath: string, absolutePath: string): MediaFolderEntry {
  const stats = fs.statSync(absolutePath);
  return {
    name,
    path: relativePath,
    itemCount: countVisibleItems(absolutePath),
    modifiedAt: stats.mtime,
    protected: relativePath === MEDIA_ROOT_NAME,
  };
}

export function listMediaFolder(folder: unknown): {
  currentFolder: string;
  breadcrumbs: MediaBreadcrumb[];
  folders: MediaFolderEntry[];
  images: MediaImageEntry[];
} {
  ensureMediaRoot();
  const requestedFolder = normalizeMediaPath(folder);
  const storageFolder = requestedFolder || MEDIA_ROOT_NAME;
  const { absolutePath } = resolveMediaFolder(storageFolder);
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const folders: MediaFolderEntry[] = [];
  const images: MediaImageEntry[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
    const entryPath = path.join(absolutePath, entry.name);
    const relativePath = `${storageFolder}/${entry.name}`;

    if (entry.isDirectory()) {
      folders.push(toFolderEntry(entry.name, relativePath, entryPath));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!entry.isFile() || !MEDIA_IMAGE_EXTENSIONS.includes(extension)) continue;
    const stats = fs.statSync(entryPath);
    images.push({
      filename: entry.name,
      path: relativePath,
      folder: storageFolder,
      url: mediaPathToUrl(relativePath),
      size: stats.size,
      uploadedAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension,
    });
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

export function createMediaFolder(parent: unknown, folderName: unknown): MediaFolderEntry {
  ensureMediaRoot();
  const name = validateMediaName(folderName);
  const parentPath = normalizeMediaPath(parent) || MEDIA_ROOT_NAME;
  const absoluteParent = resolveMediaFolder(parentPath).absolutePath;

  const relativePath = parentPath ? `${parentPath}/${name}` : name;
  const absolutePath = path.resolve(absoluteParent, name);
  assertInsidePublic(absolutePath);
  assertNoSymlinkSegments(absoluteParent);

  if (fs.existsSync(absolutePath)) {
    throw new MediaLibraryError('同名文件夹已存在', 'FOLDER_EXISTS', 409);
  }

  fs.mkdirSync(absolutePath);
  return toFolderEntry(name, relativePath, absolutePath);
}

export function renameMediaFolder(folder: unknown, newFolderName: unknown): {
  oldPath: string;
  newPath: string;
  folder: MediaFolderEntry;
} {
  const name = validateMediaName(newFolderName);
  const { relativePath: oldPath, absolutePath } = resolveMediaFolder(folder);
  const segments = oldPath.split('/');

  if (oldPath === MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('系统媒体文件夹不能重命名', 'PROTECTED_FOLDER', 409);
  }

  const parentPath = segments.slice(0, -1).join('/');
  const absoluteParent = path.dirname(absolutePath);
  const newPath = parentPath ? `${parentPath}/${name}` : name;
  const newAbsolutePath = path.resolve(absoluteParent, name);
  assertInsidePublic(newAbsolutePath);
  assertNoSymlinkSegments(absoluteParent);

  if (fs.existsSync(newAbsolutePath)) {
    throw new MediaLibraryError('同名文件夹已存在', 'FOLDER_EXISTS', 409);
  }

  fs.renameSync(absolutePath, newAbsolutePath);

  return { oldPath, newPath, folder: toFolderEntry(name, newPath, newAbsolutePath) };
}

export function deleteMediaFolder(folder: unknown, recursive = false): { deletedPath: string } {
  const { relativePath, absolutePath } = resolveMediaFolder(folder);

  if (relativePath === MEDIA_ROOT_NAME) {
    throw new MediaLibraryError('系统媒体文件夹不能删除', 'PROTECTED_FOLDER', 409);
  }

  const entries = fs.readdirSync(absolutePath);
  if (entries.length > 0 && !recursive) {
    throw new MediaLibraryError('文件夹不为空，需要确认递归删除', 'FOLDER_NOT_EMPTY', 409);
  }

  // absolutePath has already been resolved and verified to stay under public/.
  if (recursive) fs.rmSync(absolutePath, { recursive: true });
  else fs.rmdirSync(absolutePath);

  return { deletedPath: relativePath };
}
