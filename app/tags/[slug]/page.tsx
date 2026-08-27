import { TagRepository } from '../../../lib/repositories/TagRepository';
import { PostRepository } from '../../../lib/repositories/PostRepository';
import TagPageContent from './TagPageContent';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await TagRepository.getTagBySlug(slug);
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

  const result = await TagRepository.getPostsByTagSlug(slug, page, postsPerPage);
  const authorName = await PostRepository.getAuthorName();

  if (!result) {
    return <TagPageContent tag={null as any} posts={[]} currentPage={1} totalPages={0} />;
  }

  const posts = result.posts.map((p) => ({
    id: p.id,
    title: p.title,
    date: new Date(p.publishedAt || Date.now()).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
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
