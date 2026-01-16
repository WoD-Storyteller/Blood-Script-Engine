import { useEffect, useState } from 'react';
import { fetchIsModerator } from '../api/moderators';
import type { SessionInfo, WorldState } from '../types';
import NavTabs from './NavTabs';
import MapView from './MapView';
import ArcList from './ArcList';
import ClockList from './ClockList';
import PressurePanel from './PressurePanel';
import DiceRoller from './DiceRoller';
import CharactersPage from './CharactersPage';
import CoteriesPage from './CoteriesPage';
import AdminPage from './AdminPage';
import XpApprovalPanel from './XpApprovalPanel';
import SafetyButton from './SafetyButton';

type TabKey = 'world' | 'characters' | 'coteries' | 'admin';

export default function WorldDashboard({
  world,
  session,
}: {
  world: WorldState | null;
  session: SessionInfo;
}) {
  const [worldState, setWorldState] = useState<WorldState | null>(world);
  const [isModerator, setIsModerator] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [tab, setTab] = useState<TabKey>('world');

  const isStOrAdmin = session.role === 'st' || session.role === 'admin';

  useEffect(() => {
    setWorldState(world);
  }, [world]);

  useEffect(() => {
    let mounted = true;

    async function checkModerator() {
      if (!session?.engine_id || !session?.user_id) {
        if (mounted) {
          setIsModerator(false);
          setLoadingAdmin(false);
        }
        return;
      }

      if (isStOrAdmin) {
        if (mounted) {
          setIsModerator(true);
          setLoadingAdmin(false);
        }
        return;
      }

      try {
        const result = await fetchIsModerator(
          session.engine_id,
          session.user_id,
        );

        if (mounted) {
          setIsModerator(Boolean(result));
        }
      } catch {
        if (mounted) {
          setIsModerator(false);
        }
      } finally {
        if (mounted) {
          setLoadingAdmin(false);
        }
      }
    }

    checkModerator();

    return () => {
      mounted = false;
    };
  }, [session, isStOrAdmin]);

  const showAdmin = !loadingAdmin && (isStOrAdmin || isModerator);

  useEffect(() => {
    if (!showAdmin && tab === 'admin') {
      setTab('world');
    }
  }, [showAdmin, tab]);

  if (!worldState) {
    return <div style={{ padding: 24 }}>Loading world...</div>;
  }

  return (
    <div className="world-dashboard" style={{ padding: 24 }}>
      <NavTabs tab={tab} onChange={setTab} showAdmin={showAdmin} />

      {tab === 'world' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <MapView mapUrl={worldState.mapUrl ?? undefined} />
          <ArcList arcs={worldState.arcs ?? []} />
          <ClockList clocks={worldState.clocks ?? []} />
          <PressurePanel pressure={worldState.pressure ?? []} />
          <DiceRoller />
        </div>
      )}

      {tab === 'characters' && <CharactersPage />}
      {tab === 'coteries' && <CoteriesPage />}

      {tab === 'admin' && showAdmin && (
        <>
          <AdminPage onWorldUpdate={setWorldState} />
          <XpApprovalPanel />
        </>
      )}

      <SafetyButton />
    </div>
  );
}
