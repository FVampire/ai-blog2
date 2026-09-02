import { PostRepository } from '../../../lib/repositories/PostRepository';
import AdminPostsContent from './AdminPostsContent';

export const metadata = {
  title: '文章管理 - Blog Admin',
};

const PAGE_SIZE = 20;
const VALID_STATUSES = ['all', 'published', 'draft', 'archived'] as const;

type PostStatusFilter = (typeof VALID_STATUSES)[number];

interface AdminPostsPageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string; attention?: string }>;
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const params = await searchParams;

  const parsedPage = parseInt(params.page || '1', 10);
  const requestedPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const status: PostStatusFilter = VALID_STATUSES.includes(params.status as PostStatusFilter)
    ? (params.status as PostStatusFilter)
    : 'all';
  const search = (params.search || '').trim();
  const attention = params.attention === 'cover' || params.attention === 'category' ? params.attention : undefined;

  let posts: Array<{
    id: number;
    title: string;
    author: string;
    date: string;
    status: 'published' | 'draft' | 'archived';
    views: number;
    tags: string[];
  }> = [];
  let total = 0;
  let totalPages = 0;
  let page = requestedPage;

  try {
    const result = await PostRepository.getAdminPosts({
      page: requestedPage,
      limit: PAGE_SIZE,
      status,
      search: search || undefined,
      attention,
    });

    total = result.total;
    totalPages = result.totalPages;
    page = result.page;

    posts = result.data.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.authorName || 'admin',
      date: new Date(p.publishedAt || p.createdAt).toLocaleDateString('zh-CN'),
      status: p.status,
      views: p.views,
      tags: p.tags.map((t) => t.name),
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
  }

  return (
    <AdminPostsContent
      posts={posts}
      totalPosts={total}
      page={page}
      pageSize={PAGE_SIZE}
      totalPages={totalPages}
      status={status}
      search={search}
      attention={attention}
    />
  );
}
