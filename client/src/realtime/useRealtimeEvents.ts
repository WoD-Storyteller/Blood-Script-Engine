import { useEffect } from 'react';
import { getRealtime } from './index';
import { useUIState } from '../state/uiState';

export function useRealtimeEvents(characterId?: string) {
  const ui = useUIState();

  useEffect(() => {
    const socket = getRealtime();
    if (!socket) return;

    socket.on('frenzy', (p) => {
      if (!characterId || p.characterId === characterId) {
        ui.triggerFrenzy();
      }
    });

    socket.on('messy_critical', (p) => {
      if (!characterId || p.characterId === characterId) {
        ui.triggerMessyCritical();
      }
    });

    socket.on('bestial_failure', (p) => {
      if (!characterId || p.characterId === characterId) {
        ui.triggerBestialFailure();
      }
    });

    socket.on('blood_surge', (p) => {
      if (!characterId || p.characterId === characterId) {
        ui.triggerBloodSurge();
      }
    });

    return () => {
      socket.off('frenzy');
      socket.off('messy_critical');
      socket.off('bestial_failure');
      socket.off('blood_surge');
    };
  }, [characterId]);
}
