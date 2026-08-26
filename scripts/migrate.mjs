/**
 * Database migration runner
 * Runs all db/migration-*.sql files in order, tracking applied migrations.
 *
 * Usage: node scripts/migrate.mjs
 *        pnpm migrate
 */

import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// SSL — strip sslmode from URL so rejectUnauthorized applies
function getClientConfig(connectionString) {
  const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
  const sanitized = connectionString
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
  return { connectionString: sanitized, ssl };
}

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dbDir = join(rootDir, 'db');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = new pg.Client(getClientConfig(DATABASE_URL));

async function ensureMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations() {
  const result = await client.query('SELECT filename FROM schema_migrations ORDER BY id');
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigration(filename) {
  const filepath = join(dbDir, filename);
  const sql = readFileSync(filepath, 'utf-8');

  console.log(`  Applying: ${filename}`);
  await client.query(sql);
  await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
  console.log(`  ✓ Applied: ${filename}`);
}

async function main() {
  console.log('Running database migrations...\n');

  await client.connect();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const migrationFiles = readdirSync(dbDir)
    .filter((f) => f.startsWith('migration-') && f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of migrationFiles) {
    if (applied.has(file)) {
      console.log(`  Skip (already applied): ${file}`);
      continue;
    }
    await runMigration(file);
    count++;
  }

  await client.end();

  if (count === 0) {
    console.log('\nNo new migrations to apply.');
  } else {
    console.log(`\n✅ Applied ${count} migration(s).`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
