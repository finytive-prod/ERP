import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container offset by sidebar on desktop */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100vh',
          transition: 'margin-left var(--transition-normal)',
        }}
        className="app-main-container"
      >
        <style>{`
          @media (min-width: 1024px) {
            .app-main-container {
              margin-left: var(--sidebar-width) !important;
            }
          }
          @media (max-width: 1023px) {
            .app-main-content {
              padding-bottom: calc(var(--bottomnav-height) + 20px) !important;
            }
          }
        `}</style>

        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main
          className="app-main-content"
          style={{
            flex: 1,
            padding: 'var(--space-6)',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </main>

        <BottomNav onOpenMore={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};
