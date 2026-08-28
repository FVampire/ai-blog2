import assert from 'node:assert/strict';
import test from 'node:test';

import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { markdownSanitizeSchema } from './plugins.ts';

async function render(markdown: string): Promise<string> {
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSanitize, markdownSanitizeSchema)
      .use(rehypeStringify)
      .process(markdown)
  );
}

test('sanitize strips script tags from markdown HTML', async () => {
  const html = await render('hello <script>alert(1)</script> world');
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /alert\(1\)/);
  assert.match(html, /hello/);
  assert.match(html, /world/);
});

test('sanitize strips event-handler attributes', async () => {
  const html = await render('<img src="/x.png" onerror="alert(1)">');
  assert.doesNotMatch(html, /onerror/i);
  assert.match(html, /<img/i);
});

test('sanitize keeps ordinary formatting and images', async () => {
  const html = await render('**bold** and ![cover](/uploads/a.png)');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /src="\/uploads\/a.png"/);
});
