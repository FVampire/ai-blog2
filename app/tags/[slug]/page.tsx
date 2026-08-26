import { TagLegacyRepository } from '../../../lib/repositories/TagLegacyRepository';
import { BlogRepository } from '../../../lib/repositories/BlogRepository';
import TagPageContent from './TagPageContent';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await TagLegacyRepository.getTagBySlug(slug);
  if (tag) {
    return {
      title: `${tag.name} - 五月的火`,
      description: `浏览标签为 ${tag.name} 的所有文章`,
    };
  }
  return { title: '标签未找到 - 五月的火' };
}

export default async function TagSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = parseInt((await searchParams).page || '1') || 1;
  const postsPerPage = 6;

  const result = await TagLegacyRepository.getBlogsByTagSlug(slug, page, postsPerPage);
  const authorName = await BlogRepository.getAuthorName();

  if (!result) {
    return <TagPageContent tag={null as any} posts={[]} currentPage={1} totalPages={0} />;
  }

  const posts = result.blogs.map((b) => ({
    id: b.id,
    title: b.title,
    date: new Date(b.updatedAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    author: authorName,
    excerpt: b.excerpt,
    slug: b.slug,
    image: b.imageUrl,
    tags: b.tags.map((t) => ({
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
