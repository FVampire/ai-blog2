import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { verifyEdgeToken } from './edge-jwt.ts';

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload: Record<string, unknown>, secret: string) {
  const message = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`;
  return `${message}.${createHmac('sha256', secret).update(message).digest('base64url')}`;
}

test('edge verifier accepts a valid HS256 admin token', async () => {
  const secret = 'test-secret';
  const token = sign({
    userId: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 60,
  }, secret);
  const payload = await verifyEdgeToken(token, secret);
  assert.equal(payload?.userId, 1);
  assert.equal(payload?.role, 'admin');
});

test('edge verifier rejects forged and expired tokens', async () => {
  const valid = sign({ userId: 1, username: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 }, 'right');
  assert.equal(await verifyEdgeToken(valid, 'wrong'), null);
  const expired = sign({ userId: 1, username: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) - 1 }, 'right');
  assert.equal(await verifyEdgeToken(expired, 'right'), null);
});
