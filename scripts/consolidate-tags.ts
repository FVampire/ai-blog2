import dotenv from 'dotenv';
import pg from 'pg';

import { getDatabaseSsl, sanitizeDatabaseUrl } from '../lib/pg-config.ts';
import { getTagMergePairs } from '../lib/tag-taxonomy.ts';

dotenv.config({ quiet: true });

if (!process.env.DATABASE_URL) throw new Error('缺少 DATABASE_URL');

function createClient() {
  return new pg.Client({
    connectionString: sanitizeDatabaseUrl(process.env.DATABASE_URL || ''),
    ssl: getDatabaseSsl(),
    connectionTimeoutMillis: 20000,
  });
}

async function withClient<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = createClient();
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

const pairs = getTagMergePairs();
let merged = 0;
let skipped = 0;

for (const { fromSlug, toSlug } of pairs) {
  await withClient(async (client) => {
    const source = await client.query('SELECT id FROM tags WHERE slug = $1', [fromSlug]);
    const target = await client.query('SELECT id FROM tags WHERE slug = $1', [toSlug]);
    if (source.rowCount === 0) {
      skipped += 1;
      return;
    }
    if (target.rowCount === 0) {
      console.log(`跳过 ${fromSlug}：目标 ${toSlug} 不存在`);
      skipped += 1;
      return;
    }

    const sourceId = source.rows[0].id;
    const targetId = target.rows[0].id;
    await client.query(
      `INSERT INTO post_tags (post_id, tag_id)
       SELECT post_id, $2 FROM post_tags WHERE tag_id = $1
       ON CONFLICT (post_id, tag_id) DO NOTHING`,
      [sourceId, targetId]
    );
    await client.query('DELETE FROM post_tags WHERE tag_id = $1', [sourceId]);
    await client.query('DELETE FROM tags WHERE id = $1', [sourceId]);
    merged += 1;
    console.log(`合并 ${fromSlug} → ${toSlug}`);
  });
}

const remaining = await withClient(async (client) => {
  const result = await client.query('SELECT COUNT(*)::int AS count FROM tags');
  return result.rows[0].count as number;
});

console.log(JSON.stringify({ merged, skipped, remaining }, null, 2));
