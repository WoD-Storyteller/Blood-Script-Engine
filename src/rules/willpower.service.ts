import { Injectable } from '@nestjs/common';

@Injectable()
export class WillpowerService {
  canReroll(current: number): boolean {
    return current > 0;
  }

  applyRerollPenalty(current: number): number {
    if (current <= 0) return current;
    return current - 1;
  }

  applyDamage(current: number, amount: number): number {
    return Math.max(0, current - amount);
  }

  recover(current: number, max: number, amount: number): number {
    return Math.min(max, current + amount);
  }
}
