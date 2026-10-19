import assert from 'node:assert/strict';
import test from 'node:test';

import { toQueryResult } from './db.ts';

test('UPDATE RETURNING preserves three returned records and the affected count', () => {
  const records = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(toQueryResult({ records, affected: 3 }), { rows: records, rowCount: 3 });
});

test('UPDATE without RETURNING uses the affected count with empty records', () => {
  assert.deepEqual(toQueryResult({ records: [], affected: 7 }), { rows: [], rowCount: 7 });
});

test('a statement matching zero rows returns an empty result with count zero', () => {
  assert.deepEqual(toQueryResult({ records: [], affected: 0 }), { rows: [], rowCount: 0 });
  assert.equal(toQueryResult({ records: [{ id: 1 }], affected: 0 }).rowCount, 0);
});

test('SELECT falls back to record count when affected is undefined', () => {
  const records = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(toQueryResult({ records, affected: undefined }), { rows: records, rowCount: 2 });
});

test('missing or invalid records become empty and null affected falls back to record count', () => {
  assert.deepEqual(toQueryResult({}), { rows: [], rowCount: 0 });
  assert.deepEqual(toQueryResult({ records: null as unknown as unknown[], affected: 7 }), { rows: [], rowCount: 7 });
  assert.deepEqual(toQueryResult({ records: [{ id: 1 }], affected: null }), { rows: [{ id: 1 }], rowCount: 1 });
});
