import React from 'react';
import { ShieldAlert, Volume2, VolumeX, Sparkles, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './PresetAvatars';

export const Header: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    scenario, 
    setScenario, 
    soundEnabled, 
    toggleSound, 
    t,
    avatarUrl,
    displayName,
    setActiveTab
  } = useApp();
  const { logout } = useAuth();

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__brand">
          <div className="top-bar__icon">
            <ShieldAlert size={20} />
          </div>
          <div key={language} className="cross-fade-text">
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
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} color="var(--text-muted)" />}
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
            className="top-bar-avatar-btn"
            onClick={() => setActiveTab('settings')}
            title={t.settingsTitle}
            aria-label={t.settingsTitle}
          >
            <AvatarDisplay avatarUrl={avatarUrl} name={displayName} size={28} />
          </button>

          <button
            className="lang-btn"
            onClick={() => void logout()}
            title="Log Out"
            style={{ padding: '6px', marginLeft: '4px' }}
            aria-label="Log Out"
          >
            <LogOut size={16} color="var(--danger-accent)" />
          </button>
        </div>
      </header>

      {/* Demo Scenario Selector Strip for Evaluators */}
      <div className="scenario-selector-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="var(--brand-accent)" />
          <span key={language} className="cross-fade-text">{t.demoScenario}:</span>
        </div>
        <div key={language} className="scenario-pill-group cross-fade-text">
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
