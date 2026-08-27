import pg from 'pg';

const ssl = { rejectUnauthorized: false };
const pass = 'iDTCvJqhyx7ggq4G';

const pools = {
  blog_db: new pg.Pool({
    connectionString: `postgresql://postgres:${pass}@db.kuokkgppenbeackkauac.supabase.co:5432/blog_db`,
    ssl,
  }),
  postgres: new pg.Pool({
    connectionString: `postgresql://postgres:${pass}@db.kuokkgppenbeackkauac.supabase.co:5432/postgres?options=-csearch_path%3Dpublic`,
    ssl,
  }),
};

async function tables(pool, db) {
  const r = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log(`\n=== ${db} tables (${r.rows.length}) ===`);
  for (const row of r.rows) console.log(' ', row.table_name);
}

async function cols(pool, db, table) {
  const r = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1
    ORDER BY ordinal_position
  `, [table]);
  console.log(`\n--- ${db}.${table} ---`);
  for (const c of r.rows) console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
}

try {
  await tables(pools.blog_db, 'blog_db');
  await tables(pools.postgres, 'postgres');

  for (const t of ['posts', 'tags', 'post_tags', 'users', 'comments']) {
    try { await cols(pools.blog_db, 'blog_db', t); } catch {}
    try { await cols(pools.postgres, 'postgres', t); } catch {}
  }
  for (const t of ['blogs', 'tags_legacy', 'blog_tags_legacy', 'author_profile', 'comments', 'projects']) {
    try { await cols(pools.postgres, 'postgres', t); } catch {}
  }
} finally {
  await pools.blog_db.end();
  await pools.postgres.end();
}
