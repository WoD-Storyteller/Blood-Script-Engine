export const DYSCRASIA_RULES = {
  /**
   * V5 Core: an acute Resonance "incorporate[s] a Dyscrasia".
   * Engine mapping uses resonance intensity 1-3 for fleeting/intense/acute.
   * rules-source/v5_core_clean.txt
   */
  acuteIntensity: 3,
  auditActions: {
    apply: 'dyscrasia_applied',
    cleanse: 'dyscrasia_cleansed',
  },
};
