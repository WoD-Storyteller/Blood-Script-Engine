import { Arc } from '../types';

export default function ArcList({ arcs }: { arcs: Arc[] }) {
  return (
    <>
      <h2>Chronicle Arcs</h2>
      <ul>
        {arcs.map((a) => (
          <li key={a.arc_id}>
            {a.title} — {a.status}
          </li>
        ))}
      </ul>
    </>
  );
}