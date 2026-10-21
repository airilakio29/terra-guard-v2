import React from 'react';
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
  Compass
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
    weather
  } = useApp();

  const isSafe = currentScenario.riskLevel === 'safe';
  const isAdvisory = currentScenario.riskLevel === 'advisory';
  const isDanger = currentScenario.riskLevel === 'danger';

  const nearestShelter = currentScenario.shelters.find(
    s => s.id === currentScenario.nearestShelterId
  ) || currentScenario.shelters[0];

  const handlePrimaryAction = () => {
    if (isSafe) {
      setActiveTab('sos'); // leads to survival kit in safe mode
    } else {
      setSelectedShelter(nearestShelter);
      setActiveTab('map');
    }
  };

  return (
    <div className="screen-scroll-container">
      {/* Location & Refresh Strip */}
      <div className="location-strip">
        <div className="location-strip__info">
          <MapPin size={18} className="location-strip__pin" />
          <div key={`${currentScenario.id}-${language}`} className="cross-fade-text">
            <div className="location-strip__name">{currentScenario.locationName}</div>
            <div className="location-strip__area">{currentScenario.locationArea}</div>
          </div>
        </div>
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
                ? `${language === 'bm' ? 'Dikemas kini' : 'Updated'} ${new Date(weather.fetchedAt).toLocaleTimeString(language === 'bm' ? 'ms-MY' : 'en-MY', { hour: 'numeric', minute: '2-digit' })}`
                : t.updatedAgo}
          </span>
        </button>
      </div>

      {/* Responsive Dashboard Grid (Left & Right columns on Desktop/Tablet) */}
      <div className="dashboard-grid">
        {/* Left Column: Status Card + Primary Action + Mini Map Snapshot */}
        <div className="dashboard-column">
          {/* 1. Main Risk Status Card */}
          <div className={`status-card status-card--${currentScenario.riskLevel}`}>
            <div key={`${currentScenario.id}-${language}`} className="cross-fade-text">
              <div className="status-card__header">
                <div className="status-card__icon-badge">
                  {isSafe && <CheckCircle2 size={24} />}
                  {isAdvisory && <AlertTriangle size={24} />}
                  {isDanger && <AlertOctagon size={24} />}
                </div>
                <div>
                  <span className="status-card__badge-pill">
                    {isSafe ? (language === 'bm' ? 'SELAMAT' : 'ALL CLEAR') :
                     isAdvisory ? (language === 'bm' ? 'PERINGATAN AWAL' : 'ADVISORY') :
                     (language === 'bm' ? 'BAHAYA KRITIKAL' : 'CRITICAL DANGER')}
                  </span>
                  <h1 className="status-card__headline">
                    {language === 'bm' ? currentScenario.headlineBm : currentScenario.headlineEn}
                  </h1>
                </div>
              </div>

              <p className="status-card__directive">
                {language === 'bm' ? currentScenario.directiveBm : currentScenario.directiveEn}
              </p>

              <div className="status-card__summary">
                <strong>{language === 'bm' ? 'Situasi Semasa: ' : 'Official SITREP: '}</strong>
                {language === 'bm' ? currentScenario.hazardSummaryBm : currentScenario.hazardSummaryEn}
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
            <div key={`${currentScenario.id}-${language}`} className="primary-action-card__content cross-fade-text">
              <div className="primary-action-card__icon">
                {isSafe ? <ShieldCheck size={24} /> : <ArrowRight size={24} />}
              </div>
              <div>
                <div className="primary-action-card__title">
                  {language === 'bm' ? currentScenario.primaryActionBm : currentScenario.primaryActionEn}
                </div>
                <div className="primary-action-card__subtitle">
                  {language === 'bm' ? currentScenario.primaryActionSubtitleBm : currentScenario.primaryActionSubtitleEn}
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
                <span>{language === 'bm' ? 'Peta Pantas Situasi' : 'Live Situation Radar'}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {language === 'bm' ? 'Buka Peta Penuh' : 'Open Full Map'} <ChevronRight size={14} />
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
                <text x="75" y="15.2" textAnchor="middle" fill="var(--text-inverse)" fontSize="2.8" fontWeight="bold">H</text>

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
                📍 {language === 'bm' ? 'Laluan selamat ke PPS: 850m' : 'Safe route to shelter: 850m'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hazards Nearby + AI Quick Guidance + Emergency SOS */}
        <div className="dashboard-column">
          {/* Live Weather (OpenWeatherMap) */}
          <LiveWeatherCard />
          {/* 4. Active Hazards (Plain List, No Complex Overlays) */}
          {currentScenario.hazards.length > 0 && (
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
                      {language === 'bm' ? h.titleBm : h.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {language === 'bm' ? h.descriptionBm : h.descriptionEn}
                    </div>
                    {h.waterDepthMeters && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-accent)', marginTop: '4px' }}>
                        ⚠️ {t.waterDepth}: ~{h.waterDepthMeters}m
                      </div>
                    )}
                  </div>
                ))}
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
