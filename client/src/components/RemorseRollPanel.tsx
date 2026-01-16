import { useState } from 'react';

export default function RemorseRollPanel({
  humanity,
  stains,
  onResolve,
}: {
  humanity: number;
  stains: number;
  onResolve: (lostHumanity: boolean) => void;
}) {
  const [rolled, setRolled] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const rollRemorse = () => {
    const pool = humanity - stains;
    const successes = Math.floor(Math.random() * pool);
    const pass = successes > 0;

    setRolled(true);
    setSuccess(pass);
    onResolve(!pass);
  };

  return (
    <div className="bg-blood-ash border border-blood-red/40 p-4 rounded-xl">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Remorse Roll
      </h3>

      {!rolled && (
        <button
          onClick={rollRemorse}
          className="px-4 py-2 bg-blood-crimson rounded hover:bg-blood-red"
        >
          Roll Remorse
        </button>
      )}

      {rolled && (
        <div
          className={`mt-3 p-3 rounded ${
            success ? 'bg-blood-dark' : 'bg-black'
          }`}
        >
          {success ? (
            <p className="text-blood-bone">
              You feel remorse. Humanity remains.
            </p>
          ) : (
            <p className="text-blood-red font-semibold">
              Humanity is lost.
            </p>
          )}
        </div>
      )}
    </div>
  );
}