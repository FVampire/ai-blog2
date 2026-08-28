import { PostRepository } from '@/lib/repositories/PostRepository';

export const dynamic = 'force-dynamic';

const SITE_NAME = '五月的火';
const SITE_DESCRIPTION = '记录技术、设计与开发的个人博客';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let items = '';

  try {
    const result = await PostRepository.getPublicPosts({ page: 1, limit: 20 });

    items = result.data
      .map((post) => {
        const link = `${SITE_URL}/posts/${post.slug}`;
        const pubDate = new Date(post.publishedAt || Date.now()).toUTCString();
        return [
          '    <item>',
          `      <title>${escapeXml(post.title)}</title>`,
          `      <link>${escapeXml(link)}</link>`,
          `      <description>${escapeXml(post.excerpt || '')}</description>`,
          `      <pubDate>${pubDate}</pubDate>`,
          `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
          '    </item>',
        ].join('\n');
      })
      .join('\n');
  } catch (error) {
    console.error('Feed: failed to load posts', error);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    '    <language>zh-CN</language>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
