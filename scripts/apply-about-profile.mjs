import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..');
const migrationFiles = [
  'migration-update-profile-about.sql',
  'migration-update-author-avatar.sql',
];

config({ path: join(rootDir, '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const connectionString = process.env.DATABASE_URL
  .replace(/([?&])sslmode=[^&]*/gi, '$1')
  .replace(/[?&]$/, '')
  .replace(/\?&/, '?');
const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const migrationFile of migrationFiles) {
    const sql = readFileSync(join(rootDir, 'db', migrationFile), 'utf8');
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO UPDATE SET applied_at = CURRENT_TIMESTAMP',
      [migrationFile],
    );
  }
  await client.query('COMMIT');

  const result = await client.query(`
    SELECT key, char_length(value) AS content_length
    FROM settings
    WHERE key IN (
      'about_author_bio_short', 'about_author_bio', 'about_author_bio_2',
      'about_author_bio_3', 'about_author_bio_4', 'author_avatar'
    )
    ORDER BY key
  `);
  console.table(result.rows);
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  await client.end().catch(() => undefined);
}
