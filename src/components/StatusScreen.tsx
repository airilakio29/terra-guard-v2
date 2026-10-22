import React, { useState } from 'react';
import {
  MapPin,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  MessageSquareQuote,
  Flame,
  ChevronRight,
  Compass,
  LocateFixed,
  Wind,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LiveWeatherCard } from './LiveWeatherCard';

export const StatusScreen: React.FC = () => {
  const {
    language,
    currentScenario,
    isRefreshing,
    refreshFeeds,
    setActiveTab,
    setSelectedShelter,
    t,
    askAssistantDirectly,
    weather,
    locating,
    isGpsLocked,
    locateMe,
    searchLocation
  } = useApp();

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const isSafe = currentScenario.riskLevel === 'safe';
  const isAdvisory = currentScenario.riskLevel === 'advisory';
  const isDanger = currentScenario.riskLevel === 'danger';
  const bm = language === 'bm';

  const nearestShelter =
    currentScenario.shelters.find(s => s.id === currentScenario.nearestShelterId) ||
    currentScenario.shelters[0];

  const handlePrimaryAction = () => {
    setSelectedShelter(nearestShelter);
    setActiveTab('map');
  };

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
    <div className="screen-scroll-container">
      {/* Unified Location & Live GPS Strip */}
      <div className="location-strip" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="location-strip__info" style={{ minWidth: 0 }}>
          <MapPin size={18} className="location-strip__pin" />
          <div key={`${currentScenario.locationName}-${language}`} className="cross-fade-text" style={{ minWidth: 0 }}>
            <div className="location-strip__name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>{currentScenario.locationName}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: isGpsLocked ? 'var(--safe-bg)' : 'var(--brand-surface)',
                  color: isGpsLocked ? 'var(--safe-text)' : 'var(--brand-primary)',
                  border: `1px solid ${isGpsLocked ? 'var(--safe-border)' : 'var(--brand-border)'}`
                }}
              >
                {isGpsLocked ? (bm ? '📡 GPS Aktif' : '📡 Live GPS') : (bm ? '📍 Lalai' : '📍 Default')}
              </span>
            </div>
            <div className="location-strip__area">
              {currentScenario.locationArea} · {currentScenario.lat.toFixed(4)}°N, {currentScenario.lon.toFixed(4)}°E
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: showSearch ? '100%' : 'auto' }}>
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={bm ? 'Cari bandar (cth: Shah Alam, Kuantan)...' : 'Enter city/town (e.g. Shah Alam, Kuantan)...'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--brand-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                autoFocus
              />
              <button
                type="submit"
                className="location-strip__refresh"
                disabled={locating}
                style={{
                  background: 'var(--brand-primary)',
                  color: 'var(--on-vivid)',
                  borderColor: 'var(--brand-primary)',
                  fontWeight: 700
                }}
              >
                {bm ? 'Semak' : 'Check'}
              </button>
              <button
                type="button"
                className="location-strip__refresh"
                onClick={() => setShowSearch(false)}
              >
                ✕
              </button>
            </form>
          ) : (
            <>
              <button
                className="location-strip__refresh"
                onClick={locateMe}
                disabled={locating}
                style={{
                  background: 'var(--brand-primary)',
                  color: 'var(--on-vivid)',
                  borderColor: 'var(--brand-primary)',
                  fontWeight: 700
                }}
                title={bm ? 'Imbas lokasi GPS sebenar anda' : 'Scan your real-time GPS location'}
              >
                <LocateFixed size={13} className={locating ? 'spin-icon' : ''} />
                <span>
                  {locating
                    ? bm
                      ? 'Mengimbas…'
                      : 'Scanning…'
                    : bm
                      ? 'Imbas Lokasi Saya'
                      : 'Scan My Location'}
                </span>
              </button>

              <button
                className="location-strip__refresh"
                onClick={() => setShowSearch(true)}
                title={bm ? 'Semak bandar lain di Malaysia' : 'Check another town in Malaysia'}
              >
                <Search size={12} />
                <span>{bm ? 'Cari Kawasan' : 'Check Area'}</span>
              </button>

              <button
                className="location-strip__refresh"
                onClick={refreshFeeds}
                disabled={isRefreshing}
                title={t.pullToRefresh}
              >
                <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
                <span>
                  {isRefreshing
                    ? t.refreshing
                    : weather
                      ? `${bm ? 'Dikemas kini' : 'Updated'} ${new Date(weather.fetchedAt).toLocaleTimeString(bm ? 'ms-MY' : 'en-MY', { hour: 'numeric', minute: '2-digit' })}`
                      : t.updatedAgo}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Responsive Dashboard Grid (Single column in Mobile View, 2 columns in Dashboard/Full View) */}
      <div className="dashboard-grid">
        {/* Left Column: Status Card + Primary Action + Mini Map Snapshot */}
        <div className="dashboard-column">
          {/* 1. Main Real-Life Risk Status Card */}
          <div className={`status-card status-card--${currentScenario.riskLevel}`}>
            <div key={`${currentScenario.id}-${currentScenario.locationName}-${language}`} className="cross-fade-text">
              <div className="status-card__header">
                <div className="status-card__icon-badge">
                  {isSafe && <CheckCircle2 size={24} />}
                  {isAdvisory && <AlertTriangle size={24} />}
                  {isDanger && <AlertOctagon size={24} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span className="status-card__badge-pill" style={{ marginBottom: 0 }}>
                      {isSafe
                        ? bm
                          ? 'HARI BIASA • SELAMAT'
                          : 'NORMAL DAY • ALL CLEAR'
                        : isAdvisory
                          ? bm
                            ? 'AMARAN AWAL (CUACA / JEREBU)'
                            : 'ADVISORY WATCH'
                          : bm
                            ? 'BAHAYA KRITIKAL'
                            : 'CRITICAL DANGER'}
                    </span>
                    {weather && (
                      <span
                        className="status-card__badge-pill"
                        style={{
                          marginBottom: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Wind size={11} />
                        <span>IPU {weather.ipuIndex}</span>
                      </span>
                    )}
                  </div>
                  <h1 className="status-card__headline">
                    {bm ? currentScenario.headlineBm : currentScenario.headlineEn}
                  </h1>
                </div>
              </div>

              <p className="status-card__directive">
                {bm ? currentScenario.directiveBm : currentScenario.directiveEn}
              </p>

              <div className="status-card__summary">
                <strong>{bm ? 'Laporan Telemetri Semasa: ' : 'Live Telemetry SITREP: '}</strong>
                {bm ? currentScenario.hazardSummaryBm : currentScenario.hazardSummaryEn}
              </div>
            </div>
          </div>

          {/* 2. Primary Action CTA Card (Thumb-Reachable) */}
          <div
            className="primary-action-card"
            onClick={handlePrimaryAction}
            role="button"
            tabIndex={0}
          >
            <div key={`${currentScenario.id}-${currentScenario.locationName}-${language}`} className="primary-action-card__content cross-fade-text">
              <div className="primary-action-card__icon">
                {isSafe ? <ShieldCheck size={24} /> : <ArrowRight size={24} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="primary-action-card__title">
                  {bm ? currentScenario.primaryActionBm : currentScenario.primaryActionEn}
                </div>
                <div className="primary-action-card__subtitle">
                  {bm ? currentScenario.primaryActionSubtitleBm : currentScenario.primaryActionSubtitleEn}
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="primary-action-card__arrow" />
          </div>

          {/* 3. Live Spatial Radar Preview Card */}
          <div
            className="section-card"
            style={{ cursor: 'pointer', background: 'var(--bg-surface)' }}
            onClick={() => setActiveTab('map')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <Compass size={16} color="var(--brand-primary)" />
                <span>{bm ? 'Peta Pantas Situasi' : 'Live Situation Radar'}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {bm ? 'Buka Peta Penuh' : 'Open Full Map'} <ChevronRight size={14} />
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                height: '110px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--map-land)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 35" preserveAspectRatio="none">
                <line x1="0" y1="18" x2="100" y2="18" stroke="var(--map-road-secondary)" strokeWidth="1.5" />
                <line x1="30" y1="0" x2="30" y2="35" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
                <line x1="70" y1="0" x2="70" y2="35" stroke="var(--map-road-secondary)" strokeWidth="1.2" />

                {/* River */}
                <path d="M0,8 Q50,15 100,6" fill="none" stroke="var(--map-water)" strokeWidth="4" />

                {/* Hazard zone */}
                {currentScenario.hazards.length > 0 && (
                  <circle cx="55" cy="18" r="8" fill="var(--danger-bg)" stroke="var(--danger-badge)" strokeWidth="0.8" />
                )}

                {/* User Beacon */}
                <circle cx="28" cy="22" r="3" fill="var(--map-user-pin)" stroke="var(--bg-surface)" strokeWidth="1" />

                {/* Nearest Shelter */}
                <circle cx="75" cy="14" r="3.5" fill="var(--map-shelter-pin)" stroke="var(--bg-surface)" strokeWidth="1" />
                <text x="75" y="15.2" textAnchor="middle" fill="var(--on-vivid)" fontSize="2.8" fontWeight="bold">H</text>

                {/* Route */}
                <path d="M 28 22 Q 48 26, 75 14" fill="none" stroke="var(--map-route)" strokeWidth="1" strokeDasharray="2 1" />
              </svg>

              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'var(--bg-surface)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                📍 {bm ? `PPS Terdekat: ${nearestShelter.distanceKm} km` : `Nearest Shelter: ${nearestShelter.distanceKm} km`}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Weather + IPU Haze + Hazards Nearby + AI Quick Guidance + Emergency SOS */}
        <div className="dashboard-column">
          {/* Live Weather & Malaysian IPU Haze Monitor */}
          <LiveWeatherCard />

          {/* 4. Active Hazards OR All-Clear Confirmation */}
          {currentScenario.hazards.length > 0 ? (
            <div className="section-card">
              <div className="section-title">
                <Flame size={16} color="var(--danger-accent)" />
                <span>{t.hazardsNearbyTitle} ({currentScenario.hazards.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentScenario.hazards.map(h => (
                  <div
                    key={h.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      borderLeft: `4px solid ${h.severity === 'danger' ? 'var(--danger-accent)' : 'var(--advisory-accent)'}`
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {bm ? h.titleBm : h.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {bm ? h.descriptionBm : h.descriptionEn}
                    </div>
                    {h.waterDepthMeters && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-accent)', marginTop: '4px' }}>
                        ⚠️ {t.waterDepth}: ~{h.waterDepthMeters}m
                      </div>
                    )}
                    {h.ipuValue && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--advisory-accent)', marginTop: '4px' }}>
                        🌫️ {bm ? 'Bacaan IPU Semasa' : 'Live IPU Reading'}: {h.ipuValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="section-card"
              style={{
                background: 'var(--safe-bg)',
                borderColor: 'var(--safe-border)',
                color: 'var(--safe-text)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px' }}>
                <CheckCircle2 size={17} />
                <span>
                  {bm
                    ? 'Tiada Bahaya Banjir, Ribut atau Jerebu Dikesan'
                    : 'No Active Flood, Storm, or Haze Hazards Detected'}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                {bm
                  ? `Semua penunjuk cuaca, paras sungai, dan IPU jerebu (${weather ? `IPU ${weather.ipuIndex}` : 'Normal'}) berada pada paras selamat di sekitar ${currentScenario.locationName}.`
                  : `All rainfall, river basin, and Malaysian IPU haze indicators (${weather ? `IPU ${weather.ipuIndex}` : 'Normal'}) are within safe normal-day thresholds around ${currentScenario.locationName}.`}
              </div>
            </div>
          )}

          {/* 5. 1-Tap AI Safety Guidance Chips */}
          <div className="section-card">
            <div className="section-title">
              <MessageSquareQuote size={16} color="var(--brand-primary)" />
              <span>{t.quickQuestionsTitle}</span>
            </div>
            <div className="chips-container">
              <button
                className="chip-button"
                onClick={() => askAssistantDirectly('pack')}
              >
                <span>🎒 {t.chipPack}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                className="chip-button"
                onClick={() => askAssistantDirectly('drive')}
              >
                <span>🚗 {t.chipDrive}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                className="chip-button"
                onClick={() => askAssistantDirectly('power')}
              >
                <span>⚡ {t.chipPower}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                className="chip-button"
                onClick={() => askAssistantDirectly('trapped')}
              >
                <span>🏠 {t.chipTrapped}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          </div>

          {/* 6. Emergency SOS Direct Call Strip */}
          <div
            className="sos-banner-strip"
            onClick={() => setActiveTab('sos')}
            role="button"
            tabIndex={0}
          >
            <div className="sos-banner-strip__text">
              <div className="sos-banner-strip__title">
                <PhoneCall size={18} />
                <span>{t.sosDirectBanner}</span>
              </div>
              <div className="sos-banner-strip__subtitle">
                {t.sosSubtext}
              </div>
            </div>
            <button className="sos-banner-strip__btn">
              {t.callNow} (999)
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '2px 0 10px' }}>
            {t.emergencyDisclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
