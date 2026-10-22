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
  Search,
  ChevronDown,
  Radio,
  Navigation,
  X,
  Waves,
  Backpack,
  Car,
  Zap,
  Home
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
  const [isStatusDetailsOpen, setIsStatusDetailsOpen] = useState(false);

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
      {/* ─── 0. Civil Defense Tactical Broadcast Bar (NADMA / METMalaysia) ───── */}
      <div className={`civil-broadcast-bar civil-broadcast-bar--${currentScenario.riskLevel}`}>
        <div className="civil-broadcast-bar__badge">
          <span className="tactical-ping-dot" />
          <span className="tabular-mono">
            {isDanger
              ? (bm ? 'KRITIKAL (CRITICAL)' : 'CRITICAL')
              : isAdvisory
                ? (bm ? 'AMARAN (ADVISORY)' : 'ADVISORY')
                : (bm ? 'SELAMAT (ALL CLEAR)' : 'ALL CLEAR')}
          </span>
        </div>
        <div className="civil-broadcast-bar__ticker">
          <span>
            {isDanger
              ? (bm
                  ? `AMARAN KRITIKAL: ${currentScenario.locationName} — Sila bersedia untuk berpindah ke PPS terdekat (${nearestShelter.nameBm}).`
                  : `CRITICAL ALERT: ${currentScenario.locationName} — Prepare for immediate evacuation to ${nearestShelter.name}.`)
              : isAdvisory
                ? (bm
                    ? `AWAS TELEMETRI: Pantau paras air & bacaan IPU semasa di sekitar ${currentScenario.locationName}.`
                    : `TELEMETRY WATCH: Monitor water levels & air quality index around ${currentScenario.locationName}.`)
                : (bm
                    ? `METMALAYSIA / NADMA: Tiada amaran cuaca buruk aktif di ${currentScenario.locationName}. Semua PPS dalam mod sedia.`
                    : `METMALAYSIA / NADMA: No severe weather warnings active in ${currentScenario.locationName}. All shelters on standby.`)}
          </span>
        </div>
      </div>

      {/* ─── 1. Unified Location & Live GPS Telemetry Strip ──────────────────── */}
      <div className="location-strip" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="location-strip__info" style={{ minWidth: 0 }}>
          <MapPin size={18} className="location-strip__pin" />
          <div key={`${currentScenario.locationName}-${language}`} className="cross-fade-text" style={{ minWidth: 0 }}>
            <div className="location-strip__name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>{currentScenario.locationName}</span>
              <span
                className="tactical-gps-pill"
                style={{
                  background: isGpsLocked ? 'var(--safe-bg)' : 'var(--brand-surface)',
                  color: isGpsLocked ? 'var(--safe-text)' : 'var(--brand-primary)',
                  border: `1px solid ${isGpsLocked ? 'var(--safe-border)' : 'var(--brand-border)'}`
                }}
              >
                {isGpsLocked ? <Radio size={10} /> : <Navigation size={10} />}
                <span>{isGpsLocked ? (bm ? 'GPS Aktif' : 'Live GPS') : (bm ? 'Mod Lalai' : 'Default')}</span>
              </span>
            </div>
            <div className="location-strip__area tabular-mono">
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
                aria-label={bm ? 'Tutup carian' : 'Close search'}
              >
                <X size={13} />
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
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
                type="button"
                className="location-strip__refresh"
                onClick={() => setShowSearch(true)}
                title={bm ? 'Semak bandar lain di Malaysia' : 'Check another town in Malaysia'}
              >
                <Search size={12} />
                <span>{bm ? 'Cari Kawasan' : 'Check Area'}</span>
              </button>

              <button
                type="button"
                className="location-strip__refresh tabular-mono"
                onClick={refreshFeeds}
                disabled={isRefreshing}
                title={t.pullToRefresh}
              >
                <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
                <span>
                  {isRefreshing
                    ? t.refreshing
                    : weather
                      ? `${bm ? 'Kemas kini' : 'Synced'} ${new Date(weather.fetchedAt).toLocaleTimeString(bm ? 'ms-MY' : 'en-MY', { hour: 'numeric', minute: '2-digit' })}`
                      : t.updatedAgo}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Responsive Dashboard Grid ───────────────────────────────────────── */}
      <div className="dashboard-grid">
        {/* Left Column: Status Card + Primary Action + Live Spatial Radar */}
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
                          ? 'SELAMAT (ALL CLEAR)'
                          : 'ALL CLEAR'
                        : isAdvisory
                          ? bm
                            ? 'AMARAN (ADVISORY)'
                            : 'ADVISORY'
                          : bm
                            ? 'KRITIKAL (CRITICAL)'
                            : 'CRITICAL'}
                    </span>
                    {weather && (
                      <span
                        className="status-card__badge-pill tabular-mono"
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

              {/* Collapsible Drop Bar for Detailed SITREP */}
              <button
                type="button"
                className="status-card__drop-bar"
                onClick={() => setIsStatusDetailsOpen(prev => !prev)}
                aria-expanded={isStatusDetailsOpen}
              >
                <span>
                  {isStatusDetailsOpen
                    ? (bm ? 'Tutup Butiran Laporan' : 'Hide Detailed SITREP')
                    : (bm ? 'Lihat Laporan Penuh (SITREP & Telemetri)' : 'See More (Full SITREP & Telemetry)')}
                </span>
                <ChevronDown size={15} className={`drop-bar__chevron ${isStatusDetailsOpen ? 'drop-bar__chevron--rotated' : ''}`} />
              </button>

              {isStatusDetailsOpen && (
                <div className="drop-bar__expanded-content">
                  <div className="status-card__summary">
                    <strong>{bm ? 'Laporan Telemetri Semasa: ' : 'Live Telemetry SITREP: '}</strong>
                    {bm ? currentScenario.hazardSummaryBm : currentScenario.hazardSummaryEn}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Primary Action CTA Card (Thumb-Reachable) */}
          <div
            className="primary-action-card"
            onClick={handlePrimaryAction}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handlePrimaryAction();
              }
            }}
          >
            <div key={`${currentScenario.id}-${currentScenario.locationName}-${language}`} className="primary-action-card__content cross-fade-text">
              <div className="primary-action-card__icon">
                {isSafe ? <ShieldCheck size={24} /> : <ArrowRight size={24} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="primary-action-card__title">
                  {bm ? currentScenario.primaryActionBm : currentScenario.primaryActionEn}
                </div>
                <div className="primary-action-card__subtitle tabular-mono">
                  {bm ? currentScenario.primaryActionSubtitleBm : currentScenario.primaryActionSubtitleEn}
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="primary-action-card__arrow" />
          </div>

          {/* 3. Live Spatial Radar Preview Card with Active Sonar Beacon */}
          <div
            className="section-card radar-preview-card"
            style={{ cursor: 'pointer', background: 'var(--bg-surface)' }}
            onClick={() => setActiveTab('map')}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setActiveTab('map');
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <Compass size={16} color="var(--brand-primary)" />
                <span>{bm ? 'Radar Situasi & PPS Terdekat' : 'Live Situation & Shelter Radar'}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {bm ? 'Buka Peta Penuh' : 'Open Full Map'} <ChevronRight size={14} />
              </span>
            </div>

            <div className="radar-viewport">
              <svg width="100%" height="100%" viewBox="0 0 100 35" preserveAspectRatio="none">
                {/* Tactical Coordinate Grid Lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 1" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 1" />
                <line x1="25" y1="0" x2="25" y2="35" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 1" />
                <line x1="50" y1="0" x2="50" y2="35" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 1" />
                <line x1="75" y1="0" x2="75" y2="35" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 1" />

                {/* Roads */}
                <line x1="0" y1="18" x2="100" y2="18" stroke="var(--map-road-secondary)" strokeWidth="1.5" />
                <line x1="30" y1="0" x2="30" y2="35" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
                <line x1="70" y1="0" x2="70" y2="35" stroke="var(--map-road-secondary)" strokeWidth="1.2" />

                {/* River */}
                <path d="M0,8 Q50,15 100,6" fill="none" stroke="var(--map-water)" strokeWidth="3.5" />

                {/* Hazard polygon with water reading */}
                {currentScenario.hazards.length > 0 && (
                  <polygon
                    points="48,15 57,13 63,17 61,23 53,24 47,19"
                    fill="var(--danger-bg)"
                    stroke="var(--danger-badge)"
                    strokeWidth="0.8"
                  />
                )}

                {/* Route */}
                <path d="M 28 22 Q 48 26, 75 14" fill="none" stroke="var(--map-route)" strokeWidth="1.1" strokeDasharray="2 1" />

                {/* Clear User GPS Beacon */}
                <circle cx="28" cy="22" r="3" fill="var(--map-user-pin)" stroke="var(--bg-surface)" strokeWidth="1" />

                {/* Nearest Shelter Pin with Capacity */}
                <circle cx="75" cy="14" r="3.5" fill="var(--map-shelter-pin)" stroke="var(--bg-surface)" strokeWidth="1" />
                <text x="75" y="15.2" textAnchor="middle" fill="var(--on-vivid)" fontSize="2.8" fontWeight="bold">H</text>
              </svg>

              <div className="radar-hud-pill radar-hud-pill--left tabular-mono">
                <Navigation size={10} color="var(--brand-primary)" />
                <span>
                  {bm
                    ? `PPS: ${nearestShelter.distanceKm} km · ${nearestShelter.driveMinutes}m pandu`
                    : `PPS: ${nearestShelter.distanceKm} km · ${nearestShelter.driveMinutes}m drive`}
                </span>
              </div>

              <div className="radar-hud-pill radar-hud-pill--right tabular-mono">
                <span>{nearestShelter.capacityCurrent}/{nearestShelter.capacityTotal} CAP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Weather Bento + Hazards + AI Tactical Chips + SOS Strip */}
        <div className="dashboard-column">
          {/* Live Weather & Malaysian IPU Haze Monitor (4-Tile Bento Grid) */}
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
                      <div className="tabular-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--danger-accent)', marginTop: '6px' }}>
                        <Waves size={12} />
                        <span>{t.waterDepth}: ~{h.waterDepthMeters}m</span>
                      </div>
                    )}
                    {h.ipuValue && (
                      <div className="tabular-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--advisory-accent)', marginTop: '6px' }}>
                        <Wind size={12} />
                        <span>{bm ? 'Bacaan IPU Semasa' : 'Live IPU Reading'}: {h.ipuValue}</span>
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

          {/* 5. 1-Tap AI Safety Guidance Chips (Crisp SVG Icons — Zero Emojis) */}
          <div className="section-card">
            <div className="section-title">
              <MessageSquareQuote size={16} color="var(--brand-primary)" />
              <span>{t.quickQuestionsTitle}</span>
            </div>
            <div className="chips-container">
              <button
                type="button"
                className="chip-button"
                onClick={() => askAssistantDirectly('pack')}
              >
                <span className="chip-button__left">
                  <span className="chip-icon-box">
                    <Backpack size={14} />
                  </span>
                  <span>{t.chipPack}</span>
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                type="button"
                className="chip-button"
                onClick={() => askAssistantDirectly('drive')}
              >
                <span className="chip-button__left">
                  <span className="chip-icon-box">
                    <Car size={14} />
                  </span>
                  <span>{t.chipDrive}</span>
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                type="button"
                className="chip-button"
                onClick={() => askAssistantDirectly('power')}
              >
                <span className="chip-button__left">
                  <span className="chip-icon-box">
                    <Zap size={14} />
                  </span>
                  <span>{t.chipPower}</span>
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button
                type="button"
                className="chip-button"
                onClick={() => askAssistantDirectly('trapped')}
              >
                <span className="chip-button__left">
                  <span className="chip-icon-box">
                    <Home size={14} />
                  </span>
                  <span>{t.chipTrapped}</span>
                </span>
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
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setActiveTab('sos');
              }
            }}
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
            <button type="button" className="sos-banner-strip__btn tabular-mono">
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
