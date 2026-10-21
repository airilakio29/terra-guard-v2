import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { StatusScreen } from './components/StatusScreen';
import { MapScreen } from './components/MapScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { SosScreen } from './components/SosScreen';
import { BottomNav } from './components/BottomNav';
import Auth from './components/Auth';
import { Smartphone, LayoutDashboard, Maximize2 } from 'lucide-react';

// ─── Dashboard Layout (authenticated users only) ─────────────────────────────

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  // Default to 'dashboard' (960px) on desktop to prevent any cramped cutoffs!
  const [viewMode, setViewMode] = useState<'mobile' | 'dashboard' | 'full'>('dashboard');

  return (
    <div className="app-outer-shell">
      {/* Desktop View Mode Switcher Toolbar */}
      <div className="desktop-only-bar">
        <span>View Layout:</span>
        <button
          className={`preview-mode-btn ${viewMode === 'mobile' ? 'active' : ''}`}
          onClick={() => setViewMode('mobile')}
        >
          <Smartphone size={13} /> Mobile View (440px)
        </button>
        <button
          className={`preview-mode-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={13} /> Dashboard View (960px)
        </button>
        <button
          className={`preview-mode-btn ${viewMode === 'full' ? 'active' : ''}`}
          onClick={() => setViewMode('full')}
        >
          <Maximize2 size={13} /> Fullscreen (100%)
        </button>
      </div>

      {/* Main App Container */}
      <div className={`app-container app-container--${viewMode}`}>
        <Header />

        {activeTab === 'status' && <StatusScreen />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'assistant' && <AssistantScreen />}
        {activeTab === 'sos' && <SosScreen />}

        <BottomNav />
      </div>
    </div>
  );
};

// ─── Root with auth gating ───────────────────────────────────────────────────

const AppRoot: React.FC = () => {
  const { firebaseUser, isGuest, authLoading } = useAuth();

  // While Firebase resolves the initial auth state, show nothing (or a splash)
  if (authLoading && !isGuest) {
    return (
      <div className="auth-page">
        <div className="auth-loading-splash">
          <div className="auth-logo" style={{ margin: '0 auto 16px' }}>
            🛡️
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading TerraGuard…</p>
        </div>
      </div>
    );
  }

  // Not signed in and not guest → show the Auth page
  if (!firebaseUser && !isGuest) {
    return <Auth />;
  }

  // Signed in or Guest → show the full app
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
