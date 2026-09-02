import { query } from '../../lib/db';
import AdminDashboardContent from './AdminDashboardContent';

export const metadata = { title: '工作台 - Blog Admin' };
export const dynamic = 'force-dynamic';

interface DashboardRow { id: number; title: string; slug: string; status: string; created_at: string; published_at: string | null; image_url?: string | null; category_id?: number | null; }

const formatPost = (row: DashboardRow) => ({ id: row.id, title: row.title, slug: row.slug, status: row.status, date: new Date(row.published_at || row.created_at).toLocaleDateString('zh-CN') });

export default async function AdminDashboardPage() {
  const counts = { drafts: 0, pendingComments: 0, missingCover: 0, missingCategory: 0 };
  let recentAgentPosts: ReturnType<typeof formatPost>[] = [];
  let attentionPosts: Array<ReturnType<typeof formatPost> & { missingCover: boolean; missingCategory: boolean }> = [];

  try {
    const countResult = await query(`SELECT COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts, COUNT(*) FILTER (WHERE status != 'archived' AND COALESCE(NULLIF(TRIM(image_url), ''), '') = '')::int AS missing_cover, COUNT(*) FILTER (WHERE status != 'archived' AND category_id IS NULL)::int AS missing_category FROM posts`);
    const pendingResult = await query("SELECT COUNT(*)::int AS count FROM comments WHERE status = 'pending'");
    counts.drafts = Number(countResult.rows[0]?.drafts || 0);
    counts.pendingComments = Number(pendingResult.rows[0]?.count || 0);
    counts.missingCover = Number(countResult.rows[0]?.missing_cover || 0);
    counts.missingCategory = Number(countResult.rows[0]?.missing_category || 0);

    const attentionResult = await query(`SELECT id, title, slug, status, created_at, published_at, image_url, category_id FROM posts WHERE status != 'archived' AND (COALESCE(NULLIF(TRIM(image_url), ''), '') = '' OR category_id IS NULL) ORDER BY updated_at DESC LIMIT 6`);
    attentionPosts = (attentionResult.rows as DashboardRow[]).map((row) => ({ ...formatPost(row), missingCover: !row.image_url?.trim(), missingCategory: row.category_id === null }));

    const agentResult = await query(`SELECT p.id, p.title, p.slug, p.status, p.created_at, p.published_at FROM audit_logs a INNER JOIN posts p ON p.id::text = a.resource_id WHERE a.action = 'agent.post.publish' AND a.resource_type = 'post' ORDER BY a.created_at DESC LIMIT 6`);
    recentAgentPosts = (agentResult.rows as DashboardRow[]).map(formatPost);
  } catch (error) {
    console.error('Error fetching workbench data:', error);
  }

  return <AdminDashboardContent counts={counts} recentAgentPosts={recentAgentPosts} attentionPosts={attentionPosts} />;
}
