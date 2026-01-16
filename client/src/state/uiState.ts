import { create } from 'zustand';

type UIState = {
  frenzy: boolean;
  messyCritical: boolean;
  bestialFailure: boolean;
  bloodSurge: boolean;

  triggerFrenzy(): void;
  triggerMessyCritical(): void;
  triggerBestialFailure(): void;
  triggerBloodSurge(): void;
};

export const useUIState = create<UIState>((set) => ({
  frenzy: false,
  messyCritical: false,
  bestialFailure: false,
  bloodSurge: false,

  triggerFrenzy() {
    set({ frenzy: true });
    setTimeout(() => set({ frenzy: false }), 1800);
  },

  triggerMessyCritical() {
    set({ messyCritical: true });
    setTimeout(() => set({ messyCritical: false }), 900);
  },

  triggerBestialFailure() {
    set({ bestialFailure: true });
    setTimeout(() => set({ bestialFailure: false }), 1200);
  },

  triggerBloodSurge() {
    set({ bloodSurge: true });
    setTimeout(() => set({ bloodSurge: false }), 700);
  },
}));
