import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  createMediaFolder,
  deleteMediaFolder,
  isValidMediaName,
  listMediaFolder,
  mediaPathToUrl,
  normalizeMediaPath,
  renameMediaFolder,
} from './media-library.ts';

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

test('media folders support create, list, rename, and recursive delete', () => {
  const originalDirectory = process.cwd();
  const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'media-library-'));

  try {
    process.chdir(testDirectory);
    createMediaFolder('', '文章图片');
    createMediaFolder('uploads/文章图片', '2026');
    assert.equal(fs.existsSync(path.join(testDirectory, 'public', 'uploads', '文章图片', '2026')), true);
    assert.equal(fs.existsSync(path.join(testDirectory, 'public', '文章图片')), false);

    assert.deepEqual(
      new Set(listMediaFolder('').folders.map((folder) => folder.path)),
      new Set(['uploads/文章图片']),
    );
    assert.equal(listMediaFolder('').currentFolder, '');
    assert.equal(listMediaFolder('uploads/文章图片').folders[0]?.path, 'uploads/文章图片/2026');

    const renamed = renameMediaFolder('uploads/文章图片/2026', '归档');
    assert.equal(renamed.newPath, 'uploads/文章图片/归档');
    assert.throws(() => deleteMediaFolder('uploads/文章图片'), /不为空/);
    deleteMediaFolder('uploads/文章图片', true);
    assert.equal(listMediaFolder('').folders.some((folder) => folder.path === 'uploads/文章图片'), false);
  } finally {
    process.chdir(originalDirectory);
    fs.rmSync(testDirectory, { recursive: true, force: true });
  }
});

test('media folders cannot escape the uploads root', () => {
  const originalDirectory = process.cwd();
  const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'media-library-root-'));

  try {
    process.chdir(testDirectory);
    assert.throws(() => createMediaFolder('blog-covers', 'legacy'), /不属于媒体库/);
    assert.throws(() => mediaPathToUrl('blog-covers/example.webp'), /不属于媒体库/);
    assert.throws(() => renameMediaFolder('uploads', 'images'), /不能重命名/);
    assert.throws(() => renameMediaFolder('', 'images'), /不能重命名/);
    assert.throws(() => deleteMediaFolder('uploads', true), /不能删除/);
    assert.throws(() => deleteMediaFolder('', true), /不能删除/);
  } finally {
    process.chdir(originalDirectory);
    fs.rmSync(testDirectory, { recursive: true, force: true });
  }
});
