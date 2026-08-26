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

for (const t of ['posts', 'blogs', 'tags', 'comments', 'blog_tags_legacy']) {
  const cols = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [t]
  );
  console.log(`\n=== ${t} ===`);
  console.log(cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(', '));
}

const counts = await client.query(`
  SELECT 'posts' t, COUNT(*)::int c FROM posts
  UNION ALL SELECT 'blogs', COUNT(*)::int FROM blogs
`);
console.log('\nCounts:', counts.rows);

for (const t of ['tags_legacy', 'author_profile']) {
  const cols = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [t]
  );
  console.log(`\n=== ${t} ===`);
  console.log(cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(', '));
  const sample = await client.query(`SELECT * FROM ${t} LIMIT 2`);
  console.log('sample:', sample.rows);
}
const tables = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' ORDER BY table_name
`);
console.log('\nAll tables:', tables.rows.map((r) => r.table_name).join(', '));

await client.end();