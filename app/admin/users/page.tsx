import { query } from '../../../lib/db';
import AdminUsersContent from './AdminUsersContent';

export const metadata = {
  title: '用户管理 - Blog Admin',
};

export default async function AdminUsersPage() {
  let users: any[] = [];

  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.created_at, COUNT(p.id) as post_count
       FROM users u LEFT JOIN posts p ON u.id = p.author_id
       GROUP BY u.id, u.username, u.email, u.role, u.status, u.created_at
       ORDER BY u.created_at DESC`
    );

    users = result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      joinDate: new Date(row.created_at).toLocaleDateString('zh-CN'),
      posts: parseInt(row.post_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  return <AdminUsersContent users={users} />;
}
