
export type CompulsionResult = {
  triggered: boolean;
  compulsion?: {
    clan: string;
    name: string;
    effect: string;
  };
};

export function evaluateCompulsion({
  hungerDice,
  successes,
  clan,
}: {
  hungerDice: number;
  successes: number;
  clan: string;
}): CompulsionResult {
  if (hungerDice === 0) return { triggered: false };

  if (successes === 0) {
    return {
      triggered: true,
      compulsion: getClanCompulsion(clan),
    };
  }

  return { triggered: false };
}

function getClanCompulsion(clan: string) {
  const table: Record<string, any> = {
    Brujah: {
      name: 'Rebellion',
      effect: 'Must resist authority or provoke conflict.',
    },
    Toreador: {
      name: 'Obsession',
      effect: 'Fixate on a stimulus to the exclusion of all else.',
    },
    Ventrue: {
      name: 'Arrogance',
      effect: 'Cannot accept advice or aid without resistance.',
    },
  };

  return {
    clan,
    ...(table[clan] ?? {
      name: 'The Beast',
      effect: 'Act impulsively according to Hunger.',
    }),
  };
}
