import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import WorldDashboard from './components/WorldDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AppealPage from './components/AppealPage';
import WorldView from './components/world/WorldView';
import AppShell from './components/layout/AppShell';

import { fetchMe, fetchWorld } from './api';
import type { SessionInfo, WorldState } from './types';

// UI Overlays
import FrenzyOverlay from './ui/overlays/FrenzyOverlay';
import MessyCriticalFlash from './ui/overlays/MessyCriticalFlash';
import BestialFailurePulse from './ui/overlays/BestialFailurePulse';
import BloodSurgeGlow from './ui/overlays/BloodSurgeGlow';

// ST / Owner tools
import STOverridePanel from './components/st/STOverridePanel';

const OWNER_ID = import.meta.env.VITE_BOT_OWNER_DISCORD_ID;

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);

  useEffect(() => {
    (async () => {
      const me = await fetchMe();
      setSession(me);

      const w = await fetchWorld();
      setWorld(w);
    })();
  }, []);

  if (!session) {
    return <Login />;
  }

  const isOwner = session.discord_user_id === OWNER_ID;

  if (world?.engine?.banned && !isOwner) {
    return <AppealPage />;
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<WorldView />} />
          {/* Routes can be expanded later */}
        </Routes>

        {/* Dashboards */}
        {isOwner ? (
          <OwnerDashboard />
        ) : (
          <WorldDashboard world={world} session={session} />
        )}

        {/* UI EFFECT OVERLAYS */}
        <FrenzyOverlay />
        <MessyCriticalFlash />
        <BestialFailurePulse />
        <BloodSurgeGlow />

        {/* ST / OWNER CONTROLS */}
        {isOwner && (
          <STOverridePanel
            engineId={session.engine_id}
          />
        )}
      </AppShell>
    </BrowserRouter>
  );
}
