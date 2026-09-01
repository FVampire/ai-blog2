import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env' });

const coverBySlug = new Map([
  ['ProgrammingStandards', '/blog-covers/ProgrammingStandards.webp'],
  ['caddy2UserGuide', '/blog-covers/caddy2UserGuide.webp'],
  ['remix-tailwind-shadcn', '/blog-covers/remix-tailwind-shadcn.webp'],
  ['nest1', '/blog-covers/nest1.webp'],
  ['nest2', '/blog-covers/nest2.webp'],
  ['nest3', '/blog-covers/nest3.webp'],
  ['vitepress', '/blog-covers/vitepress.webp'],
  ['antdesign-tailwind', '/blog-covers/antdesign-tailwind.webp'],
  ['lan_proxy_usag', '/blog-covers/lan_proxy_usag.webp'],
  ['mongodb1', '/blog-covers/mongodb1.webp'],
  ['caddy-minio', '/blog-covers/caddy-minio.webp'],
  ['next-essay', '/blog-covers/next-essay.webp'],
  ['stable-diffusion', '/blog-covers/stable-diffusion.webp'],
  ['postgresql', '/blog-covers/postgresql.webp'],
  ['zhihu_invites_designated_users', '/blog-covers/zhihu_invites_designated_users.webp'],
  ['kafka', '/blog-covers/kafka.webp'],
  ['mcp-server-node', '/blog-covers/mcp-server-node.webp'],
  ['wasm_optimization', '/blog-covers/wasm_optimization.webp'],
  ['docker-image-resource', '/blog-covers/docker-image-resource.webp'],
  ['obsdian-recommended-configuration', '/blog-covers/obsdian-recommended-configuration.webp'],
  ['react-vulnerability', '/blog-covers/react-vulnerability.webp'],
]);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query('BEGIN');

  for (const [slug, imageUrl] of coverBySlug) {
    const result = await client.query(
      'UPDATE posts SET image_url = $1, updated_at = NOW() WHERE slug = $2 RETURNING id, title',
      [imageUrl, slug],
    );

    if (result.rowCount !== 1) {
      throw new Error(`Expected one post for slug ${slug}, updated ${result.rowCount ?? 0}`);
    }

    console.log(`Updated ${slug} -> ${imageUrl}`);
  }

  await client.query('COMMIT');
  console.log(`Updated ${coverBySlug.size} blog covers.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
