import React from 'react';

export default function RouseControls({
  hunger,
  setHunger,
}: {
  hunger: number;
  setHunger: (h: number) => void;
}) {
  const rouse = () => {
    const fail = Math.random() < 0.5;
    if (fail && hunger < 5) {
      setHunger(hunger + 1);
    }
  };

  const feed = () => {
    if (hunger > 0) setHunger(hunger - 1);
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={rouse}
        className="px-3 py-1 rounded bg-blood-crimson hover:bg-blood-red"
      >
        Rouse Check
      </button>

      <button
        onClick={feed}
        className="px-3 py-1 rounded bg-blood-dark border border-blood-red/40"
      >
        Feed
      </button>
    </div>
  );
}