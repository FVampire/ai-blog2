import assert from 'node:assert/strict';
import test from 'node:test';

import { safeEqualBytes, safeEqualString } from './safe-equal.ts';

test('equal strings and byte arrays match', () => {
  assert.equal(safeEqualString('secret', 'secret'), true);
  assert.equal(safeEqualBytes(new Uint8Array([0, 127, 255]), new Uint8Array([0, 127, 255])), true);
});

test('different strings and byte arrays do not match', () => {
  assert.equal(safeEqualString('secret', 'secreu'), false);
  assert.equal(safeEqualString('secret', 'tecret'), false);
  assert.equal(safeEqualBytes(new Uint8Array([1, 2]), new Uint8Array([1, 3])), false);
});

test('different lengths do not match', () => {
  assert.equal(safeEqualString('secret', 'secrets'), false);
  assert.equal(safeEqualBytes(new Uint8Array([1]), new Uint8Array([1, 2])), false);
});

test('empty strings and byte arrays match only other empty values', () => {
  assert.equal(safeEqualString('', ''), true);
  assert.equal(safeEqualString('', 'a'), false);
  assert.equal(safeEqualString('a', ''), false);
  assert.equal(safeEqualBytes(new Uint8Array(), new Uint8Array()), true);
});

test('multibyte Chinese strings compare by their UTF-8 bytes', () => {
  assert.equal(safeEqualString('中文密钥', '中文密钥'), true);
  assert.equal(safeEqualString('中文密钥', '中文密码'), false);
  assert.equal(safeEqualString('中文', '中'), false);
});
