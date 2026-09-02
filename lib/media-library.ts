import fs from 'fs';
import path from 'path';

export const MEDIA_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
export const DEFAULT_MEDIA_ROOTS = ['uploads', 'blog-covers'] as const;

const REGISTRY_FILENAME = '.media-library.json';
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

interface MediaRegistry {
  roots: string[];
}

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

function getRegistryPath(): string {
  return path.resolve(process.cwd(), REGISTRY_FILENAME);
}

function readRegistry(): MediaRegistry {
  try {
    const parsed = JSON.parse(fs.readFileSync(getRegistryPath(), 'utf8')) as Partial<MediaRegistry>;
    return {
      roots: Array.isArray(parsed.roots)
        ? parsed.roots.filter((root): root is string => typeof root === 'string' && isValidMediaName(root))
        : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to read media registry:', error);
    }
    return { roots: [] };
  }
}

function writeRegistry(registry: MediaRegistry): void {
  const registryPath = getRegistryPath();
  const tempPath = `${registryPath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, registryPath);
}

function getManagedRoots(): string[] {
  return Array.from(new Set([...DEFAULT_MEDIA_ROOTS, ...readRegistry().roots]));
}

function ensureDefaultRoots(): void {
  const publicRoot = getPublicRoot();
  fs.mkdirSync(publicRoot, { recursive: true });
  for (const root of DEFAULT_MEDIA_ROOTS) {
    fs.mkdirSync(path.join(publicRoot, root), { recursive: true });
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
  if (!root || !getManagedRoots().includes(root)) {
    throw new MediaLibraryError('该目录不属于媒体库', 'UNMANAGED_FOLDER', 404);
  }
}

export function resolveMediaFolder(folder: unknown, mustExist = true): { relativePath: string; absolutePath: string } {
  ensureDefaultRoots();
  const relativePath = normalizeMediaPath(folder);
  if (!relativePath) {
    throw new MediaLibraryError('请先选择一个媒体文件夹', 'FOLDER_REQUIRED');
  }
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
    protected: DEFAULT_MEDIA_ROOTS.includes(relativePath as typeof DEFAULT_MEDIA_ROOTS[number]),
  };
}

export function listMediaFolder(folder: unknown): {
  currentFolder: string;
  breadcrumbs: MediaBreadcrumb[];
  folders: MediaFolderEntry[];
  images: MediaImageEntry[];
} {
  ensureDefaultRoots();
  const currentFolder = normalizeMediaPath(folder);

  if (!currentFolder) {
    const folders = getManagedRoots()
      .map((root) => {
        const absolutePath = path.join(getPublicRoot(), root);
        if (!fs.existsSync(absolutePath) || !fs.lstatSync(absolutePath).isDirectory()) return null;
        return toFolderEntry(root, root, absolutePath);
      })
      .filter((entry): entry is MediaFolderEntry => entry !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

    return {
      currentFolder: '',
      breadcrumbs: [{ name: '媒体库', path: '' }],
      folders,
      images: [],
    };
  }

  const { absolutePath } = resolveMediaFolder(currentFolder);
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const folders: MediaFolderEntry[] = [];
  const images: MediaImageEntry[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
    const entryPath = path.join(absolutePath, entry.name);
    const relativePath = `${currentFolder}/${entry.name}`;

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
      folder: currentFolder,
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
  const segments = currentFolder.split('/');
  segments.forEach((segment, index) => {
    breadcrumbs.push({ name: segment, path: segments.slice(0, index + 1).join('/') });
  });

  return { currentFolder, breadcrumbs, folders, images };
}

function addManagedRoot(name: string): void {
  const registry = readRegistry();
  if (!registry.roots.includes(name)) {
    registry.roots.push(name);
    registry.roots.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    writeRegistry(registry);
  }
}

function replaceManagedRoot(oldName: string, newName: string): void {
  const registry = readRegistry();
  registry.roots = registry.roots.map((root) => root === oldName ? newName : root);
  registry.roots = Array.from(new Set(registry.roots)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  writeRegistry(registry);
}

function removeManagedRoot(name: string): void {
  const registry = readRegistry();
  registry.roots = registry.roots.filter((root) => root !== name);
  writeRegistry(registry);
}

export function createMediaFolder(parent: unknown, folderName: unknown): MediaFolderEntry {
  ensureDefaultRoots();
  const name = validateMediaName(folderName);
  const parentPath = normalizeMediaPath(parent);

  let absoluteParent = getPublicRoot();
  if (parentPath) {
    absoluteParent = resolveMediaFolder(parentPath).absolutePath;
  }

  const relativePath = parentPath ? `${parentPath}/${name}` : name;
  const absolutePath = path.resolve(absoluteParent, name);
  assertInsidePublic(absolutePath);
  assertNoSymlinkSegments(absoluteParent);

  if (fs.existsSync(absolutePath)) {
    throw new MediaLibraryError('同名文件夹已存在', 'FOLDER_EXISTS', 409);
  }

  fs.mkdirSync(absolutePath);
  if (!parentPath) addManagedRoot(name);
  return toFolderEntry(name, relativePath, absolutePath);
}

export function renameMediaFolder(folder: unknown, newFolderName: unknown): {
  oldPath: string;
  newPath: string;
  folder: MediaFolderEntry;
} {
  const oldPath = normalizeMediaPath(folder);
  const name = validateMediaName(newFolderName);
  const { absolutePath } = resolveMediaFolder(oldPath);
  const segments = oldPath.split('/');

  if (segments.length === 1 && DEFAULT_MEDIA_ROOTS.includes(oldPath as typeof DEFAULT_MEDIA_ROOTS[number])) {
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
  if (segments.length === 1) replaceManagedRoot(oldPath, name);

  return { oldPath, newPath, folder: toFolderEntry(name, newPath, newAbsolutePath) };
}

export function deleteMediaFolder(folder: unknown, recursive = false): { deletedPath: string } {
  const relativePath = normalizeMediaPath(folder);
  const { absolutePath } = resolveMediaFolder(relativePath);
  const segments = relativePath.split('/');

  if (segments.length === 1 && DEFAULT_MEDIA_ROOTS.includes(relativePath as typeof DEFAULT_MEDIA_ROOTS[number])) {
    throw new MediaLibraryError('系统媒体文件夹不能删除', 'PROTECTED_FOLDER', 409);
  }

  const entries = fs.readdirSync(absolutePath);
  if (entries.length > 0 && !recursive) {
    throw new MediaLibraryError('文件夹不为空，需要确认递归删除', 'FOLDER_NOT_EMPTY', 409);
  }

  // absolutePath has already been resolved and verified to stay under public/.
  if (recursive) fs.rmSync(absolutePath, { recursive: true });
  else fs.rmdirSync(absolutePath);

  if (segments.length === 1) removeManagedRoot(relativePath);
  return { deletedPath: relativePath };
}
