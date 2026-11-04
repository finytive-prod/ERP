import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPostgresSync } from './services/erpStorage';

// Sync with local PostgreSQL database on startup before initial render
initPostgresSync().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
