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
  // Splash lifecycle: 'visible' -> 'exiting' -> 'unmounted'
  const [splashState, setSplashState] = useState<'visible' | 'exiting' | 'unmounted'>('visible');
  const isAuthenticated = Boolean(user || isGuest);

  const isSplashHidden = splashState === 'visible';
  const showSplash = splashState !== 'unmounted';

  return (
    <AppProvider>
      {/*
        Pre-mount underlying screen while Splash is active.
        While splash is visible, the underlying screen is completely hidden and non-interactive
        (visibility: hidden, opacity: 0, inert attribute) so it cannot paint through or take focus.
        When splash starts leaving, reveal the next screen immediately.
      */}
      <div
        className="screen-transition-wrapper"
        style={{
          visibility: isSplashHidden ? 'hidden' : 'visible',
          opacity: isSplashHidden ? 0 : 1,
          transition: 'opacity 250ms ease-in',
          width: '100%',
          minHeight: '100vh',
        }}
        inert={isSplashHidden ? true : undefined}
      >
        {isAuthenticated ? (
          <div className="screen-transition" key="screen-main">
            <MainLayout />
          </div>
        ) : (
          <div className="screen-transition" key="screen-login">
            <Auth />
          </div>
        )}
      </div>

      {/* Fullscreen Minimal Splash Overlay (highest z-index, fully opaque background) */}
      {showSplash && (
        <SplashScreen
          onStartExit={() => setSplashState('exiting')}
          onFinish={() => setSplashState('unmounted')}
        />
      )}
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
