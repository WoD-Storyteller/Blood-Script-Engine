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

import FrenzyOverlay from './ui/overlays/FrenzyOverlay';
import MessyCriticalFlash from './ui/overlays/MessyCriticalFlash';
import BestialFailurePulse from './ui/overlays/BestialFailurePulse';
import BloodSurgeGlow from './ui/overlays/BloodSurgeGlow';

import STOverridePanel from './components/st/STOverridePanel';

const DEMO_SESSION: SessionInfo = {
  authenticated: true,
  user_id: 'demo-user',
  discord_user_id: '123456789',
  username: 'Demo Player',
  engine_id: 'demo-engine',
  role: 'st',
};

const DEMO_WORLD: WorldState = {
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0!2d-122.4!3d37.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ2JzQ4LjAiTiAxMjLCsDI0JzAwLjAiVw!5e0!3m2!1sen!2sus!4v1234567890',
  arcs: [
    { arc_id: '1', title: 'The Prince\'s Gambit', description: 'Political intrigue at the highest levels of Kindred society', status: 'active' },
    { arc_id: '2', title: 'Shadows of the Past', description: 'Ancient secrets resurface to haunt the coterie', status: 'active' },
  ],
  clocks: [
    { clock_id: '1', title: 'SI Investigation', segments: 6, filled: 2, description: 'Second Inquisition closing in' },
    { clock_id: '2', title: 'Blood Hunt', segments: 4, filled: 1, description: 'Time before the hunt is called' },
    { clock_id: '3', title: 'Masquerade Breach', segments: 8, filled: 5, description: 'City-wide masquerade stability' },
  ],
  pressure: [
    { type: 'si', level: 3, label: 'Second Inquisition' },
    { type: 'masquerade', level: 2, label: 'Masquerade' },
  ],
  engine: {
    engine_id: 'demo-engine',
    name: 'Demo Chronicle',
    banned: false,
  },
};

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (demoMode) return;
    
    (async () => {
      try {
        const me = await fetchMe();
        setSession(me);

        if (me.authenticated) {
          const w = await fetchWorld();
          if (w) setWorld(w as WorldState);
        }
      } catch (e) {
        setSession({ authenticated: false });
      }
    })();
  }, [demoMode]);

  const enterDemoMode = () => {
    setDemoMode(true);
    setSession(DEMO_SESSION);
    setWorld(DEMO_WORLD);
  };

  const exitDemoMode = () => {
    setDemoMode(false);
    setSession(null);
    setWorld(null);
  };

  if (!demoMode && (!session || !session.authenticated)) {
    return <Login onDemoMode={enterDemoMode} />;
  }

  const currentSession = demoMode ? DEMO_SESSION : session!;
  const currentWorld = demoMode ? DEMO_WORLD : world;

  const isOwner = currentSession.role === 'owner';
  const isST = currentSession.role === 'st' || isOwner;
  const engineId = currentSession.engine_id || currentSession.engineId || '';

  if (currentWorld?.engine?.banned && !isOwner) {
    return <AppealPage />;
  }

  return (
    <BrowserRouter>
      <AppShell>
        {demoMode && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #c41e3a, #8b0000)',
            color: '#fff',
            padding: '8px 16px',
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1001,
          }}>
            <span>Demo Mode - Preview with sample data</span>
            <button 
              onClick={exitDemoMode}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Exit Demo
            </button>
          </div>
        )}

        <div style={{ paddingTop: demoMode ? 40 : 0 }}>
          <Routes>
            <Route path="/" element={<WorldView />} />
          </Routes>

          {isOwner ? (
            <OwnerDashboard />
          ) : (
            <WorldDashboard world={currentWorld} session={currentSession} />
          )}

          <FrenzyOverlay />
          <MessyCriticalFlash />
          <BestialFailurePulse />
          <BloodSurgeGlow />

          {isST && engineId && !demoMode && (
            <STOverridePanel engineId={engineId} />
          )}
        </div>
      </AppShell>
    </BrowserRouter>
  );
}
