import { Injectable } from '@nestjs/common';
import { SafetyService } from '../safety/safety.service';
import { TenetCheckResult } from '../safety/tenets.types';

@Injectable()
export class StCoreService {
  constructor(
    private readonly safety: SafetyService,
  ) {}

  async validateSceneInput(
    client: any,
    engineId: string,
    content: string,
  ): Promise<TenetCheckResult> {
    return this.safety.checkTenets(client, {
      engineId,
      content,
    });
  }
}
