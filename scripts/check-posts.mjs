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

const schemas = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_name = 'posts'
  ORDER BY table_schema
`);
console.log('posts table locations:', schemas.rows);

const allPosts = await client.query(`
  SELECT id, title, slug, status, published_at, created_at
  FROM posts ORDER BY id
`);
console.log('\nAll posts in public.posts:', allPosts.rows.length);
for (const p of allPosts.rows) {
  console.log(`  [${p.id}] ${p.status} | ${p.title} | slug=${p.slug}`);
}

const published = await client.query(`
  SELECT COUNT(*) FROM posts WHERE status = 'published'
`);
console.log('\nPublished count (what homepage shows):', published.rows[0].count);

const byStatus = await client.query(`
  SELECT status, COUNT(*) FROM posts GROUP BY status
`);
console.log('By status:', byStatus.rows);

await client.end();
