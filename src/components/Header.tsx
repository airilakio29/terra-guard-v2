import React from 'react';
import { ShieldAlert, Volume2, VolumeX, Sparkles, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    scenario, 
    setScenario, 
    soundEnabled, 
    toggleSound, 
    t 
  } = useApp();
  const { logout } = useAuth();

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__brand">
          <div className="top-bar__icon">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="top-bar__title">{t.appTitle}</div>
            <div className="top-bar__subtitle">{t.appSubtitle}</div>
          </div>
        </div>

        <div className="top-bar__actions">
          <button 
            className="lang-btn" 
            onClick={toggleSound}
            title={soundEnabled ? t.soundOn : t.soundOff}
            style={{ padding: '6px' }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} color="#94A3B8" />}
          </button>

          <div className="lang-toggle">
            <button 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === 'bm' ? 'active' : ''}`}
              onClick={() => setLanguage('bm')}
            >
              BM
            </button>
          </div>

          <button
            className="lang-btn"
            onClick={() => void logout()}
            title="Log Out"
            style={{ padding: '6px', marginLeft: '4px' }}
            aria-label="Log Out"
          >
            <LogOut size={16} color="#F87171" />
          </button>
        </div>
      </header>

      {/* Demo Scenario Selector Strip for Evaluators */}
      <div className="scenario-selector-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="#38BDF8" />
          <span>{t.demoScenario}:</span>
        </div>
        <div className="scenario-pill-group">
          <button 
            className={`scenario-pill ${scenario === 'advisory' ? 'active' : ''}`}
            onClick={() => setScenario('advisory')}
          >
            {t.scenarioAdvisory}
          </button>
          <button 
            className={`scenario-pill ${scenario === 'danger' ? 'active' : ''}`}
            onClick={() => setScenario('danger')}
          >
            {t.scenarioDanger}
          </button>
          <button 
            className={`scenario-pill ${scenario === 'safe' ? 'active' : ''}`}
            onClick={() => setScenario('safe')}
          >
            {t.scenarioSafe}
          </button>
        </div>
      </div>
    </>
  );
};
