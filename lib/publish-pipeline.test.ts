import assert from 'node:assert/strict';
import test from 'node:test';

import { siteBaseUrl } from './site-url.ts';
import { stripMarkdown, truncateText } from './text-plain.ts';

test('stripMarkdown removes fences, links and heading marks', () => {
  assert.equal(stripMarkdown('# Hello [world](https://x.test)\n\n```js\n1\n```'), 'Hello world');
  assert.equal(truncateText('abcdefghij', 4), 'abc…');
});

test('siteBaseUrl strips trailing slashes', () => {
  assert.equal(siteBaseUrl({ SITE_URL: 'https://blog.test/' } as unknown as NodeJS.ProcessEnv), 'https://blog.test');
  assert.equal(
    siteBaseUrl({ NEXT_PUBLIC_SITE_URL: 'https://public.test', SITE_URL: 'https://ignored.test' } as unknown as NodeJS.ProcessEnv),
    'https://public.test',
  );
});
