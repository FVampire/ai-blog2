import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { getMediaStore, resetMediaStoreForTests } from './storage/index.ts';
import { GET } from '../app/uploads/[...path]/route.ts';

const names = ['COS_SECRET_ID', 'COS_SECRET_KEY', 'COS_BUCKET', 'COS_REGION', 'COS_PUBLIC_BASE_URL'] as const;
const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
before(() => {
  for (const name of names) process.env[name] = 'test';
  process.env.COS_PUBLIC_BASE_URL = 'https://media.example.test';
});
after(() => {
  resetMediaStoreForTests();
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

function read(file: string) {
  return GET(new Request('https://site.example.test/uploads/' + file), {
    params: Promise.resolve({ path: file.split('/') }),
  });
}

test('project iframe HTML stays on the site origin with an explicit content type', async () => {
  const key = 'uploads/ai-interior-design/product/index.html';
  await getMediaStore().putObject(key, Buffer.from('<html>栖居</html>'), 'application/octet-stream');
  const response = await read('ai-interior-design/product/index.html');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await response.text(), '<html>栖居</html>');
});

test('missing model HTML returns 404', async () => {
  assert.equal((await read('ai-interior-design/demo/index.html')).status, 404);
});

test('large model scripts and existing images redirect to COS', async () => {
  for (const file of ['ai-interior-design/demo/model-data.js', 'ai-interior-design/product/product.css', 'other/cover.webp']) {
    const response = await read(file);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), 'https://media.example.test/uploads/' + file);
  }
});

test('arbitrary executable uploads and path traversal stay inaccessible', async () => {
  for (const file of ['other/index.html', 'ai-interior-design/product/unreviewed.js', 'ai-interior-design/product/../product/index.html']) {
    assert.equal((await read(file)).status, 404);
  }
});
