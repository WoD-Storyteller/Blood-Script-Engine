import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { DiscordDmService } from '../discord/discord.dm.service';

export const NARRATIVE_FEATURE_KEY = 'narrative_layer_enabled';

interface NarrativeConfig {
  narrative_enabled?: boolean;
}

interface NarrativeEventInput {
  networkId: string;
  title?: string;
  rumor: string;
  tags?: string[];
}

@Injectable()
export class NarrativeService {
  private readonly logger = new Logger(NarrativeService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly discordDm: DiscordDmService,
  ) {}

  async getGlobalToggle(client: any): Promise<boolean> {
    const result = await client.query(
      `SELECT enabled FROM global_feature_flags WHERE feature_key = $1`,
      [NARRATIVE_FEATURE_KEY],
    );
    return result.rowCount ? result.rows[0].enabled : false;
  }

  async setGlobalToggle(client: any, enabled: boolean) {
    await client.query(
      `
      INSERT INTO global_feature_flags (feature_key, enabled)
      VALUES ($1, $2)
      ON CONFLICT (feature_key)
      DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
      `,
      [NARRATIVE_FEATURE_KEY, enabled],
    );
  }

  async getEngineConfig(client: any, engineId: string): Promise<NarrativeConfig> {
    const result = await client.query(
      `SELECT config FROM engines WHERE engine_id = $1`,
      [engineId],
    );
    if (!result.rowCount) {
      return {};
    }
    const config = result.rows[0].config || {};
    return {
      narrative_enabled: config.narrative_enabled ?? false,
    };
  }

  async setEngineNarrativeEnabled(client: any, engineId: string, enabled: boolean) {
    const current = await client.query(
      `SELECT config FROM engines WHERE engine_id = $1`,
      [engineId],
    );
    if (!current.rowCount) {
      throw new Error('EngineNotFound');
    }
    const config = current.rows[0].config || {};
    config.narrative_enabled = enabled;
    await client.query(
      `UPDATE engines SET config = $1 WHERE engine_id = $2`,
      [JSON.stringify(config), engineId],
    );
    return config;
  }

  async listNetworksForEngine(client: any, engineId: string) {
    const result = await client.query(
      `
      SELECT nn.network_id, nn.name, nnm.joined_at
      FROM narrative_network_memberships nnm
      JOIN narrative_networks nn ON nn.network_id = nnm.network_id
      WHERE nnm.engine_id = $1 AND nnm.left_at IS NULL
      ORDER BY nnm.joined_at DESC
      `,
      [engineId],
    );
    return result.rows;
  }

  async createNetwork(client: any, engineId: string, name: string) {
    const networkId = uuid();
    await client.query(
      `
      INSERT INTO narrative_networks (network_id, name, created_by_engine_id)
      VALUES ($1, $2, $3)
      `,
      [networkId, name, engineId],
    );

    await client.query(
      `
      INSERT INTO narrative_network_memberships (network_id, engine_id)
      VALUES ($1, $2)
      ON CONFLICT (network_id, engine_id)
      DO UPDATE SET left_at = NULL, joined_at = now()
      `,
      [networkId, engineId],
    );

    return { network_id: networkId, name };
  }

  async joinNetwork(client: any, engineId: string, networkId: string) {
    const network = await client.query(
      `SELECT network_id, name FROM narrative_networks WHERE network_id = $1`,
      [networkId],
    );
    if (!network.rowCount) {
      throw new Error('NetworkNotFound');
    }

    await client.query(
      `
      INSERT INTO narrative_network_memberships (network_id, engine_id)
      VALUES ($1, $2)
      ON CONFLICT (network_id, engine_id)
      DO UPDATE SET left_at = NULL, joined_at = now()
      `,
      [networkId, engineId],
    );

    return network.rows[0];
  }

  async leaveNetwork(client: any, engineId: string, networkId: string) {
    const result = await client.query(
      `
      UPDATE narrative_network_memberships
      SET left_at = now()
      WHERE network_id = $1 AND engine_id = $2 AND left_at IS NULL
      `,
      [networkId, engineId],
    );
    if (!result.rowCount) {
      throw new Error('NotMember');
    }
  }

  async broadcastShadowEvent(client: any, engineId: string, input: NarrativeEventInput) {
    const globalEnabled = await this.getGlobalToggle(client);
    if (!globalEnabled) {
      throw new Error('NarrativeDisabled');
    }

    const engineConfig = await this.getEngineConfig(client, engineId);
    if (!engineConfig.narrative_enabled) {
      throw new Error('NarrativeDisabled');
    }

    const membership = await client.query(
      `
      SELECT 1
      FROM narrative_network_memberships
      WHERE network_id = $1 AND engine_id = $2 AND left_at IS NULL
      `,
      [input.networkId, engineId],
    );
    if (!membership.rowCount) {
      throw new Error('NotMember');
    }

    const network = await client.query(
      `SELECT name FROM narrative_networks WHERE network_id = $1`,
      [input.networkId],
    );
    if (!network.rowCount) {
      throw new Error('NetworkNotFound');
    }

    const engineRes = await client.query(
      `SELECT name FROM engines WHERE engine_id = $1`,
      [engineId],
    );
    const engineName = engineRes.rowCount ? engineRes.rows[0].name : 'Unknown Chronicle';

    const eventId = uuid();
    const payload = {
      title: input.title?.trim() || null,
      rumor: input.rumor,
      tags: input.tags ?? [],
    };

    await client.query(
      `
      INSERT INTO narrative_events (event_id, network_id, source_engine_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [eventId, input.networkId, engineId, 'shadow_rumor', JSON.stringify(payload)],
    );

    const targets = await client.query(
      `
      SELECT nnm.engine_id, e.name, e.config
      FROM narrative_network_memberships nnm
      JOIN engines e ON e.engine_id = nnm.engine_id
      WHERE nnm.network_id = $1
        AND nnm.left_at IS NULL
        AND nnm.engine_id <> $2
      `,
      [input.networkId, engineId],
    );

    const delivery = {
      eventId,
      networkId: input.networkId,
      networkName: network.rows[0].name,
      sourceEngineId: engineId,
      sourceEngineName: engineName,
      title: payload.title,
      rumor: payload.rumor,
      tags: payload.tags,
      createdAt: new Date().toISOString(),
    };

    for (const target of targets.rows) {
      const targetConfig = (target.config ?? {}) as NarrativeConfig;
      if (!targetConfig.narrative_enabled) continue;

      this.realtime.emitToEngine(target.engine_id, 'narrative_shadow', delivery);
      await this.sendDiscordRumor(target.engine_id, target.name, delivery);
    }

    return { eventId };
  }

  private async sendDiscordRumor(
    engineId: string,
    engineName: string,
    delivery: {
      sourceEngineName: string;
      networkName: string;
      title: string | null;
      rumor: string;
      tags: string[];
    },
  ) {
    const recipients = await this.db.query(
      `
      SELECT DISTINCT u.discord_user_id
      FROM engine_memberships em
      JOIN users u ON u.user_id = em.user_id
      WHERE em.engine_id = $1
        AND em.role IN ('owner', 'st')
        AND u.discord_user_id IS NOT NULL
      `,
      [engineId],
    );

    if (!recipients.rowCount) return;

    const lines = [
      `🕯️ **Rumor from ${delivery.sourceEngineName}**`,
      `Network: ${delivery.networkName}`,
    ];
    if (delivery.title) {
      lines.push(`**${delivery.title}**`);
    }
    lines.push(delivery.rumor);

    if (delivery.tags.length) {
      lines.push(`_Tags: ${delivery.tags.join(', ')}_`);
    }

    lines.push('', `_Delivered to ${engineName}. No gameplay effects._`);

    const message = lines.join('\n');

    for (const row of recipients.rows) {
      const ok = await this.discordDm.sendDM(row.discord_user_id, message);
      if (!ok) {
        this.logger.warn(
          `Failed to deliver narrative rumor DM to ${row.discord_user_id} for engine ${engineId}`,
        );
      }
    }
  }
}
