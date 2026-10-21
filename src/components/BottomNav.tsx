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
      <button 
        className={`nav-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
        onClick={() => setActiveTab('status')}
      >
        <div className="nav-tab-icon">
          <ShieldAlert size={22} />
        </div>
        <span>{t.navStatus}</span>
      </button>

      <button 
        className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <div className="nav-tab-icon">
          <MapPin size={22} />
        </div>
        <span>{t.navMap}</span>
      </button>

      <button 
        className={`nav-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
        onClick={() => setActiveTab('assistant')}
      >
        <div className="nav-tab-icon">
          <Bot size={22} />
        </div>
        <span>{t.navAssist}</span>
      </button>

      <button 
        className={`nav-tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
        onClick={() => setActiveTab('sos')}
        style={{ color: activeTab === 'sos' ? 'var(--danger-accent)' : undefined }}
      >
        <div className="nav-tab-icon">
          <PhoneCall size={22} />
        </div>
        <span style={{ color: activeTab === 'sos' ? 'var(--danger-accent)' : undefined }}>{t.navSos}</span>
      </button>

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
