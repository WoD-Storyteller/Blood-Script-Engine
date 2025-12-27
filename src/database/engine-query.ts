import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class EngineQuery {
  constructor(private readonly db: DatabaseService) {}

  async query(engineScopedQuery: string, params: any[] = []) {
    return this.db.query(engineScopedQuery, params);
  }
}