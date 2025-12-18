import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class ClocksService {
  private readonly logger = new Logger(ClocksService.name);

  async createClock(client: any, input: {
    engineId: string;
    title: string;
    segments: number;
    description?: string;
    scope?: 'engine' | 'domain' | 'coterie' | 'scene';
    scopeKey?: string;
    nightly?: boolean;
    createdByUserId?: string;
  }): Promise<{ message: string }> {
    try {
      const id = uuid();
      const seg = Math.max(1, Math.trunc(input.segments));
      await client.query(
        `
        INSERT INTO story_clocks
          (clock_id, engine_id, title, description, segments, progress, status, scope, scope_key, nightly, created_by_user_id)
        VALUES ($1,$2,$3,$4,$5,0,'active',$6,$7,$8,$9)
        `,
        [
          id,
          input.engineId,
          input.title,
          input.description ?? null,
          seg,
          input.scope ?? 'engine',
          input.scopeKey ?? null,
          !!input.nightly,
          input.createdByUserId ?? null,
        ],
      );

      return {
        message: `⏳ Clock created: \`${String(id).slice(0, 8)}\` **${input.title}** (0/${seg})${input.nightly ? ' [nightly]' : ''}`,
      };
    } catch (e: any) {
      this.logger.debug(`createClock fallback: ${e.message}`);
      return { message: `I can’t create clocks right now.` };
    }
  }

  async listClocks(client: any, input: { engineId: string }): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT clock_id, title, progress, segments, status, nightly
        FROM story_clocks
        WHERE engine_id = $1
        ORDER BY status ASC, updated_at DESC
        LIMIT 15
        `,
        [input.engineId],
      );

      if (!res.rowCount) return { message: 'No clocks recorded.' };

      const lines = res.rows.map((r: any) => {
        const short = String(r.clock_id).slice(0, 8);
        const flag = r.nightly ? ' [nightly]' : '';
        return `• \`${short}\` **${r.title}** — ${r.progress}/${r.segments} (${r.status})${flag}`;
      });

      return { message: `**Story Clocks**\n${lines.join('\n')}` };
    } catch (e: any) {
      this.logger.debug(`listClocks fallback: ${e.message}`);
      return { message: `I can’t list clocks right now.` };
    }
  }

  async showClock(client: any, input: { engineId: string; clockIdPrefix: string }): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT clock_id, title, description, progress, segments, status, scope, scope_key, nightly, completed_at
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `,
        [input.engineId, `${input.clockIdPrefix}%`],
      );

      if (!res.rowCount) return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };

      const c = res.rows[0];
      const lines: string[] = [];
      lines.push(`**${c.title}** (\`${String(c.clock_id).slice(0, 8)}\`)`);
      lines.push(`Progress: **${c.progress}/${c.segments}** — ${c.status}${c.nightly ? ' [nightly]' : ''}`);
      lines.push(`Scope: ${c.scope}${c.scope_key ? ` (${c.scope_key})` : ''}`);
      if (c.description) lines.push(`Description: ${c.description}`);
      if (c.completed_at) lines.push(`Completed: ${new Date(c.completed_at).toLocaleString()}`);

      const links = await this.safeLinkInfo(client, input.engineId, c.clock_id);
      if (links.length) {
        lines.push(`Links:`);
        lines.push(...links.map((x) => `• ${x}`));
      }

      const recent = await client.query(
        `
        SELECT amount, reason, created_at
        FROM clock_ticks
        WHERE engine_id = $1 AND clock_id = $2
        ORDER BY created_at DESC
        LIMIT 5
        `,
        [input.engineId, c.clock_id],
      );

      if (recent.rowCount) {
        lines.push(`Recent ticks:`);
        for (const r of recent.rows) {
          const sign = r.amount >= 0 ? '+' : '';
          lines.push(`• ${sign}${r.amount} — ${r.reason}`);
        }
      }

      return { message: lines.join('\n') };
    } catch (e: any) {
      this.logger.debug(`showClock fallback: ${e.message}`);
      return { message: `I can’t show that clock right now.` };
    }
  }

  async tickClock(client: any, input: {
    engineId: string;
    clockIdPrefix: string;
    amount: number;
    reason: string;
    tickedByUserId?: string;
  }): Promise<{ message: string; completed?: boolean; clockId?: string }> {
    try {
      const found = await client.query(
        `
        SELECT clock_id, title, progress, segments, status
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `,
        [input.engineId, `${input.clockIdPrefix}%`],
      );

      if (!found.rowCount) return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };

      const c = found.rows[0];
      if (c.status !== 'active') return { message: `That clock is not active.` };

      const amt = Math.trunc(input.amount);
      if (amt === 0) return { message: `Tick amount must not be zero.` };

      await client.query(
        `
        UPDATE story_clocks
        SET progress = GREATEST(0, progress + $3),
            updated_at = now()
        WHERE engine_id = $1 AND clock_id = $2
        `,
        [input.engineId, c.clock_id, amt],
      );

      await client.query(
        `
        INSERT INTO clock_ticks (tick_id, engine_id, clock_id, ticked_by_user_id, amount, reason)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [uuid(), input.engineId, c.clock_id, input.tickedByUserId ?? null, amt, input.reason],
      );

      const updated = await client.query(
        `SELECT progress, segments FROM story_clocks WHERE engine_id = $1 AND clock_id = $2`,
        [input.engineId, c.clock_id],
      );

      const progress = Number(updated.rows[0].progress);
      const segments = Number(updated.rows[0].segments);

      if (progress >= segments) {
        await client.query(
          `
          UPDATE story_clocks
          SET status = 'completed',
              completed_at = now(),
              updated_at = now(),
              progress = $3
          WHERE engine_id = $1 AND clock_id = $2
          `,
          [input.engineId, c.clock_id, segments],
        );

        return {
          message: `⏳ Clock completed: **${c.title}** (${segments}/${segments})`,
          completed: true,
          clockId: c.clock_id,
        };
      }

      return { message: `Clock advanced: **${c.title}** (${progress}/${segments})`, completed: false, clockId: c.clock_id };
    } catch (e: any) {
      this.logger.debug(`tickClock fallback: ${e.message}`);
      return { message: `I can’t tick clocks right now.` };
    }
  }

  async setNightly(client: any, input: { engineId: string; clockIdPrefix: string; nightly: boolean }): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT clock_id, title
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `,
        [input.engineId, `${input.clockIdPrefix}%`],
      );

      if (!res.rowCount) return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };

      await client.query(
        `
        UPDATE story_clocks
        SET nightly = $3, updated_at = now()
        WHERE engine_id = $1 AND clock_id = $2
        `,
        [input.engineId, res.rows[0].clock_id, !!input.nightly],
      );

      return { message: `Clock updated: **${res.rows[0].title}** nightly = **${!!input.nightly}**` };
    } catch (e: any) {
      this.logger.debug(`setNightly fallback: ${e.message}`);
      return { message: `I can’t update nightly flags right now.` };
    }
  }

  async linkClockToArc(client: any, input: {
    engineId: string;
    clockIdPrefix: string;
    arcIdPrefix: string;
    onComplete: string;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      const clock = await client.query(
        `SELECT clock_id, title FROM story_clocks WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2 LIMIT 1`,
        [input.engineId, `${input.clockIdPrefix}%`],
      );
      if (!clock.rowCount) return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };

      const arc = await client.query(
        `SELECT arc_id, title FROM chronicle_arcs WHERE engine_id = $1 AND CAST(arc_id AS TEXT) LIKE $2 LIMIT 1`,
        [input.engineId, `${input.arcIdPrefix}%`],
      );
      if (!arc.rowCount) return { message: `No arc found matching \`${input.arcIdPrefix}\`.` };

      await client.query(
        `
        INSERT INTO arc_clock_links (link_id, engine_id, arc_id, clock_id, on_complete, notes)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (engine_id, arc_id, clock_id)
        DO UPDATE SET on_complete = EXCLUDED.on_complete, notes = EXCLUDED.notes
        `,
        [uuid(), input.engineId, arc.rows[0].arc_id, clock.rows[0].clock_id, input.onComplete, input.notes ?? null],
      );

      return {
        message: `🔗 Linked clock **${clock.rows[0].title}** → arc **${arc.rows[0].title}** (onComplete: ${input.onComplete})`,
      };
    } catch (e: any) {
      this.logger.debug(`linkClockToArc fallback: ${e.message}`);
      return { message: `I can’t link clocks to arcs right now.` };
    }
  }

  async tickNightlyClocks(client: any, input: { engineId: string }): Promise<{ completed: Array<{ clockId: string; title: string }> }> {
    const completed: Array<{ clockId: string; title: string }> = [];
    try {
      const res = await client.query(
        `
        SELECT clock_id, title
        FROM story_clocks
        WHERE engine_id = $1 AND status = 'active' AND nightly = true
        ORDER BY updated_at ASC
        LIMIT 50
        `,
        [input.engineId],
      );

      for (const c of res.rows) {
        const r = await this.tickClock(client, {
          engineId: input.engineId,
          clockIdPrefix: String(c.clock_id),
          amount: 1,
          reason: 'Nightly tick.',
          tickedByUserId: undefined,
        });
        if (r.completed) completed.push({ clockId: c.clock_id, title: c.title });
      }
    } catch (e: any) {
      this.logger.debug(`tickNightlyClocks fallback: ${e.message}`);
    }
    return { completed };
  }

  async listClockLinksForCompleted(client: any, input: { engineId: string; clockId: string }): Promise<Array<{ arcId: string; arcTitle: string; onComplete: string }>> {
    try {
      const res = await client.query(
        `
        SELECT l.arc_id, a.title AS arc_title, l.on_complete
        FROM arc_clock_links l
        JOIN chronicle_arcs a ON a.arc_id = l.arc_id
        WHERE l.engine_id = $1 AND l.clock_id = $2
        `,
        [input.engineId, input.clockId],
      );
      return res.rows.map((r: any) => ({ arcId: r.arc_id, arcTitle: r.arc_title, onComplete: r.on_complete }));
    } catch {
      return [];
    }
  }

  private async safeLinkInfo(client: any, engineId: string, clockId: string): Promise<string[]> {
    try {
      const res = await client.query(
        `
        SELECT a.title AS arc_title, l.on_complete
        FROM arc_clock_links l
        JOIN chronicle_arcs a ON a.arc_id = l.arc_id
        WHERE l.engine_id = $1 AND l.clock_id = $2
        LIMIT 10
        `,
        [engineId, clockId],
      );
      return res.rows.map((r: any) => `Arc: **${r.arc_title}** (onComplete: ${r.on_complete})`);
    } catch {
      return [];
    }
  }
}