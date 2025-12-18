import { DatabaseService } from './database.service';

export async function withTransaction<T>(
  db: DatabaseService,
  fn: (client: any) => Promise<T>,
): Promise<T> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
