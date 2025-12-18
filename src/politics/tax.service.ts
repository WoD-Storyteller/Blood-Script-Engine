import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { CoteriesAdapter } from './coteries.adapter';

type BoonLevel = 'trivial' | 'minor' | 'major' | 'blood' | 'life';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(private readonly coteries: CoteriesAdapter) {}

  async setTaxRule(client: any, input: {
    engineId: string;
    domainName: string;
    coterieName: string;
    amount: number;
    title?: string;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
      if (!cot) return { message: `I can’t find a coterie named "${input.coterieName}".` };

      await client.query(
        `
        INSERT INTO domain_tax_rules
          (rule_id, engine_id, domain_name, taxed_to_coterie_id, amount, title, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (engine_id, domain_name)
        DO UPDATE SET
          taxed_to_coterie_id = EXCLUDED.taxed_to_coterie_id,
          amount = EXCLUDED.amount,
          title = EXCLUDED.title,
          notes = EXCLUDED.notes,
          updated_at = now()
        `,
        [
          uuid(),
          input.engineId,
          input.domainName,
          cot.coterie_id,
          Math.max(0, Math.trunc(input.amount)),
          input.title ?? 'Domain Tax',
          input.notes ?? null,
        ],
      );

      return { message: `Tax set: **${input.domainName}** → **${cot.name}** (amount ${Math.max(0, Math.trunc(input.amount))})` };
    } catch (e: any) {
      this.logger.debug(`setTaxRule fallback: ${e.message}`);
      return { message: `I can’t store tax rules right now.` };
    }
  }

  async listTaxRules(client: any, input: { engineId: string }): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT domain_name, taxed_to_coterie_id, amount, title
        FROM domain_tax_rules
        WHERE engine_id = $1
        ORDER BY domain_name ASC
        LIMIT 25
        `,
        [input.engineId],
      );

      if (!res.rowCount) return { message: 'No tax rules recorded.' };

      const lines: string[] = [];
      for (const r of res.rows) {
        const cotName = await this.tryCoterieName(client, input.engineId, r.taxed_to_coterie_id);
        lines.push(`• **${r.domain_name}** → **${cotName ?? r.taxed_to_coterie_id}** (amount ${r.amount})`);
      }

      return { message: `**Domain Taxes**\n${lines.join('\n')}` };
    } catch (e: any) {
      this.logger.debug(`listTaxRules fallback: ${e.message}`);
      return { message: `I can’t access tax rules right now.` };
    }
  }

  /**
   * Collect taxes: for each rule, if the domain has a holder, create a boon owed by holder -> coterie recipient.
   * This requires `domain_claims` and `boons` tables to exist to fully work.
   */
  async collectTaxes(client: any, input: { engineId: string; collectedByUserId: string }): Promise<{ message: string }> {
    try {
      const rules = await client.query(
        `
        SELECT domain_name, taxed_to_coterie_id, amount, title
        FROM domain_tax_rules
        WHERE engine_id = $1
        `,
        [input.engineId],
      );

      if (!rules.rowCount) return { message: 'No tax rules to collect.' };

      let created = 0;
      let skipped = 0;

      for (const r of rules.rows) {
        // Find domain holder in domain_claims (if any)
        const dom = await client.query(
          `
          SELECT claimed_by_user_id
          FROM domain_claims
          WHERE engine_id = $1 AND LOWER(name) = LOWER($2)
          LIMIT 1
          `,
          [input.engineId, r.domain_name],
        );

        const holderUserId = dom.rowCount ? dom.rows[0].claimed_by_user_id : null;
        if (!holderUserId) {
          skipped++;
          continue;
        }

        const recipientUserId = await this.coteries.getRecipientUserId(client, input.engineId, r.taxed_to_coterie_id);
        if (!recipientUserId) {
          skipped++;
          continue;
        }

        // Create a boon representing the tax owed (level scales a bit with amount)
        const level = this.levelForAmount(r.amount);

        await client.query(
          `
          INSERT INTO boons
            (boon_id, engine_id, from_user_id, to_user_id, level, status, title, details, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,'owed',$6,$7,now(),now())
          `,
          [
            uuid(),
            input.engineId,
            holderUserId,        // debtor
            recipientUserId,     // creditor
            level,
            r.title ?? 'Domain Tax',
            `Tax owed for domain "${r.domain_name}" (amount ${r.amount}).`,
          ],
        );

        created++;
      }

      return {
        message: `Taxes collected. Boons created: **${created}**. Skipped (unclaimed/no recipient): **${skipped}**.`,
      };
    } catch (e: any) {
      this.logger.debug(`collectTaxes fallback: ${e.message}`);
      return { message: `I can’t collect taxes right now.` };
    }
  }

  private levelForAmount(amount: number): BoonLevel {
    const a = Math.max(0, Math.trunc(amount));
    if (a <= 1) return 'trivial';
    if (a <= 3) return 'minor';
    if (a <= 6) return 'major';
    if (a <= 10) return 'blood';
    return 'life';
  }

  private async tryCoterieName(client: any, engineId: string, coterieId: string): Promise<string | null> {
    try {
      const res = await client.query(
        `SELECT name FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
        [engineId, coterieId],
      );
      return res.rowCount ? res.rows[0].name : null;
    } catch {
      return null;
    }
  }
}