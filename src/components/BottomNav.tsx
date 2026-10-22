import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Bot,
  PhoneCall,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  return (
    <nav className="bottom-nav">
      {/* 1. Status */}
      <button
        className={`nav-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
        onClick={() => setActiveTab('status')}
      >
        <div className="nav-tab-icon">
          <ShieldAlert size={22} />
        </div>
        <span>{t.navStatus}</span>
      </button>

      {/* 2. Live Map */}
      <button
        className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <div className="nav-tab-icon">
          <MapPin size={22} />
        </div>
        <span>{t.navMap}</span>
      </button>

      {/* 3. CENTER HERO BUTTON: SOS & Kit (Red, Larger, Elevated in Middle) */}
      <button
        className={`nav-tab-btn nav-tab-btn--sos-center ${activeTab === 'sos' ? 'active' : ''}`}
        onClick={() => setActiveTab('sos')}
      >
        <div className="nav-tab-icon nav-tab-icon--sos">
          <PhoneCall size={22} />
        </div>
        <span>{t.navSos}</span>
      </button>

      {/* 4. Safety AI */}
      <button
        className={`nav-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
        onClick={() => setActiveTab('assistant')}
      >
        <div className="nav-tab-icon">
          <Bot size={22} />
        </div>
        <span>{t.navAssist}</span>
      </button>

      {/* 5. Settings */}
      <button
        className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <div className="nav-tab-icon">
          <Settings size={22} />
        </div>
        <span>{t.navSettings}</span>
      </button>
    </nav>
  );
};
