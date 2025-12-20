import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TenetCheckResult } from '../safety/tenets.types';

@Injectable()
export class StatusService {
  /**
   * Record a tenet violation attempt
   */
  async recordTenetViolation(
    client: any,
    input: {
      engineId: string;
      userId: string;
      sceneId: string;
      tenetCheck: TenetCheckResult;
    },
  ) {
    if (input.tenetCheck.allowed) {
      return { ok: true };
    }

    const id = uuid();

    await client.query(
      `
      INSERT INTO tenet_violation_attempts
        (attempt_id, engine_id, user_id, scene_id, tenet_id, category)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        id,
        input.engineId,
        input.userId,
        input.sceneId,
        input.tenetCheck.tenetId,
        input.tenetCheck.category,
      ],
    );

    return {
      attemptId: id,
      category: input.tenetCheck.category,
      tenetTitle: input.tenetCheck.tenetTitle,
    };
  }
}