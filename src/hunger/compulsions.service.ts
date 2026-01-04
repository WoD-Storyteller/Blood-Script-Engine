import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class CompulsionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  async triggerBestialFailure(characterId?: string) {
    if (!characterId) return;

    await this.db.insert('compulsions', {
      character_id: characterId,
      type: 'bestial_failure',
      resolved: false,
      created_at: new Date(),
    });

    this.realtime.emit('frenzy_triggered', {
      characterId,
      severity: 'high',
    });
  }

  async triggerMessyCritical(characterId?: string) {
    if (!characterId) return;

    await this.db.insert('compulsions', {
      character_id: characterId,
      type: 'messy_critical',
      resolved: false,
      created_at: new Date(),
    });

    this.realtime.emit('compulsion_triggered', {
      characterId,
      severity: 'medium',
    });
  }
}
