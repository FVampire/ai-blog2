import assert from 'node:assert/strict';
import test from 'node:test';

import { detectImageFormat, validateImageFile } from './upload-image.ts';

function jpegBuffer(): Buffer {
  const buffer = Buffer.alloc(16, 0);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xe0;
  return buffer;
}

function pngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);
}

test('detectImageFormat recognizes jpeg/png/gif/webp magic bytes', () => {
  assert.equal(detectImageFormat(jpegBuffer()), 'jpeg');
  assert.equal(detectImageFormat(pngBuffer()), 'png');
  assert.equal(detectImageFormat(Buffer.from('GIF89aXXXXXX')), 'gif');

  const webp = Buffer.alloc(12, 0);
  webp.write('RIFF', 0);
  webp.write('WEBP', 8);
  assert.equal(detectImageFormat(webp), 'webp');
});

test('detectImageFormat rejects html disguised as an image', () => {
  assert.equal(detectImageFormat(Buffer.from('<script>alert(1)</script>')), null);
});

test('validateImageFile rejects mismatched extension and content', async () => {
  const file = new File([new Uint8Array(pngBuffer())], 'cover.jpg', { type: 'image/jpeg' });
  const result = await validateImageFile(file);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /不符/);
  }
});

test('validateImageFile accepts a matching jpeg', async () => {
  const file = new File([new Uint8Array(jpegBuffer())], 'cover.jpg', { type: 'image/jpeg' });
  const result = await validateImageFile(file);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.format, 'jpeg');
    assert.equal(result.extension, '.jpg');
  }
});

test('validateImageFile rejects svg even if named as png', async () => {
  const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'x.svg', {
    type: 'image/svg+xml',
  });
  const result = await validateImageFile(file);
  assert.equal(result.ok, false);
});
