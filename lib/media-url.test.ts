import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exposeMediaUrl,
  publicMediaUrl,
  rewriteMarkdownMediaUrls,
  storeMediaUrl,
  toMediaKey,
} from './media-url.ts';

test('toMediaKey accepts stored paths and COS URLs', () => {
  assert.equal(toMediaKey('/uploads/cover.webp'), 'uploads/cover.webp');
  assert.equal(toMediaKey('uploads/封面/a.jpg'), 'uploads/封面/a.jpg');
  assert.equal(
    toMediaKey('https://blog-1250000000.cos.ap-guangzhou.myqcloud.com/uploads/%E5%B0%81%E9%9D%A2.webp'),
    'uploads/封面.webp',
  );
  assert.equal(toMediaKey('https://cdn.example.com/other/a.jpg'), null);
  assert.equal(toMediaKey('../uploads/a.jpg'), null);
});

test('storeMediaUrl keeps a stable site-relative path', () => {
  assert.equal(storeMediaUrl('/uploads/cover.webp'), '/uploads/cover.webp');
  assert.equal(
    storeMediaUrl('https://blog-1250000000.cos.ap-guangzhou.myqcloud.com/uploads/cover.webp'),
    '/uploads/cover.webp',
  );
  assert.equal(storeMediaUrl('https://example.com/external.png'), 'https://example.com/external.png');
});

test('publicMediaUrl uses COS_PUBLIC_BASE_URL when set', () => {
  const env = {
    COS_PUBLIC_BASE_URL: 'https://img.example.com/',
  } as unknown as NodeJS.ProcessEnv;
  assert.equal(publicMediaUrl('/uploads/cover.webp', env), 'https://img.example.com/uploads/cover.webp');
  assert.equal(exposeMediaUrl('/uploads/中文.webp', env), 'https://img.example.com/uploads/%E4%B8%AD%E6%96%87.webp');
});

test('rewriteMarkdownMediaUrls rewrites article images', () => {
  const env = { COS_BUCKET: 'blog-1250000000', COS_REGION: 'ap-guangzhou' } as unknown as NodeJS.ProcessEnv;
  const markdown = '![cover](/uploads/a.png)\n<img src="/uploads/b.jpg">';
  const rewritten = rewriteMarkdownMediaUrls(markdown, env);
  assert.match(rewritten, /https:\/\/blog-1250000000\.cos\.ap-guangzhou\.myqcloud.com\/uploads\/a.png/);
  assert.match(rewritten, /https:\/\/blog-1250000000\.cos\.ap-guangzhou\.myqcloud.com\/uploads\/b.jpg/);
});
