import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { StatusScreen } from './components/StatusScreen';
import { MapScreen } from './components/MapScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { SosScreen } from './components/SosScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { FloatingBackground } from './components/FloatingBackground';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import Auth from './components/Auth';
import { Smartphone, LayoutDashboard, Maximize2 } from 'lucide-react';

// ─── Dashboard Layout (authenticated or guest users) ─────────────────────────

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  // Default to 'dashboard' (960px) on desktop to prevent any cramped cutoffs!
  const [viewMode, setViewMode] = useState<'mobile' | 'dashboard' | 'full'>('dashboard');

  return (
    <div className="app-outer-shell">
      <FloatingBackground />

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

        <div key={activeTab} className="tab-screen-container">
          {activeTab === 'status' && <StatusScreen />}
          {activeTab === 'map' && <MapScreen />}
          {activeTab === 'assistant' && <AssistantScreen />}
          {activeTab === 'sos' && <SosScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

// ─── App Root with Flow & Shared Transitions ─────────────────────────────────

const AppRoot: React.FC = () => {
  const { user, isGuest } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);
  const isAuthenticated = Boolean(user || isGuest);

  return (
    <>
      {/* Pre-mount underlying screen while Splash is active so live telemetry loads with ZERO blank gap */}
      {isAuthenticated ? (
        <div className="screen-transition" key="screen-main">
          <AppProvider>
            <MainLayout />
          </AppProvider>
        </div>
      ) : (
        <div className="screen-transition" key="screen-login">
          <Auth />
        </div>
      )}

      {/* Fullscreen Live Telemetry Splash Overlay */}
      {!splashFinished && (
        <SplashScreen onFinish={() => setSplashFinished(true)} />
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
