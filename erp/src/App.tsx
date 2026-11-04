import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider, ErrorBoundary } from './components/ui';
import { AppRoutes } from './routes/AppRoutes';
import './theme/tokens.css';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
