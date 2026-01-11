export type HumanityState = {
  humanity: number;          // 0–10
  stains: number;            // resets nightly
  degenerationLog: DegenerationEvent[];
};

export type DegenerationEvent = {
  id: string;
  timestamp: string;
  reason: string;
  stains: number;
  remorseRolled: boolean;
  success?: boolean;
  humanityLost?: number;
};
