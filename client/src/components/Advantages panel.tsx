import React from 'react';

export default function AdvantagesPanel({
  advantages = [],
  flaws = [],
}: {
  advantages?: { name: string; dots: number }[];
  flaws?: { name: string; dots: number }[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm uppercase text-blood-crimson mb-2">
        Advantages & Flaws
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* ADVANTAGES */}
        <div>
          <h4 className="text-xs uppercase mb-1">Advantages</h4>
          {advantages.length === 0 && (
            <div className="text-xs opacity-60">None</div>
          )}
          {advantages.map((a, i) => (
            <div key={i} className="text-sm flex justify-between">
              <span>{a.name}</span>
              <span>{'●'.repeat(a.dots)}</span>
            </div>
          ))}
        </div>

        {/* FLAWS */}
        <div>
          <h4 className="text-xs uppercase mb-1">Flaws</h4>
          {flaws.length === 0 && (
            <div className="text-xs opacity-60">None</div>
          )}
          {flaws.map((f, i) => (
            <div key={i} className="text-sm flex justify-between">
              <span>{f.name}</span>
              <span>{'●'.repeat(f.dots)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}