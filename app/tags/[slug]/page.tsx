import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import TagPageContent from './TagPageContent';
import { formatDate } from '../../../lib/format';
import { resolveCanonicalTagSlug } from '../../../lib/tag-taxonomy';
import { PostRepository } from '../../../lib/repositories/PostRepository';
import { TagRepository } from '../../../lib/repositories/TagRepository';

const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveCanonicalTagSlug(slug) || slug;
  const tag = await TagRepository.getTagBySlug(canonicalSlug);

  if (!tag) {
    return { title: '标签未找到' };
  }

  const title = `标签：${tag.name}`;
  const description = `浏览标签为 ${tag.name} 的所有文章`;
  const url = `${SITE_URL}/tags/${tag.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'zh_CN',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  };
}

export default async function TagSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = resolveCanonicalTagSlug(slug);
  if (canonicalSlug) {
    redirect(`/tags/${canonicalSlug}`);
  }
  const page = parseInt((await searchParams).page || '1') || 1;
  const postsPerPage = 6;

  const result = await TagRepository.getPostsByTagSlug(slug, page, postsPerPage);

  if (!result) {
    notFound();
  }

  const authorName = await PostRepository.getAuthorName();

  const posts = result.posts.map((p) => ({
    id: p.id,
    title: p.title,
    date: formatDate(p.publishedAt),
    author: authorName,
    excerpt: p.excerpt,
    slug: p.slug,
    image: p.imageUrl,
    tags: p.tags.map((t) => ({
      name: t.name,
      slug: t.slug,
      color: t.color || '#6C757D',
    })),
  }));

  const tag = {
    id: result.tag.id,
    name: result.tag.name,
    slug: result.tag.slug,
    post_count: result.tag.postCount,
  };

  return (
    <TagPageContent
      tag={tag}
      posts={posts}
      currentPage={page}
      totalPages={result.totalPages}
    />
  );
}
