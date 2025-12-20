/**
 * Result of evaluating content against server tenets.
 *
 * - allowed: true
 *   → Content is permitted, no metadata needed.
 *
 * - allowed: false
 *   → Content violates a tenet and must include full context
 *     for logging, warnings, and escalation.
 */
export type TenetCheckResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      tenetId: string;
      tenetTitle: string;
      category: string;
    };
