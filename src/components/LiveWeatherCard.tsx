import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  LocateFixed,
  RotateCw,
  Radio,
  Eye,
  ChevronDown,
  MapPin,
  AlertTriangle,
  Waves,
  Compass,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePwa } from '../context/PwaContext';
import { iconUrl, rainOutlook, getIpuMeta } from '../services/weather';
import {
  fetchDoeApimsTelemetry,
  getMalaysianIpuAdvice,
  getMalaysianStatesWithStations,
  classifyMalaysianIpu,
  type ApimsResponse
} from '../services/apims';
import type { RiskLevel } from '../types';

const OUTLOOK_TEXT = {
  none: {
    en: 'No rain expected in next 24h',
    bm: 'Tiada hujan dijangka 24 jam akan datang',
    color: 'var(--safe-text)',
    bg: 'var(--safe-bg)',
    border: 'var(--safe-border)'
  },
  light: {
    en: 'Light rain possible in next 24h',
    bm: 'Hujan renyai mungkin dalam 24 jam',
    color: 'var(--brand-primary)',
    bg: 'var(--brand-surface)',
    border: 'var(--brand-border)'
  },
  moderate: {
    en: 'Moderate rain expected — watch drains & low roads',
    bm: 'Hujan sederhana dijangka — awasi longkang & jalan rendah',
    color: 'var(--advisory-text)',
    bg: 'var(--advisory-bg)',
    border: 'var(--advisory-border)'
  },
  heavy: {
    en: 'Heavy rain / thunderstorm — flash flood risk rises',
    bm: 'Hujan lebat / ribut petir — risiko banjir kilat meningkat',
    color: 'var(--danger-text)',
    bg: 'var(--danger-bg)',
    border: 'var(--danger-border)'
  }
} as const;

function timeAgo(ms: number, bm: boolean) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 1) return bm ? 'baru sahaja' : 'just now';
  return bm ? `${mins}m lalu` : `${mins}m ago`;
}

// Preset verified baseline readings for the 3 demo scenarios
const DEMO_SCENARIO_IPU: Record<
  RiskLevel,
  {
    ipu: number;
    dominant: 'PM2.5' | 'PM10';
    stationName: string;
    stationNameBm: string;
    distanceKm: number;
    area: string;
  }
> = {
  advisory: {
    ipu: 68,
    dominant: 'PM2.5',
    stationName: 'Shah Alam, SELANGOR',
    stationNameBm: 'Shah Alam, SELANGOR',
    distanceKm: 6.6,
    area: 'Subang Jaya (USJ 1)'
  },
  danger: {
    ipu: 52,
    dominant: 'PM2.5',
    stationName: 'Kota Bharu, KELANTAN',
    stationNameBm: 'Kota Bharu, KELANTAN',
    distanceKm: 2.7,
    area: 'Kota Bharu (Pasir Mas)'
  },
  safe: {
    ipu: 42,
    dominant: 'PM2.5',
    stationName: 'Minden, PULAU PINANG',
    stationNameBm: 'Minden, PULAU PINANG',
    distanceKm: 6.8,
    area: 'Bayan Lepas (George Town)'
  }
};

export const LiveWeatherCard: React.FC = () => {
  const {
    weather,
    weatherError,
    language,
    locating,
    locateMe,
    refreshFeeds,
    isRefreshing,
    scenario,
    setScenario,
    isLiveMode,
    setIsLiveMode,
    currentScenario
  } = useApp();

  const { isOnline } = usePwa();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [apimsData, setApimsData] = useState<ApimsResponse | null>(null);
  const [apimsLoading, setApimsLoading] = useState(false);
  const bm = language === 'bm';

  // Fetch official DOE APIMS data on coordinate change or state filter change
  useEffect(() => {
    let isSubscribed = true;
    setApimsLoading(true);

    const lat = currentScenario.lat || 3.0515;
    const lon = currentScenario.lon || 101.5823;

    fetchDoeApimsTelemetry(lat, lon, selectedState)
      .then(res => {
        if (isSubscribed) {
          setApimsData(res);
          setApimsLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setApimsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [currentScenario.lat, currentScenario.lon, selectedState, isRefreshing]);

  if (!weather) {
    return (
      <div className="section-card weather-card">
        <div className="section-title">
          <CloudRain size={16} />
          <span>{bm ? 'Telemetri Cuaca & Jerebu (IPU)' : 'Weather & Haze (IPU) Telemetry'}</span>
        </div>
        <div className="weather-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {weatherError ? (
            <>
              <AlertTriangle size={14} color="var(--advisory-accent)" />
              <span>{weatherError}</span>
            </>
          ) : (
            <>
              <Radio size={14} className="spin-icon" color="var(--brand-primary)" />
              <span>{bm ? 'Memuatkan telemetri cuaca & APIMS…' : 'Syncing live weather & APIMS telemetry…'}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  const outlookKey = rainOutlook(weather);
  const outlook = OUTLOOK_TEXT[outlookKey];
  const windKmh = Math.round(weather.windMs * 3.6);
  const rainBarPct = Math.min(100, Math.round((weather.rain24hMm / 60) * 100));

  // Determine active IPU telemetry (Demo Scenario vs Live Real Data)
  const isDemo = !isLiveMode;
  const demoIpuPreset = DEMO_SCENARIO_IPU[scenario] || DEMO_SCENARIO_IPU.advisory;

  const activeIpu = isDemo
    ? demoIpuPreset.ipu
    : apimsData?.nearestStation?.ipu ?? weather.ipuIndex;

  const activeCategory = classifyMalaysianIpu(activeIpu);
  const ipuMeta = getIpuMeta(activeCategory, bm);
  const ipuAdvice = getMalaysianIpuAdvice(activeCategory, bm);

  const activeStationName = isDemo
    ? demoIpuPreset.stationName
    : apimsData?.nearestStation?.stationLocation ?? weather.stationName ?? 'DOE Station';

  const activeDistanceKm = isDemo
    ? demoIpuPreset.distanceKm
    : apimsData?.nearestStation?.distKm ?? weather.stationDistanceKm ?? 0;

  const activeDominant = isDemo
    ? demoIpuPreset.dominant
    : apimsData?.nearestStation?.dominantPollutant ?? weather.dominantPollutant;

  const activeTimestampMs = isDemo
    ? Date.now() - 12 * 60 * 1000
    : apimsData?.nearestStation?.datetimeMs ?? weather.stationUpdatedMs ?? Date.now();

  const isApimsCached =
    !isDemo &&
    (apimsData?.source === 'cached-doe-apims' ||
      apimsData?.source === 'offline-doe-apims' ||
      apimsData?.isStale ||
      !isOnline);

  const ipuBarPct = Math.min(100, Math.round((activeIpu / 300) * 100));

  const riverRatio =
    weather.riverDischargeM3s !== null &&
    weather.riverDischargeMeanM3s !== null &&
    weather.riverDischargeMeanM3s > 0
      ? weather.riverDischargeM3s / weather.riverDischargeMeanM3s
      : null;

  const availableStates = apimsData ? getMalaysianStatesWithStations(apimsData.stations) : [];

  return (
    <div className="section-card weather-card">
      {/* ─── Header Strip ───────────────────────────────────────────────────── */}
      <div className="weather-card__head">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="tactical-ping-dot tactical-ping-dot--live" />
          <span>{bm ? 'Telemetri Cuaca & Jerebu (IPU)' : 'Live Weather & IPU Telemetry'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="tabular-mono tactical-tag">
            {timeAgo(weather.fetchedAt, bm)}
          </span>
          <button
            type="button"
            className="weather-icon-btn"
            onClick={refreshFeeds}
            disabled={isRefreshing}
            title={bm ? 'Muat semula' : 'Refresh'}
            aria-label={bm ? 'Muat semula' : 'Refresh'}
          >
            <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Mode Selector: Demo Scenarios vs Live Real Data Toggle ──────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: 'var(--radius-none)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          marginTop: '6px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsLiveMode(false)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: isDemo ? 'var(--brand-primary)' : 'var(--border-subtle)',
              background: isDemo ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: isDemo ? 'var(--btn-filled-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {bm ? '🧪 Data Demo' : '🧪 Demo Mode'}
          </button>
          <button
            type="button"
            onClick={() => setIsLiveMode(true)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: isLiveMode ? 'var(--brand-primary)' : 'var(--border-subtle)',
              background: isLiveMode ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: isLiveMode ? 'var(--btn-filled-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {bm ? '📡 APIMS Langsung' : '📡 Live DOE APIMS'}
          </button>
        </div>

        {/* Demo Scenario Pill Selector */}
        {isDemo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--advisory-bg)',
                color: 'var(--advisory-text)',
                border: '1px solid var(--advisory-border)'
              }}
            >
              {bm ? 'DATA DEMO' : 'DEMO DATA'}
            </span>
            {(['advisory', 'danger', 'safe'] as RiskLevel[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setScenario(r)}
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: scenario === r ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  background: scenario === r ? 'var(--brand-surface)' : 'var(--bg-surface)',
                  color: scenario === r ? 'var(--brand-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {r === 'advisory' ? 'Subang' : r === 'danger' ? 'Kelantan' : 'Penang'}
              </button>
            ))}
          </div>
        ) : (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--safe-bg)',
              color: 'var(--safe-text)',
              border: '1px solid var(--safe-border)'
            }}
          >
            {bm ? 'RASMI JAS' : 'OFFICIAL DOE APIMS'}
          </span>
        )}
      </div>

      {/* ─── Place & GPS Lock Subbar ────────────────────────────────────────── */}
      <div className="weather-card__place">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <MapPin size={12} color="var(--brand-primary)" />
          <span>{weather.placeName || currentScenario.locationName || '—'}</span>
        </span>
        <button type="button" className="weather-link-btn" onClick={locateMe} disabled={locating}>
          <LocateFixed size={11} className={locating ? 'spin-icon' : ''} />
          <span>
            {locating
              ? (bm ? 'Mengimbas GPS…' : 'Scanning GPS…')
              : (bm ? 'Kemas kini GPS' : 'Sync GPS')}
          </span>
        </button>
      </div>

      {weatherError && (
        <div className="tactical-inline-alert">
          <AlertTriangle size={14} />
          <span>{weatherError}</span>
        </div>
      )}

      {/* ─── Hero Weather + Condition Summary ───────────────────────────────── */}
      <div className="weather-bento-hero">
        <div className="weather-bento-hero__left">
          <img
            src={iconUrl(weather.icon)}
            alt={weather.description}
            width={56}
            height={56}
            className="weather-bento-hero__icon"
          />
          <div>
            <div className="tabular-mono weather-card__temp">{Math.round(weather.tempC)}°C</div>
            <div className="weather-card__desc">{weather.description}</div>
          </div>
        </div>

        <div className="weather-bento-hero__right">
          <span className="tabular-mono weather-feels-pill">
            <Thermometer size={12} />
            <span>{bm ? 'Terasa' : 'Feels'} {Math.round(weather.feelsLikeC)}°C</span>
          </span>
          <span
            className="weather-outlook-pill"
            style={{
              color: outlook.color,
              background: outlook.bg,
              borderColor: outlook.border
            }}
          >
            <CloudRain size={11} />
            <span>
              {outlookKey === 'none'
                ? (bm ? 'Tiada Hujan' : 'Clear 24h')
                : outlookKey === 'light'
                  ? (bm ? 'Hujan Renyai' : 'Light Rain')
                  : outlookKey === 'moderate'
                    ? (bm ? 'Hujan Sederhana' : 'Mod. Rain')
                    : (bm ? 'Hujan Lebat' : 'Heavy Rain')}
            </span>
          </span>
        </div>
      </div>

      {/* ─── 4-TILE TACTICAL BENTO TELEMETRY GRID ────────────────────────────── */}
      <div className="tactical-bento-grid">
        {/* TILE 1: Rainfall & Precipitation Gauge */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head">
            <CloudRain size={13} color="var(--brand-primary)" />
            <span>{bm ? 'KEAMATAN HUJAN' : 'PRECIPITATION'}</span>
          </div>
          <div className="tabular-mono tactical-bento-tile__value">
            {weather.rain1hMm.toFixed(1)} <small>mm/h</small>
          </div>
          <div className="tactical-mini-meter">
            <div
              className="tactical-mini-meter__fill"
              style={{
                width: `${Math.max(6, rainBarPct)}%`,
                background: outlookKey === 'heavy' ? 'var(--danger-accent)' : 'var(--brand-primary)'
              }}
            />
          </div>
          <div className="tabular-mono tactical-bento-tile__sub">
            {bm ? '24j:' : '24h:'} {weather.rain24hMm.toFixed(1)} mm ({Math.round(weather.maxRainChance * 100)}%)
          </div>
        </div>

        {/* TILE 2: Official Malaysian DOE APIMS (Haze / IPU) */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Eye size={13} color={ipuMeta.color} />
              <span>{bm ? 'INDEKS IPU (JAS)' : 'MALAYSIA IPU'}</span>
            </div>
            {isApimsCached ? (
              <span className="tactical-offline-badge">
                {bm ? 'Luar Talian' : 'Offline'}
              </span>
            ) : apimsLoading ? (
              <Radio size={10} className="spin-icon" color="var(--brand-primary)" />
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
            <div className="tabular-mono tactical-bento-tile__value" style={{ color: ipuMeta.color }}>
              {activeIpu}
            </div>
            <span
              className="tactical-micro-badge"
              style={{
                color: ipuMeta.color,
                background: ipuMeta.bg,
                borderColor: ipuMeta.border
              }}
            >
              {ipuMeta.label}
            </span>
          </div>
          <div className="tactical-mini-meter">
            <div
              className="tactical-mini-meter__fill"
              style={{
                width: `${Math.max(8, ipuBarPct)}%`,
                background: ipuMeta.color
              }}
            />
          </div>
          <div className="tabular-mono tactical-bento-tile__sub" style={{ display: 'flex', justifyContent: 'space-between', gap: '2px' }}>
            <span>{activeDominant}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {isApimsCached
                ? timeAgo(activeTimestampMs, bm)
                : activeDistanceKm > 0
                  ? `${activeDistanceKm}km`
                  : (bm ? 'Stesen Terdekat' : 'Nearest')}
            </span>
          </div>
        </div>

        {/* TILE 3: Wind Vector & Humidity */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head">
            <Wind size={13} color="var(--brand-primary)" />
            <span>{bm ? 'ANGIN & LEMBAPAN' : 'WIND & HUMIDITY'}</span>
          </div>
          <div className="tabular-mono tactical-bento-tile__value">
            {windKmh} <small>km/h</small>
          </div>
          <div className="tactical-bento-tile__row">
            <span className="tabular-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <Droplets size={11} color="var(--brand-primary)" />
              {weather.humidity}% RH
            </span>
            <span className="tabular-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              <Compass size={11} />
              {activeDominant}
            </span>
          </div>
        </div>

        {/* TILE 4: River Basin Discharge (GloFAS) */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head">
            <Waves size={13} color="var(--brand-primary)" />
            <span>{bm ? 'ALIRAN SUNGAI' : 'RIVER DISCHARGE'}</span>
          </div>
          {weather.riverDischargeM3s !== null ? (
            <>
              <div className="tabular-mono tactical-bento-tile__value">
                {weather.riverDischargeM3s.toFixed(0)} <small>m³/s</small>
              </div>
              <div className="tabular-mono tactical-bento-tile__sub">
                {riverRatio !== null
                  ? `${riverRatio.toFixed(1)}x ${bm ? 'purata lembangan' : 'basin mean'}`
                  : (bm ? 'Data GloFAS Aktif' : 'Live GloFAS Feed')}
              </div>
            </>
          ) : (
            <>
              <div className="tabular-mono tactical-bento-tile__value">
                {Math.round(weather.maxRainChance * 100)}<small>% POP</small>
              </div>
              <div className="tabular-mono tactical-bento-tile__sub">
                {bm ? 'Kebarangkalian hujan' : 'Rain probability'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Drop Bar Toggle Button ─────────────────────────────────────────── */}
      <button
        type="button"
        className="weather-card__drop-bar"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <span>
          {isExpanded
            ? (bm ? 'Tutup Ramalan Jam & Butiran APIMS' : 'Hide Hourly Forecast & DOE APIMS Details')
            : (bm ? 'Lihat Stesen APIMS & Analisis 24 Jam' : 'View Official DOE Stations & Full Analysis')}
        </span>
        <ChevronDown size={15} className={`drop-bar__chevron ${isExpanded ? 'drop-bar__chevron--rotated' : ''}`} />
      </button>

      {/* ─── Expanded View: Full Official DOE APIMS Details & 24h Forecast ───── */}
      {isExpanded && (
        <div className="drop-bar__expanded-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Official Malaysian DOE APIMS Station Detail Box */}
          <div
            className="weather-outlook"
            style={{
              color: ipuMeta.color,
              background: ipuMeta.bg,
              border: `1px solid ${ipuMeta.border}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Eye size={15} />
                <span>{bm ? 'Indeks Pencemaran Udara (IPU):' : 'Malaysia Air Pollutant Index (IPU):'}</span>
                <span className="tabular-mono" style={{ fontSize: '15px' }}>{activeIpu}</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${ipuMeta.border}`,
                  background: 'var(--bg-surface)',
                  color: ipuMeta.color
                }}
              >
                {ipuMeta.label}
              </span>
            </div>

            <div style={{ marginTop: '6px', fontSize: '11.5px', lineHeight: 1.4 }}>
              <strong>{bm ? 'Nasihat Kesihatan: ' : 'Health Advice: '}</strong>
              <span>{ipuAdvice.advice}</span>
            </div>

            <div
              className="weather-outlook__meta tabular-mono"
              style={{
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <span>
                📍 {activeStationName} ({activeDistanceKm > 0 ? `${activeDistanceKm} km` : (bm ? 'berdekatan' : 'nearby')})
              </span>
              <span>
                {bm ? 'Bahan Utama:' : 'Dominant:'} {activeDominant}
              </span>
              <span>
                🕒 {timeAgo(activeTimestampMs, bm)}
              </span>
            </div>
          </div>

          {/* Manual State Station Browser / Fallback Filter */}
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-none)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Building2 size={14} color="var(--brand-primary)" />
                <span>{bm ? 'Pilih Negeri (68 Stesen Rasmi JAS):' : 'Filter by State (68 Official DOE Stations):'}</span>
              </div>
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">{bm ? 'Semua Negeri (Stesen Terdekat)' : 'All States (Nearest Station)'}</option>
                {availableStates.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* List of stations in the selected state */}
            {apimsData && selectedState !== 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {apimsData.stations.slice(0, 8).map(stn => {
                  const cat = classifyMalaysianIpu(stn.ipu);
                  const adv = getMalaysianIpuAdvice(cat, bm);
                  return (
                    <div
                      key={stn.stationId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-card)',
                        fontSize: '11px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stn.stationLocation}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tabular-mono" style={{ color: adv.colorVar, fontWeight: 800 }}>
                          IPU {stn.ipu}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            background: adv.bgVar,
                            color: adv.colorVar,
                            border: `1px solid ${adv.borderVar}`
                          }}
                        >
                          {adv.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rain & Flood Outlook Box */}
          <div
            className="weather-outlook"
            style={{ color: outlook.color, background: outlook.bg, border: `1px solid ${outlook.border}` }}
          >
            <span>{bm ? outlook.bm : outlook.en}</span>
            <span className="weather-outlook__meta tabular-mono">
              {bm ? 'Jumlah 24j' : '24h total'}: {weather.rain24hMm.toFixed(1)} mm · {bm ? 'Peluang maks' : 'Max chance'}: {Math.round(weather.maxRainChance * 100)}%
              {weather.riverDischargeM3s !== null && (
                <> · {bm ? 'Aliran sungai' : 'River flow'}: {weather.riverDischargeM3s.toFixed(0)} m³/s</>
              )}
            </span>
          </div>

          {/* Hourly Forecast */}
          <div className="weather-forecast">
            {weather.forecast.map(f => (
              <div key={f.time} className="weather-forecast__slot">
                <span className="tabular-mono">
                  {new Date(f.time).toLocaleTimeString(bm ? 'ms-MY' : 'en-MY', { hour: 'numeric' })}
                </span>
                <img src={iconUrl(f.icon)} alt="" width={32} height={32} />
                <strong className="tabular-mono">{Math.round(f.tempC)}°</strong>
                <span className="weather-forecast__pop tabular-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <Droplets size={10} />
                  {Math.round(f.rainChance * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* Attribution & Legal Feeds */}
          <div className="weather-source">
            {bm
              ? 'Data IPU rasmi: Jabatan Alam Sekitar (JAS APIMS • eqms.doe.gov.my). Cuaca & Banjir: MetMalaysia, JPS PublicInfoBanjir & GloFAS.'
              : 'Official Malaysian IPU feed: Department of Environment (DOE APIMS • eqms.doe.gov.my). Weather & River Discharge: MetMalaysia & GloFAS.'}
          </div>
        </div>
      )}
    </div>
  );
};
