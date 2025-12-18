import { Injectable } from '@nestjs/common';

@Injectable()
export class EngineService {
  async getEngineByGuildId(_guildId: string) {
    // Load engine + config + tenets
    return null;
  }
}
