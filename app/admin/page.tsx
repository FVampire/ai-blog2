import { query } from '../../lib/db';
import AdminDashboardContent from './AdminDashboardContent';

export const metadata = {
  title: '仪表盘 - Blog Admin',
};

export default async function AdminDashboardPage() {
  let stats = { totalPosts: 0, totalUsers: 0, totalComments: 0, todayViews: 0 };
  let recentPosts: any[] = [];

  try {
    const postsCountResult = await query('SELECT COUNT(*) as count FROM posts');
    const usersCountResult = await query('SELECT COUNT(*) as count FROM users');
    const commentsCountResult = await query('SELECT COUNT(*) as count FROM comments');
    const viewsResult = await query('SELECT COALESCE(SUM(views), 0) as total_views FROM posts');

    stats = {
      totalPosts: parseInt(postsCountResult.rows[0].count),
      totalUsers: parseInt(usersCountResult.rows[0].count),
      totalComments: parseInt(commentsCountResult.rows[0].count),
      todayViews: parseInt(viewsResult.rows[0].total_views),
    };

    const recentPostsResult = await query(
      `SELECT p.id, p.title, p.status, p.created_at, u.username as author_name
       FROM posts p LEFT JOIN users u ON p.author_id = u.id
       ORDER BY p.created_at DESC LIMIT 5`
    );

    recentPosts = recentPostsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      author: row.author_name || 'Unknown',
      date: new Date(row.created_at).toLocaleDateString('zh-CN'),
      status: row.status,
    }));
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  return <AdminDashboardContent stats={stats} recentPosts={recentPosts} />;
}
