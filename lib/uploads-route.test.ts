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

test('images redirect to COS', async () => {
  for (const file of ['other/cover.webp', 'ai-interior-design/03-living.webp']) {
    const response = await read(file);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), 'https://media.example.test/uploads/' + file);
  }
});

test('HTML and scripts are never served, even when the object exists', async () => {
  const key = 'uploads/ai-interior-design/product/index.html';
  await getMediaStore().putObject(key, Buffer.from('<html>栖居</html>'), 'text/html');
  for (const file of [
    'ai-interior-design/product/index.html',
    'ai-interior-design/product/product.js',
    'ai-interior-design/demo/model-data.js',
    'other/index.html',
  ]) {
    const response = await read(file);
    assert.equal(response.status, 404, file);
    assert.equal(response.headers.get('location'), null, file);
  }
});

test('path traversal stays inaccessible', async () => {
  for (const file of ['ai-interior-design/../other/cover.webp', '../.env']) {
    assert.equal((await read(file)).status, 404, file);
  }
});
