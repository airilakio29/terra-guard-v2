import React, { useState } from 'react';
import { ShieldAlert, Volume2, VolumeX, LogOut, LocateFixed, Search, Wind, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from './PresetAvatars';
import { getIpuMeta } from '../services/weather';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    currentScenario,
    weather,
    locating,
    isGpsLocked,
    locateMe,
    searchLocation,
    soundEnabled,
    toggleSound,
    t,
    avatarUrl,
    displayName,
    setActiveTab
  } = useApp();
  const { logout } = useAuth();

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const bm = language === 'bm';
  const risk = currentScenario.riskLevel;
  const ipuMeta = weather ? getIpuMeta(weather.ipuCategory, bm) : null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const ok = await searchLocation(query);
    if (ok) {
      setQuery('');
      setShowSearch(false);
    }
  };

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

      {/* Real-Time Live Location & Multi-Hazard Scanner Bar (Replaces Demo Bar) */}
      <div className="scenario-selector-bar" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 800,
              background:
                risk === 'safe'
                  ? 'var(--safe-bg)'
                  : risk === 'advisory'
                    ? 'var(--advisory-bg)'
                    : 'var(--danger-bg)',
              color:
                risk === 'safe'
                  ? 'var(--safe-text)'
                  : risk === 'advisory'
                    ? 'var(--advisory-text)'
                    : 'var(--danger-text)',
              border: `1px solid ${
                risk === 'safe'
                  ? 'var(--safe-border)'
                  : risk === 'advisory'
                    ? 'var(--advisory-border)'
                    : 'var(--danger-border)'
              }`
            }}
          >
            {risk === 'safe' && <CheckCircle2 size={12} />}
            {risk === 'advisory' && <AlertTriangle size={12} />}
            {risk === 'danger' && <AlertOctagon size={12} />}
            <span>
              {risk === 'safe'
                ? bm
                  ? 'HARI BIASA • SELAMAT'
                  : 'NORMAL DAY • SAFE'
                : risk === 'advisory'
                  ? bm
                    ? 'AMARAN CUACA / JEREBU'
                    : 'ADVISORY WATCH'
                  : bm
                    ? 'BAHAYA KRITIKAL'
                    : 'CRITICAL DANGER'}
            </span>
          </span>

          {weather && ipuMeta && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                background: ipuMeta.bg,
                color: ipuMeta.color,
                border: `1px solid ${ipuMeta.border}`
              }}
              title={ipuMeta.advice}
            >
              <Wind size={12} />
              <span>
                IPU {weather.ipuIndex} · {ipuMeta.label}
              </span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={bm ? 'Cari bandar (cth: Shah Alam, Kuantan)...' : 'Enter city/town (e.g. Shah Alam, Kuantan)...'}
                style={{
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--brand-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '210px'
                }}
                autoFocus
              />
              <button type="submit" className="scenario-pill active" disabled={locating}>
                {bm ? 'Semak' : 'Check'}
              </button>
              <button
                type="button"
                className="scenario-pill"
                onClick={() => setShowSearch(false)}
              >
                ✕
              </button>
            </form>
          ) : (
            <>
              <button
                className="scenario-pill"
                onClick={() => setShowSearch(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title={bm ? 'Cari lokasi lain di Malaysia' : 'Check another location in Malaysia'}
              >
                <Search size={12} />
                <span>{bm ? 'Cari Kawasan' : 'Check Area'}</span>
              </button>

              <button
                className="scenario-pill active"
                onClick={locateMe}
                disabled={locating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px'
                }}
              >
                <LocateFixed size={12} className={locating ? 'spin-icon' : ''} />
                <span>
                  {locating
                    ? bm
                      ? 'Mengimbas GPS…'
                      : 'Scanning GPS…'
                    : isGpsLocked
                      ? bm
                        ? 'Imbas Semula Lokasi Saya'
                        : 'Scan My Live Location'
                      : bm
                        ? 'Guna Lokasi Langsung Saya'
                        : 'Use My Live Location'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
