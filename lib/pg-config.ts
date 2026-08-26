/**
 * PostgreSQL SSL configuration shared by TypeORM, migrate script, etc.
 */
export function getDatabaseSsl(): false | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL === 'false') {
    return false;
  }
  return { rejectUnauthorized: false };
}

/** Strip sslmode from URL so pg Client ssl option takes effect */
export function sanitizeDatabaseUrl(url: string): string {
  let result = url.replace(/([?&])sslmode=[^&]*/gi, '$1');
  result = result.replace(/\?&/, '?').replace(/[?&]$/, '');
  return result;
}
