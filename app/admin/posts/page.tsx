import { BlogRepository } from '../../../lib/repositories/BlogRepository';
import AdminPostsContent from './AdminPostsContent';

export const metadata = {
  title: '文章管理 - Blog Admin',
};

export default async function AdminPostsPage() {
  let posts: Array<{
    id: string;
    title: string;
    author: string;
    date: string;
    status: string;
    views: number;
    tags: string[];
  }> = [];

  try {
    const authorName = await BlogRepository.getAuthorName();
    const blogs = await BlogRepository.getAllBlogsAdmin();

    posts = blogs.map((b) => ({
      id: b.id,
      title: b.title,
      author: authorName,
      date: new Date(b.updatedAt || b.createdAt).toLocaleDateString('zh-CN'),
      status: b.status,
      views: b.views,
      tags: (b as { tagNames?: string[] }).tagNames || [],
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
  }

  return <AdminPostsContent posts={posts} totalPosts={posts.length} />;
}
