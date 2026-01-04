import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class StService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  async forceCompulsion(
    engineId: string,
    characterId: string,
    compulsion: string,
  ) {
    await this.db.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{active_compulsion}',
        to_jsonb($2::text),
        true
      )
      WHERE engine_id=$1 AND character_id=$3
      `,
      [engineId, compulsion, characterId],
    );

    this.realtime.emitToEngine(engineId, 'compulsion_forced', {
      characterId,
      compulsion,
    });
  }

  async adjustHunger(
    engineId: string,
    characterId: string,
    hunger: number,
  ) {
    await this.db.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{hunger}',
        to_jsonb($2::int),
        true
      )
      WHERE engine_id=$1 AND character_id=$3
      `,
      [engineId, hunger, characterId],
    );

    this.realtime.emitToEngine(engineId, 'hunger_changed', {
      characterId,
      hunger,
    });
  }

  async adjustHumanity(
    engineId: string,
    characterId: string,
    humanity: number,
  ) {
    await this.db.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{humanity}',
        to_jsonb($2::int),
        true
      )
      WHERE engine_id=$1 AND character_id=$3
      `,
      [engineId, humanity, characterId],
    );

    this.realtime.emitToEngine(engineId, 'humanity_changed', {
      characterId,
      humanity,
    });
  }

  async emitTestEvent(engineId: string, event: string, payload: any) {
    this.realtime.emitToEngine(engineId, event, payload);
  }
}
