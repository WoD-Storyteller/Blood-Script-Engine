import { DatabaseService } from './database.service';

export class EngineQuery {
  constructor(
    private readonly db: DatabaseService,
    private readonly engineId: string,
  ) {}

  async query<T = any>(
    text: string,
    params: any[] = [],
  ) {
    // Enforce engine_id as first param
    const engineScopedQuery = `
      ${text}
    `;

    return this.db.query<T>(engineScopedQuery, params);
  }
}
