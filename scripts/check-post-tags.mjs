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

const tags = await client.query('SELECT id, name, slug, color FROM tags ORDER BY id');
const posts = await client.query(`
  SELECT
    p.id, p.title, p.slug, p.excerpt,
    COALESCE(
      json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
        FILTER (WHERE t.id IS NOT NULL),
      '[]'
    ) AS tags
  FROM posts p
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id
  GROUP BY p.id
  ORDER BY p.id
`);

console.log(JSON.stringify({ tags: tags.rows, posts: posts.rows }, null, 2));

await client.end();
