import { useEffect, useState } from 'react';
import {
  fetchCharacters,
  fetchCharacter,
  setActiveCharacter,
  updateCharacterSheet,
} from '../api';

import HungerMeter from './HungerMeter';
import BloodPoolBar from './BloodPoolBar';
import WillpowerTracker from './WillpowerTracker';
import HumanityTracker from './HumanityTracker';
import ResonanceDyscrasia from './ResonanceDyscrasia';
import ClanBanePanel from './ClanBanePanel';
import CompulsionPanel from './CompulsionPanel';

import V5Attributes from './sheet/V5Attributes';
import V5Skills from './sheet/V5Skills';
import V5IdentityBlock from './sheet/V5IdentityBlock';

import DisciplinesPanel from './DisciplinesPanel';
import MeritsFlawsPanel from './MeritsFlawsPanel';
import TouchstonesPanel from './TouchstonesPanel';
import RitualsPanel from './RitualsPanel';
import XpSpendPanel from './XpSpendPanel';

import V5SheetEditor from './V5SheetEditor';

import { getRealtime, connectRealtime } from '../realtime';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<any | null>(null);
  const [editSheet, setEditSheet] = useState<any | null>(null);
  const [page, setPage] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------- */
  /* Fetching                                           */
  /* -------------------------------------------------- */

  const refreshCharacters = async () => {
    try {
      const rows = await fetchCharacters();
      setCharacters(rows);
      if (!selectedId && rows.length) {
        setSelectedId(rows[0].character_id);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const refreshSheet = async (id: string) => {
    try {
      const s = await fetchCharacter(id);
      setSheet(s);
      setEditSheet(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* -------------------------------------------------- */
  /* Lifecycle                                          */
  /* -------------------------------------------------- */

  useEffect(() => {
    refreshCharacters();
    connectRealtime();
  }, []);

  useEffect(() => {
    if (selectedId) {
      refreshSheet(selectedId);
    }
  }, [selectedId]);

  /* -------------------------------------------------- */
  /* Realtime updates                                   */
  /* -------------------------------------------------- */

  useEffect(() => {
    const sock = getRealtime();
    if (!sock) return;

    const onCharacterUpdated = (payload: any) => {
      if (payload?.characterId === selectedId) {
        refreshSheet(selectedId);
      }
      refreshCharacters();
    };

    sock.on('character_updated', onCharacterUpdated);
    sock.on('active_character_changed', refreshCharacters);

    return () => {
      sock.off('character_updated', onCharacterUpdated);
      sock.off('active_character_changed', refreshCharacters);
    };
  }, [selectedId]);

  /* -------------------------------------------------- */
  /* Guards                                             */
  /* -------------------------------------------------- */

  if (!selectedId) {
    return <div className="text-blood-bone">No character selected.</div>;
  }

  /* -------------------------------------------------- */
  /* Render                                             */
  /* -------------------------------------------------- */

  return (
    <div className="flex gap-6 mt-6">
      {/* ==================================================
          LEFT COLUMN — CHARACTER LIST
         ================================================== */}
      <aside className="w-1/4 bg-blood-ash rounded-xl p-4 border border-blood-red/40">
        <h3 className="text-lg font-semibold text-blood-crimson mb-4">
          Characters
        </h3>

        {error && (
          <div className="mb-3 text-sm text-red-400">
            Error: {error}
          </div>
        )}

        <div className="space-y-2">
          {characters.map((c) => (
            <div
              key={c.character_id}
              className={`p-2 rounded cursor-pointer transition
                ${
                  selectedId === c.character_id
                    ? 'bg-blood-dark border border-blood-crimson'
                    : 'hover:bg-blood-dark/60'
                }
              `}
              onClick={() => setSelectedId(c.character_id)}
            >
              <div className="font-medium flex justify-between">
                <span>{c.name}</span>
                {c.is_active && <span>⭐</span>}
              </div>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await setActiveCharacter(c.character_id);
                  refreshCharacters();
                }}
                className="mt-1 text-xs px-2 py-1 rounded
                           bg-blood-crimson hover:bg-blood-red"
              >
                Set Active
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ==================================================
          RIGHT COLUMN — CHARACTER SHEET
         ================================================== */}
      <main className="w-3/4 bg-blood-ash rounded-xl p-6 border border-blood-red/40 text-blood-bone">
        {/* ---------- PAGE TOGGLE ---------- */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPage(1)}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? 'bg-blood-crimson'
                  : 'bg-blood-dark border border-blood-red/40'
              }`}
            >
              Page 1
            </button>
            <button
              onClick={() => setPage(2)}
              className={`px-3 py-1 rounded ${
                page === 2
                  ? 'bg-blood-crimson'
                  : 'bg-blood-dark border border-blood-red/40'
              }`}
            >
              Page 2
            </button>
          </div>

          {!editSheet && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditSheet(structuredClone(sheet))}
                className="px-3 py-1 rounded bg-blood-crimson hover:bg-blood-red"
              >
                Edit
              </button>
              <button
                onClick={() => refreshSheet(selectedId)}
                className="px-3 py-1 rounded bg-blood-dark border border-blood-red/40"
              >
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* ---------- VIEW MODE ---------- */}
        {sheet && !editSheet && page === 1 && (
          <>
            <V5IdentityBlock 
              sheet={sheet} 
              characterId={selectedId || undefined}
              onPortraitChange={() => refreshSheet(selectedId!)}
            />

            <div className="grid grid-cols-3 gap-6 mt-6">
              <HungerMeter hunger={sheet.hunger ?? 0} />
              <BloodPoolBar
                current={sheet.blood?.current ?? 0}
                max={sheet.blood?.max ?? 10}
              />
              <WillpowerTracker
                current={sheet.willpower?.current ?? 0}
                superficial={sheet.willpower?.superficial ?? 0}
                aggravated={sheet.willpower?.aggravated ?? 0}
              />
            </div>

            <HumanityTracker
              humanity={sheet.humanity ?? 7}
              stains={sheet.stains ?? 0}
            />

            <ResonanceDyscrasia
              resonance={sheet.resonance}
              dyscrasia={sheet.dyscrasia}
            />

            <ClanBanePanel
              clan={sheet.clan}
              severity={sheet.bane_severity ?? 1}
            />

            <CompulsionPanel compulsions={sheet.compulsions ?? []} />

            <V5Attributes attributes={sheet.attributes} />
            <V5Skills skills={sheet.skills} />
          </>
        )}

        {sheet && !editSheet && page === 2 && (
          <>
            <DisciplinesPanel disciplines={sheet.disciplines ?? []} />
            <MeritsFlawsPanel
              merits={sheet.merits ?? []}
              flaws={sheet.flaws ?? []}
            />
            <TouchstonesPanel
              convictions={sheet.convictions ?? []}
              touchstones={sheet.touchstones ?? []}
            />
            <RitualsPanel rituals={sheet.rituals ?? []} />
            <XpSpendPanel characterId={selectedId} sheet={sheet} />
          </>
        )}

        {/* ---------- EDIT MODE ---------- */}
        {editSheet && (
          <>
            <V5SheetEditor sheet={editSheet} onChange={setEditSheet} />

            <div className="mt-4 flex gap-3">
              <button
                onClick={async () => {
                  await updateCharacterSheet(selectedId, editSheet);
                  setSheet(editSheet);
                  setEditSheet(null);
                }}
                className="px-4 py-2 rounded bg-blood-crimson hover:bg-blood-red"
              >
                Save
              </button>

              <button
                onClick={() => setEditSheet(null)}
                className="px-4 py-2 rounded bg-blood-dark border border-blood-red/40"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
