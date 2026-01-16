import { useEffect, useState } from 'react';

export default function HungerFrenzyAnimator({
  hunger,
  willpower,
}: {
  hunger: number;
  willpower: number;
}) {
  const [frenzy, setFrenzy] = useState(false);

  useEffect(() => {
    if (hunger >= 5 && willpower <= 2) {
      setFrenzy(true);
    } else {
      setFrenzy(false);
    }
  }, [hunger, willpower]);

  if (!frenzy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="animate-pulse border-4 border-blood-crimson p-8 rounded-xl shadow-[0_0_40px_rgba(180,0,0,0.8)]">
        <h1 className="text-3xl font-bold text-blood-crimson mb-2 text-center">
          HUNGER FRENZY
        </h1>
        <p className="text-blood-bone text-center max-w-sm">
          The Beast seizes control. You must feed or resist immediately.
        </p>
      </div>
    </div>
  );
}