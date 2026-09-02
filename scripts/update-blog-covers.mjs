import { config } from 'dotenv';
import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const coverBySlug = new Map([
  ['ProgrammingStandards', '/uploads/blog-covers/ProgrammingStandards.webp'],
  ['caddy2UserGuide', '/uploads/blog-covers/caddy2UserGuide.webp'],
  ['remix-tailwind-shadcn', '/uploads/blog-covers/remix-tailwind-shadcn.webp'],
  ['nest1', '/uploads/blog-covers/nest1.webp'],
  ['nest2', '/uploads/blog-covers/nest2.webp'],
  ['nest3', '/uploads/blog-covers/nest3.webp'],
  ['vitepress', '/uploads/blog-covers/vitepress.webp'],
  ['antdesign-tailwind', '/uploads/blog-covers/antdesign-tailwind.webp'],
  ['lan_proxy_usag', '/uploads/blog-covers/lan_proxy_usag.webp'],
  ['mongodb1', '/uploads/blog-covers/mongodb1.webp'],
  ['caddy-minio', '/uploads/blog-covers/caddy-minio.webp'],
  ['next-essay', '/uploads/blog-covers/next-essay.webp'],
  ['stable-diffusion', '/uploads/blog-covers/stable-diffusion.webp'],
  ['postgresql', '/uploads/blog-covers/postgresql.webp'],
  ['zhihu_invites_designated_users', '/uploads/blog-covers/zhihu_invites_designated_users.webp'],
  ['kafka', '/uploads/blog-covers/kafka.webp'],
  ['mcp-server-node', '/uploads/blog-covers/mcp-server-node.webp'],
  ['wasm_optimization', '/uploads/blog-covers/wasm_optimization.webp'],
  ['docker-image-resource', '/uploads/blog-covers/docker-image-resource.webp'],
  ['obsdian-recommended-configuration', '/uploads/blog-covers/obsdian-recommended-configuration.webp'],
  ['react-vulnerability', '/uploads/blog-covers/react-vulnerability.webp'],
  ['n8n-practical-guide-1-foundations', '/uploads/blog-covers/n8n-practical-guide-1-foundations.webp'],
  ['n8n-practical-guide-2-production-workflows', '/uploads/blog-covers/n8n-practical-guide-2-production-workflows.webp'],
  ['n8n-practical-guide-3-operations', '/uploads/blog-covers/n8n-practical-guide-3-operations.webp'],
  ['godot-practical-guide-1-scene-tree', '/uploads/blog-covers/godot-practical-guide-1-scene-tree.webp'],
  ['godot-practical-guide-2-character-loop', '/uploads/blog-covers/godot-practical-guide-2-character-loop.webp'],
  ['godot-practical-guide-3-resources', '/uploads/blog-covers/godot-practical-guide-3-resources.webp'],
  ['godot-practical-guide-4-shipping', '/uploads/blog-covers/godot-practical-guide-4-shipping.webp'],
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
