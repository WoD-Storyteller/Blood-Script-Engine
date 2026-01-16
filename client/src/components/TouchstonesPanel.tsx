export default function TouchstonesPanel({ sheet }: { sheet: any }) {
  const touchstones = sheet?.touchstones || [];
  
  if (!touchstones.length) return null;
  
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Touchstones</div>
      {touchstones.map((t: any, i: number) => (
        <div key={i} className="text-blood-bone text-sm mb-1">
          {t.name} <span className="text-blood-gold/60 text-xs">({t.status})</span>
        </div>
      ))}
    </div>
  );
}
