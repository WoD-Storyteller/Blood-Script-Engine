import { Injectable } from '@nestjs/common';

@Injectable()
export class RouseService {
  /**
   * V5 rouse check: roll 1d10, success on 6+.
   * Return true if success (no hunger increase), false if fail (hunger +1).
   */
  rouse(): boolean {
    const d = Math.floor(Math.random() * 10) + 1;
    return d >= 6;
  }
}
