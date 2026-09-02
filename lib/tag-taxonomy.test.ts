import assert from 'node:assert/strict';
import test from 'node:test';

import {
  groupTags,
  resolveCanonicalTagName,
  resolveCanonicalTagSlug,
} from './tag-taxonomy.ts';

test('resolveCanonicalTagName maps library-specific names to a broader tag', () => {
  assert.equal(resolveCanonicalTagName('Ant Design'), 'Frontend');
  assert.equal(resolveCanonicalTagName('tailwind-css'), 'Frontend');
  assert.equal(resolveCanonicalTagName('GDScript'), 'Godot');
  assert.equal(resolveCanonicalTagName('PostgreSQL'), 'Database');
});

test('resolveCanonicalTagName keeps first-class tags unchanged', () => {
  assert.equal(resolveCanonicalTagName('Godot'), 'Godot');
  assert.equal(resolveCanonicalTagName('TypeScript'), 'TypeScript');
  assert.equal(resolveCanonicalTagName('n8n'), 'n8n');
});

test('resolveCanonicalTagSlug redirects retired slugs to the surviving tag', () => {
  assert.equal(resolveCanonicalTagSlug('ant-design'), 'frontend');
  assert.equal(resolveCanonicalTagSlug('gdscript'), 'godot');
  assert.equal(resolveCanonicalTagSlug('frontend'), null);
  assert.equal(resolveCanonicalTagSlug('missing-tag'), null);
});

test('groupTags puts leftover tags into 其他 and hides empty groups', () => {
  const grouped = groupTags([
    { name: 'TypeScript', slug: 'typescript', post_count: 7 },
    { name: 'Frontend', slug: 'frontend', post_count: 4 },
    { name: 'Obscure', slug: 'obscure', post_count: 1 },
  ]);

  assert.deepEqual(grouped.map((group) => group.label), ['语言与框架', '方向', '其他']);
  assert.equal(grouped.at(-1)?.tags[0]?.slug, 'obscure');
});
