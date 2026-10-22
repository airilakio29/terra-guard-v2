import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Bot,
  PhoneCall,
  Settings
} from 'lucide-react';
import { useApp, type AppTab } from '../context/AppContext';

const TAB_ORDER: AppTab[] = ['status', 'map', 'sos', 'assistant', 'settings'];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();
  const activeIdx = Math.max(0, TAB_ORDER.indexOf(activeTab));

  return (
    <nav
      className="bottom-nav"
      style={{ '--active-tab-index': activeIdx } as React.CSSProperties}
      aria-label="Primary Emergency Navigation"
    >
      {/* 1. Status */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
        onClick={() => setActiveTab('status')}
        aria-current={activeTab === 'status' ? 'page' : undefined}
      >
        <div className="nav-tab-icon">
          <ShieldAlert size={20} />
        </div>
        <span>{t.navStatus}</span>
      </button>

      {/* 2. Live Map */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
        aria-current={activeTab === 'map' ? 'page' : undefined}
      >
        <div className="nav-tab-icon">
          <MapPin size={20} />
        </div>
        <span>{t.navMap}</span>
      </button>

      {/* 3. CENTER HERO BUTTON: SOS & Kit (Red, Tactile Elevated in Middle) */}
      <button
        type="button"
        className={`nav-tab-btn nav-tab-btn--sos-center ${activeTab === 'sos' ? 'active' : ''}`}
        onClick={() => setActiveTab('sos')}
        aria-current={activeTab === 'sos' ? 'page' : undefined}
      >
        <div className="nav-tab-icon nav-tab-icon--sos">
          <PhoneCall size={20} />
        </div>
        <span>{t.navSos}</span>
      </button>

      {/* 4. Safety AI */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
        onClick={() => setActiveTab('assistant')}
        aria-current={activeTab === 'assistant' ? 'page' : undefined}
      >
        <div className="nav-tab-icon">
          <Bot size={20} />
        </div>
        <span>{t.navAssist}</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
        aria-current={activeTab === 'settings' ? 'page' : undefined}
      >
        <div className="nav-tab-icon">
          <Settings size={20} />
        </div>
        <span>{t.navSettings}</span>
      </button>
    </nav>
  );
};
