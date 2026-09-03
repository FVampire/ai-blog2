import { query } from '../db';

export type DistributionStatus = 'pending' | 'sent' | 'failed' | 'skipped' | 'needs_manual';

export interface DistributionJob {
  id: number;
  postId: number;
  channel: string;
  status: DistributionStatus;
  payload: unknown;
  result: unknown;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createDistributionJob(input: {
  postId: number;
  channel: string;
  status: DistributionStatus;
  payload?: unknown;
  result?: unknown;
  error?: string;
}): Promise<number> {
  const rows = await query(
    `INSERT INTO distribution_jobs (post_id, channel, status, payload, result, error)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
     RETURNING id`,
    [
      input.postId,
      input.channel,
      input.status,
      JSON.stringify(input.payload ?? null),
      JSON.stringify(input.result ?? null),
      input.error || null,
    ],
  );
  return Number(rows.rows[0].id);
}

export async function hasSuccessfulJob(postId: number, channel: string): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM distribution_jobs
     WHERE post_id = $1 AND channel = $2 AND status = 'sent'
     LIMIT 1`,
    [postId, channel],
  );
  return rows.rows.length > 0;
}

export async function listDistributionJobs(limit = 50): Promise<Array<DistributionJob & { postTitle?: string; postSlug?: string }>> {
  const rows = await query(
    `SELECT j.id, j.post_id AS "postId", j.channel, j.status, j.payload, j.result, j.error,
            j.created_at AS "createdAt", j.updated_at AS "updatedAt",
            p.title AS "postTitle", p.slug AS "postSlug"
     FROM distribution_jobs j
     LEFT JOIN posts p ON p.id = j.post_id
     ORDER BY j.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.rows as Array<DistributionJob & { postTitle?: string; postSlug?: string }>;
}

export async function markDistributionJobSent(jobId: number): Promise<boolean> {
  const result = await query(
    `UPDATE distribution_jobs
     SET status = 'sent',
         result = COALESCE(result, '{}'::jsonb) || $2::jsonb,
         error = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'needs_manual'
     RETURNING id`,
    [jobId, JSON.stringify({ stage: 'manually_published', markedAt: new Date().toISOString() })],
  );
  return result.rows.length > 0;
}
