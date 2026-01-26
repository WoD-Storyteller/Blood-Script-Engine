import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    // Prefer Replit's built-in PostgreSQL using PGHOST environment variables
    // This takes priority over DATABASE_URL which may point to external (unreachable) databases
    if (process.env.PGHOST && process.env.PGHOST !== '' && !process.env.PGHOST.includes('supabase')) {
      this.pool = new Pool({
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
      });
      console.log(`[DatabaseService] Using Replit PostgreSQL: ${process.env.PGHOST}/${process.env.PGDATABASE}`);
    } else if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase')) {
      // Fall back to DATABASE_URL if it's not pointing to unreachable Supabase
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      console.log('[DatabaseService] Using DATABASE_URL for PostgreSQL connection');
    } else {
      throw new Error('No reachable database configuration found. Ensure Replit PostgreSQL is provisioned (PGHOST env var).');
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
