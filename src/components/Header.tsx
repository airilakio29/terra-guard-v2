import React from 'react';
import { Volume2, VolumeX, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './PresetAvatars';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    soundEnabled,
    toggleSound,
    t,
    avatarUrl,
    displayName,
    setActiveTab
  } = useApp();
  const { logout } = useAuth();

  return (
    <header className="top-bar">
      <div className="top-bar__brand">
        <Logo size={28} variant="header" />
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
  );
};
