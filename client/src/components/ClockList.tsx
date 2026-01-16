import { Clock } from '../types';

export default function ClockList({ clocks }: { clocks: Clock[] }) {
  return (
    <>
      <h2>Story Clocks</h2>
      <ul>
        {clocks.map((c) => (
          <li key={c.clock_id}>
            {c.title}: {c.progress}/{c.segments} {c.nightly ? '(nightly)' : ''}
          </li>
        ))}
      </ul>
    </>
  );
}