import { query } from '@/lib/db';

export async function countPostMediaReferences(urlPrefix: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM posts
     WHERE image_url = $1 OR image_url LIKE $1 || '/%'`,
    [urlPrefix],
  );

  return Number(result.rows[0]?.count || 0);
}

export async function renamePostMediaReferences(oldUrlPrefix: string, newUrlPrefix: string): Promise<number> {
  const result = await query(
    `UPDATE posts
     SET image_url = $1 || substring(image_url FROM char_length($2) + 1),
         updated_at = NOW()
     WHERE image_url = $2 OR image_url LIKE $2 || '/%'`,
    [newUrlPrefix, oldUrlPrefix],
  );

  return result.rowCount || 0;
}
