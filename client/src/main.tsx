import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { connectRealtime } from './realtime';
import { registerSTOverrides } from './realtime/StOverrideListener';

connectRealtime();
registerSTOverrides();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
