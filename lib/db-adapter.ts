import { Pool as PostgresPool } from 'pg';

// Database configuration
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgresql';
const DATABASE_URL = process.env.DATABASE_URL || '';

// PostgreSQL adapter (current implementation)
class PostgreSQLAdapter {
  private pool: PostgresPool;

  constructor() {
    console.log('Using PostgreSQL adapter:', DATABASE_URL);
    this.pool = new PostgresPool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    this.pool.on('connect', () => {
      console.log('✅ PostgreSQL connected successfully');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  }

  async getClient() {
    const client = await this.pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds, after which we will log a warning
    const timeout = setTimeout(() => {
      console.error('A PostgreSQL client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the client release to clear timeout
    client.release = () => {
      clearTimeout(timeout);
      return release();
    };

    return { query, release };
  }

  async close() {
    await this.pool.end();
  }
}

// Abstract database adapter
abstract class DatabaseAdapterBase {
  abstract query(text: string, params?: any[]): Promise<any>;
  abstract getClient(): Promise<{ query: Function, release: Function }>;
  abstract close(): Promise<void>;
}

// MySQL adapter with dynamic import
class MySQLAdapter extends DatabaseAdapterBase {
  private pool: any = null;
  private mysql: any = null;

  constructor() {
    super();
    this.init();
  }

  private async init() {
    try {
      // Dynamically import mysql2
      this.mysql = await import('mysql2/promise');
      console.log('✅ MySQL dependency loaded successfully');

      // Parse DATABASE_URL for MySQL
      const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
      this.pool = this.mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.substring(1),
        connectionLimit: 20,
        timezone: '+00:00',
      });

      // Test connection
      await this.testConnection();
    } catch (err) {
      console.error('❌ MySQL adapter initialization error:', err);
      console.warn('MySQL adapter not available. Please check your mysql2 installation.');
      throw new Error('MySQL adapter not available due to missing dependencies');
    }
  }

  private async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL connected successfully');
      connection.release();
    } catch (err) {
      console.error('❌ MySQL connection error:', err);
      throw err;
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('MySQL adapter not initialized');
    }

    const start = Date.now();
    const [rows] = await this.pool.execute(text, params);
    const duration = Date.now() - start;
    return { rows };
  }

  async getClient() {
    if (!this.pool) {
      throw new Error('MySQL adapter not initialized');
    }

    const connection = await this.pool.getConnection();
    const query = async (text: string, params?: any[]) => {
      const [rows] = await connection.execute(text, params);
      return { rows };
    };

    const release = () => {
      connection.release();
    };

    // Set a timeout of 5 seconds, after which we will log a warning
    const timeout = setTimeout(() => {
      console.error('A MySQL connection has been checked out for more than 5 seconds!');
    }, 5000);

    const releaseWrapper = () => {
      clearTimeout(timeout);
      release();
    };

    return { query, release: releaseWrapper };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// SQLite adapter with dynamic import
class SQLiteAdapter extends DatabaseAdapterBase {
  private db: any = null;
  private sqlite3: any = null;
  private sqlite: any = null;

  constructor() {
    super();
    this.init();
  }

  private async init() {
    try {
      // Dynamically import sqlite3 and sqlite
      this.sqlite3 = await import('sqlite3');
      this.sqlite = await import('sqlite');
      console.log('✅ SQLite dependencies loaded successfully');

      // For SQLite, we use the database path from DATABASE_URL or default to a file
      let dbPath = './database.sqlite';
      if (DATABASE_URL.startsWith('sqlite://')) {
        dbPath = DATABASE_URL.substring(9); // Remove 'sqlite://' prefix
      } else if (DATABASE_URL.startsWith('file:')) {
        dbPath = DATABASE_URL.substring(5); // Remove 'file:' prefix
      }

      this.db = await this.sqlite.open({
        filename: dbPath,
        driver: this.sqlite3.Database
      });

      console.log('✅ SQLite connected successfully');
    } catch (err) {
      console.error('❌ SQLite adapter initialization error:', err);
      console.warn('SQLite adapter not available. Please check your sqlite3 and sqlite installation.');
      throw new Error('SQLite adapter not available due to missing dependencies');
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.db) {
      throw new Error('SQLite adapter not initialized');
    }

    const start = Date.now();
    let rows;

    if (params && params.length > 0) {
      rows = await this.db.all(text, params);
    } else {
      rows = await this.db.all(text);
    }

    const duration = Date.now() - start;
    return { rows };
  }

  async getClient() {
    // For SQLite, we return the same instance since it's file-based
    if (!this.db) {
      throw new Error('SQLite adapter not initialized');
    }

    const query = async (text: string, params?: any[]) => {
      let rows;
      if (params && params.length > 0) {
        rows = await this.db.all(text, params);
      } else {
        rows = await this.db.all(text);
      }
      return { rows };
    };

    const release = () => {
      // Nothing to release for SQLite
    };

    // Set a timeout of 5 seconds, after which we will log a warning
    const timeout = setTimeout(() => {
      console.error('A SQLite client has been checked out for more than 5 seconds!');
    }, 5000);

    const releaseWrapper = () => {
      clearTimeout(timeout);
      release();
    };

    return { query, release: releaseWrapper };
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

// Supabase adapter
class SupabaseAdapter extends DatabaseAdapterBase {
  private supabase: any = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.init();
  }

  private async init() {
    try {
      // Dynamically import Supabase client
      const supabaseModule = await import('@/lib/supabase/server');
      // You'll need to pass the request and response objects to createServerClient
      // For now, we'll create a default client, but in practice you'll need to
      // pass the request and response from your API routes
      this.supabase = supabaseModule.createServerClient();
      this.isInitialized = true;
      console.log('✅ Supabase client loaded successfully');
    } catch (err) {
      console.error('❌ Supabase adapter initialization error:', err);
      console.warn('Please ensure @/lib/supabase/server exists of Supabase support');
      throw new Error('Supabase adapter not available due to missing dependencies or configuration');
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Supabase adapter not initialized');
    }

    // Supabase doesn't use raw SQL queries in the same way
    // You would typically use the Supabase client methods like:
    // this.supabase.from('table_name').select()
    // this.supabase.from('table_name').insert()
    // etc.

    // For compatibility with existing code, we need to adapt SQL queries
    // to Supabase client calls, but this is complex and depends on the specific query

    // As a placeholder, we'll throw an error indicating this needs implementation
    throw new Error('Raw SQL queries are not supported with Supabase adapter. Use the Supabase client methods directly.');
  }

  async getClient() {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Supabase adapter not initialized');
    }

    // Return the Supabase client directly
    const query = async (text: string, params?: any[]) => {
      throw new Error('Raw SQL queries are not supported with Supabase adapter. Use the Supabase client methods directly.');
    };

    const release = () => {
      // Nothing to release for Supabase
    };

    return {
      query,
      release,
      // Provide access to the Supabase client directly
      supabase: this.supabase
    };
  }

  async close() {
    // Nothing to close for Supabase
  }
}

// Enhanced Supabase adapter that accepts request/response for createServerClient
class EnhancedSupabaseAdapter extends DatabaseAdapterBase {
  private supabaseFactory: any = null;
  private request: any = null;
  private response: any = null;

  constructor(request?: any, response?: any) {
    super();
    try {
      // Store request/response for lazy initialization
      this.request = request;
      this.response = response;

      // Dynamically import Supabase client
      this.supabaseFactory = require('@/lib/supabase/server');
      console.log('✅ Supabase client module loaded successfully');
    } catch (err) {
      console.error('❌ Supabase adapter initialization error:', err);
      console.warn('Please ensure @/lib/supabase/server exists for Supabase support');
      throw new Error('Supabase adapter not available due to missing dependencies or configuration');
    }
  }

  private createClient() {
    if (!this.supabaseFactory) {
      throw new Error('Supabase factory not initialized');
    }

    // Create client with request/response if available
    if (this.request && this.response) {
      return this.supabaseFactory.createServerClient(this.request, this.response);
    } else {
      // Fallback to default client creation
      return this.supabaseFactory.createServerClient();
    }
  }

  async query(text: string, params?: any[]) {
    throw new Error('Raw SQL queries are not supported with Supabase adapter. Use the Supabase client methods directly.');
  }

  async getClient() {
    const supabase = this.createClient();

    const query = async (text: string, params?: any[]) => {
      throw new Error('Raw SQL queries are not supported with Supabase adapter. Use the Supabase client methods directly.');
    };

    const release = () => {
      // Nothing to release for Supabase
    };

    return {
      query,
      release,
      // Provide access to the Supabase client directly
      supabase
    };
  }

  async close() {
    // Nothing to close for Supabase
  }
}

// Database adapter factory
class DatabaseAdapter {
  private adapter: DatabaseAdapterBase;

  constructor(request?: any, response?: any) {
    switch (DATABASE_TYPE.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        this.adapter = new PostgreSQLAdapter();
        break;
      case 'mysql':
        this.adapter = new MySQLAdapter();
        break;
      case 'sqlite':
        this.adapter = new SQLiteAdapter();
        break;
      case 'supabase':
        this.adapter = new EnhancedSupabaseAdapter(request, response);
        break;
      default:
        console.warn(`Unknown database type: ${DATABASE_TYPE}. Defaulting to PostgreSQL.`);
        this.adapter = new PostgreSQLAdapter();
        break;
    }
  }

  async query(text: string, params?: any[]) {
    return await this.adapter.query(text, params);
  }

  async getClient() {
    return await this.adapter.getClient();
  }

  async close() {
    await this.adapter.close();
  }
}

// Export singleton instance for backward compatibility
const dbAdapter = new DatabaseAdapter();
export default dbAdapter;

// Export factory function for Supabase support (requires request/response)
export const createDatabaseAdapter = (request?: any, response?: any) => {
  return new DatabaseAdapter(request, response);
};

// Export helper functions for backward compatibility
export const query = async (text: string, params?: any[]) => {
  return await dbAdapter.query(text, params);
};

export const getClient = async () => {
  return await dbAdapter.getClient();
};