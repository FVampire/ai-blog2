import { query } from '@/lib/db';
import { mediaReferencePrefixes, publicMediaUrl, storedMediaUrl, toMediaKey } from '@/lib/media-url';

export async function countPostMediaReferences(urlPrefix: string): Promise<number> {
  const prefixes = mediaReferencePrefixes(urlPrefix);
  const clauses = prefixes.map((_, index) => {
    const eq = index * 2 + 1;
    const like = index * 2 + 2;
    return `image_url = $${eq} OR image_url LIKE $${like}`;
  });
  const params = prefixes.flatMap((prefix) => [prefix, `${prefix}/%`]);
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM posts WHERE ${clauses.join(' OR ')}`,
    params,
  );

  return Number(result.rows[0]?.count || 0);
}

export async function renamePostMediaReferences(oldUrlPrefix: string, newUrlPrefix: string): Promise<number> {
  const oldKey = toMediaKey(oldUrlPrefix);
  const newKey = toMediaKey(newUrlPrefix);
  const pairs = oldKey && newKey
    ? [
      [storedMediaUrl(oldKey), storedMediaUrl(newKey)],
      [publicMediaUrl(oldKey), publicMediaUrl(newKey)],
    ]
    : [[oldUrlPrefix, newUrlPrefix]];

  const seen = new Set<string>();
  let updated = 0;
  for (const [from, to] of pairs) {
    if (!from || from === to || seen.has(from)) continue;
    seen.add(from);
    const result = await query(
      `UPDATE posts
       SET image_url = $1 || substring(image_url FROM char_length($2) + 1),
           updated_at = NOW()
       WHERE image_url = $2 OR image_url LIKE $2 || '/%'`,
      [to, from],
    );
    updated += result.rowCount || 0;
  }

  return updated;
}
