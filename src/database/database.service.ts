import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    // Use DATABASE_URL (Replit PostgreSQL) if available, otherwise fall back to DB_HOST (Supabase)
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    } else if (process.env.DB_HOST) {
      const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
      this.pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      });
    } else {
      throw new Error('No database configuration found. Set DATABASE_URL or DB_HOST environment variables.');
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