import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMediaFolder,
  deleteMediaFolder,
  isValidMediaName,
  listMediaFolder,
  mediaPathToUrl,
  normalizeMediaPath,
  putMediaFile,
  renameMediaFolder,
} from './media-library.ts';
import { resetMediaStoreForTests } from './storage/index.ts';

test('normalizeMediaPath normalizes separators without allowing traversal', () => {
  assert.equal(normalizeMediaPath('/uploads/封面/'), 'uploads/封面');
  assert.equal(normalizeMediaPath('uploads\\covers'), 'uploads/covers');
  assert.throws(() => normalizeMediaPath('../private'), /不合法/);
  assert.throws(() => normalizeMediaPath('uploads//covers'), /不合法/);
});

test('media folder names reject hidden, reserved, and unsafe names', () => {
  assert.equal(isValidMediaName('文章封面'), true);
  assert.equal(isValidMediaName('.hidden'), false);
  assert.equal(isValidMediaName('CON'), false);
  assert.equal(isValidMediaName('bad/name'), false);
  assert.equal(isValidMediaName('bad:name'), false);
});

test('mediaPathToUrl encodes each URL segment', () => {
  assert.equal(mediaPathToUrl('uploads/中文 封面/example.jpg'), '/uploads/%E4%B8%AD%E6%96%87%20%E5%B0%81%E9%9D%A2/example.jpg');
});

test('media folders support create, list, rename, and recursive delete', async () => {
  resetMediaStoreForTests();
  await createMediaFolder('', '文章图片');
  await createMediaFolder('uploads/文章图片', '2026');

  assert.deepEqual(
    new Set((await listMediaFolder('')).folders.map((folder) => folder.path)),
    new Set(['uploads/文章图片']),
  );
  assert.equal((await listMediaFolder('')).currentFolder, '');
  assert.equal((await listMediaFolder('uploads/文章图片')).folders[0]?.path, 'uploads/文章图片/2026');

  const renamed = await renameMediaFolder('uploads/文章图片/2026', '归档');
  assert.equal(renamed.newPath, 'uploads/文章图片/归档');
  await assert.rejects(() => deleteMediaFolder('uploads/文章图片'), /不为空/);
  await deleteMediaFolder('uploads/文章图片', true);
  assert.equal((await listMediaFolder('')).folders.some((folder) => folder.path === 'uploads/文章图片'), false);
});

test('media folders cannot escape the uploads root', async () => {
  resetMediaStoreForTests();
  await assert.rejects(() => createMediaFolder('blog-covers', 'legacy'), /不属于媒体库/);
  assert.throws(() => mediaPathToUrl('blog-covers/example.webp'), /不属于媒体库/);
  await assert.rejects(() => renameMediaFolder('uploads', 'images'), /不能重命名/);
  await assert.rejects(() => renameMediaFolder('', 'images'), /不能重命名/);
  await assert.rejects(() => deleteMediaFolder('uploads', true), /不能删除/);
  await assert.rejects(() => deleteMediaFolder('', true), /不能删除/);
});

test('uploaded images are listed from object storage', async () => {
  resetMediaStoreForTests();
  const stored = await putMediaFile('uploads', 'cover.webp', Buffer.from('webp'), 'image/webp');
  assert.equal(stored.relativePath, 'uploads/cover.webp');
  assert.equal(stored.url, '/uploads/cover.webp');
  const listing = await listMediaFolder('');
  assert.equal(listing.images[0]?.filename, 'cover.webp');
  assert.equal(listing.images[0]?.url, '/uploads/cover.webp');
});
