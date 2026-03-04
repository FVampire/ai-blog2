// Re-export from the new database adapter for backward compatibility
export { default, createDatabaseAdapter } from './db-adapter';
export { query, getClient } from './db-adapter';
