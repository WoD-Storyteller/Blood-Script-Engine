import { getRealtime } from './index';
import { useUIState } from '../state/uiState';

export function registerSTOverrides() {
  const socket = getRealtime();
  if (!socket) return;

  const ui = useUIState.getState();

  socket.on('st_override_event', (data) => {
    switch (data.event) {
      case 'frenzy':
        ui.triggerFrenzy();
        break;

      case 'messy_critical':
        ui.triggerMessyCritical();
        break;

      case 'bestial_failure':
        ui.triggerBestialFailure();
        break;

      case 'blood_surge':
        ui.triggerBloodSurge();
        break;

      case 'humanity_degeneration':
        ui.triggerBestialFailure();
        break;
    }
  });
}
