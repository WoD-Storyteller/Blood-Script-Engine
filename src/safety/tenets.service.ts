import { Injectable } from '@nestjs/common';

/**
 * TenetsService
 *
 * Central safety / content-policy evaluation layer.
 * This service is intentionally permissive by default.
 * All enforcement logic can be layered on later without breaking callers.
 */
@Injectable()
export class TenetsService {
  constructor() {}

  /**
   * Evaluate content against engine safety tenets.
   * Called by:
   * - ResolutionPipeline
   * - AI intent execution
   * - Scene moderation hooks
   */
  async evaluateTenets(
    client: any,
    input: {
      engineId: string;
      content?: any;
      actorId?: string;
      sceneId?: string;
    },
  ): Promise<{
    allowed: boolean;
    reason?: string;
    flags?: string[];
  }> {
    // If no content was provided, allow by default
    if (!input?.content) {
      return { allowed: true };
    }

    // ---------------------------------------------
    // PLACEHOLDER FOR REAL TENET LOGIC
    // ---------------------------------------------
    // Examples you may add later:
    // - Lines & Veils checks
    // - Strike escalation
    // - Safety card overrides
    // - Actor-specific bans
    // - Scene-scoped restrictions
    //
    // For now: permissive
    // ---------------------------------------------

    return {
      allowed: true,
    };
  }

  /**
   * Lightweight check used by older or external callers.
   * Kept for backward compatibility.
   */
  async checkTenets(
    client: any,
    input: {
      engineId: string;
      content?: any;
      actorId?: string;
      sceneId?: string;
    },
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    return this.evaluateTenets(client, input);
  }

  /**
   * Legacy compatibility alias.
   * Some older pipelines still call this name.
   */
  async checkContent(
    client: any,
    input: {
      engineId: string;
      content?: any;
      actorId?: string;
      sceneId?: string;
    },
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    return this.evaluateTenets(client, input);
  }
}