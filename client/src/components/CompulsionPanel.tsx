export default function CompulsionPanel({ compulsion }: { compulsion?: string }) {
  if (!compulsion) return null;
  return (
    <div className="bg-blood-ash/40 rounded p-3 border border-blood-crimson/40">
      <div className="text-blood-crimson text-sm font-semibold mb-1">Active Compulsion</div>
      <div className="text-blood-bone">{compulsion}</div>
    </div>
  );
}
