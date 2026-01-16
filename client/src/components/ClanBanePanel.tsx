export default function ClanBanePanel({ clan }: { clan?: string }) {
  if (!clan) return null;
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-1">Clan Bane</div>
      <div className="text-blood-bone text-sm">Clan {clan} bane active</div>
    </div>
  );
}
