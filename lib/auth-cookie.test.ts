import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_TOKEN_COOKIE, adminCookieOptions, expiredAdminCookieOptions } from './auth-cookie.ts';

test('admin cookie is httpOnly and scoped to the site', () => {
  const options = adminCookieOptions();
  assert.equal(ADMIN_TOKEN_COOKIE, 'admin_token');
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
  assert.ok((options.maxAge ?? 0) > 0);
});

test('expired cookie options clear the session', () => {
  assert.equal(expiredAdminCookieOptions().maxAge, 0);
});
