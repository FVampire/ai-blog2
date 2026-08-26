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

const legacy = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='blog_tags_legacy' ORDER BY ordinal_position
`);
console.log('blog_tags_legacy cols:', legacy.rows.map((r) => r.column_name));

const sample = await client.query('SELECT * FROM blog_tags_legacy LIMIT 5');
console.log('blog_tags_legacy sample:', sample.rows);

const published = await client.query('SELECT id, title, slug, published FROM blogs ORDER BY created_at DESC');
console.log('\nAll blogs (' + published.rows.length + '):');
for (const b of published.rows) {
  console.log(`  ${b.published ? '✓' : '○'} ${b.title} (${b.slug})`);
}

const tagCols = await client.query(`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='tags_legacy' ORDER BY ordinal_position
`);
console.log('tags_legacy cols:', tagCols.rows);

const tagCount = await client.query(`
  SELECT t.name, t.slug, COUNT(bt.blog_id) as cnt
  FROM tags_legacy t
  LEFT JOIN blog_tags_legacy bt ON t.id = bt.tag_id
  GROUP BY t.id ORDER BY cnt DESC LIMIT 10
`);
console.log('top tags_legacy:', tagCount.rows);

await client.end();
