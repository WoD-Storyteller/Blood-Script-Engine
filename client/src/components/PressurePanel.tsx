import { Pressure } from '../types';

export default function PressurePanel({ pressure }: { pressure: Pressure[] }) {
  return (
    <>
      <h2>Political Pressure</h2>
      <ul>
        {pressure.map((p, i) => (
          <li key={i}>
            [{p.source}] (severity {p.severity}) {p.description}
          </li>
        ))}
      </ul>
    </>
  );
}
