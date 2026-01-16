export default function V5Skills({ sheet, onChange }: { sheet: any; onChange?: (s: any) => void }) {
  const skills = sheet?.skills || {};
  
  const renderDots = (val: number) => (
    <span className="text-blood-crimson">{'●'.repeat(val)}{'○'.repeat(5 - val)}</span>
  );
  
  const skillList = Object.entries(skills).filter(([_, v]) => (v as number) > 0);
  
  if (!skillList.length) {
    return (
      <div className="bg-blood-ash/40 rounded p-3">
        <div className="text-blood-crimson text-sm font-semibold mb-2">Skills</div>
        <div className="text-blood-bone/60 text-sm">No skills defined</div>
      </div>
    );
  }
  
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Skills</div>
      {skillList.map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-blood-bone capitalize">{k.replace(/_/g, ' ')}</span>
          {renderDots(v as number)}
        </div>
      ))}
    </div>
  );
}
