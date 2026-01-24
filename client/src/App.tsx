import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import WorldDashboard from './components/WorldDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AppealPage from './components/AppealPage';
import WorldView from './components/world/WorldView';
import AppShell from './components/layout/AppShell';

import { fetchMe, fetchWorld } from './api';
import { clearToken, saveToken } from './auth';
import type { SessionInfo, WorldState } from './types';

import FrenzyOverlay from './ui/overlays/FrenzyOverlay';
import MessyCriticalFlash from './ui/overlays/MessyCriticalFlash';
import BestialFailurePulse from './ui/overlays/BestialFailurePulse';
import BloodSurgeGlow from './ui/overlays/BloodSurgeGlow';

import STOverridePanel from './components/st/STOverridePanel';

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchMe();
        if (!me.authenticated) {
          clearToken();
        }
        setSession(me);

        if (me.authenticated) {
          const w = await fetchWorld();
          if (w) setWorld(w as WorldState);
        }
      } catch (e) {
        clearToken();
        setSession({ authenticated: false });
      }
    })();
  }, []);

  const handleLogin = async (input: { token: string; user: SessionInfo }) => {
    saveToken(input.token);
    setSession(input.user);

    if (input.user.authenticated) {
      try {
        const w = await fetchWorld();
        if (w) setWorld(w as WorldState);
      } catch (error) {
        setWorld(null);
      }
    }
  };

  if (!session || !session.authenticated) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  const currentSession = session!;
  const currentWorld = world;

  const isOwner = currentSession.role === 'owner';
  const isST = currentSession.role === 'st' || isOwner;
  const engineId = currentSession.engine_id || currentSession.engineId || '';

  if (currentWorld?.engine?.banned && !isOwner) {
    return <AppealPage />;
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<WorldView />} />
        </Routes>

        {isOwner ? (
          <>
            <OwnerDashboard />
            <WorldDashboard world={currentWorld} session={currentSession} />
          </>
        ) : (
          <WorldDashboard world={currentWorld} session={currentSession} />
        )}

        <FrenzyOverlay />
        <MessyCriticalFlash />
        <BestialFailurePulse />
        <BloodSurgeGlow />

        {isST && engineId && (
          <STOverridePanel engineId={engineId} />
        )}
      </AppShell>
    </BrowserRouter>
  );
}
