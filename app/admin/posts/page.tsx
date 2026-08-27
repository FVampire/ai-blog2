import { PostRepository } from '../../../lib/repositories/PostRepository';
import AdminPostsContent from './AdminPostsContent';

export const metadata = {
  title: '文章管理 - Blog Admin',
};

export default async function AdminPostsPage() {
  let posts: Array<{
    id: number;
    title: string;
    author: string;
    date: string;
    status: string;
    views: number;
    tags: string[];
  }> = [];

  try {
    const result = await PostRepository.getAdminPosts({ page: 1, limit: 500 });

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

  return <AdminPostsContent posts={posts} totalPosts={posts.length} />;
}
