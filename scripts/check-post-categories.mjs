import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

await client.connect();

const result = await client.query(`
  SELECT c.name AS category, c.slug, COUNT(p.id)::int AS post_count,
         array_agg(p.title ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL) AS posts
  FROM post_categories c
  LEFT JOIN posts p ON p.category_id = c.id
  GROUP BY c.id
  ORDER BY c.sort_order, c.id
`);

const unassigned = await client.query('SELECT id, title FROM posts WHERE category_id IS NULL ORDER BY id');

console.log('Post categories:');
for (const row of result.rows) {
  console.log(`  ${row.category} (${row.post_count})`);
  for (const title of row.posts || []) console.log(`    - ${title}`);
}
console.log(`\nUnassigned posts: ${unassigned.rowCount}`);

await client.end();
