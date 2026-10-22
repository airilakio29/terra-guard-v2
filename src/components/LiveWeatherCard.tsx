import React, { useState } from 'react';
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
  Compass
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { iconUrl, rainOutlook, getIpuMeta } from '../services/weather';

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

export const LiveWeatherCard: React.FC = () => {
  const { weather, weatherError, language, locating, locateMe, refreshFeeds, isRefreshing } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const bm = language === 'bm';

  if (weatherError === 'missing-key') {
    return (
      <div className="section-card weather-card">
        <div className="section-title">
          <CloudRain size={16} />
          <span>{bm ? 'Telemetri Cuaca & Jerebu (IPU)' : 'Weather & Haze (IPU) Telemetry'}</span>
        </div>
        <p className="weather-muted">
          Add <code>VITE_OPENWEATHER_API_KEY</code> to <code>.env.local</code>.
        </p>
      </div>
    );
  }

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
              <span>{bm ? 'Memuatkan telemetri cuaca & IPU…' : 'Syncing live weather & IPU telemetry…'}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  const outlookKey = rainOutlook(weather);
  const outlook = OUTLOOK_TEXT[outlookKey];
  const ipuMeta = getIpuMeta(weather.ipuCategory, bm);
  const windKmh = Math.round(weather.windMs * 3.6);
  const rainBarPct = Math.min(100, Math.round((weather.rain24hMm / 60) * 100));
  const ipuBarPct = Math.min(100, Math.round((weather.ipuIndex / 300) * 100));

  const riverRatio =
    weather.riverDischargeM3s !== null &&
    weather.riverDischargeMeanM3s !== null &&
    weather.riverDischargeMeanM3s > 0
      ? weather.riverDischargeM3s / weather.riverDischargeMeanM3s
      : null;

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
          >
            <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Place & GPS Lock Subbar ────────────────────────────────────────── */}
      <div className="weather-card__place">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <MapPin size={12} color="var(--brand-primary)" />
          <span>{weather.placeName || '—'}</span>
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

      {/* ─── 4-TILE TACTICAL BENTO TELEMETRY GRID (Apple Weather / EOC Style) ── */}
      <div className="tactical-bento-grid">
        {/* TILE 1: Rainfall & Precipitation Gauge */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head">
            <CloudRain size={13} color="var(--brand-primary)" />
            <span>{bm ? 'KEamatan HUJAN' : 'PRECIPITATION'}</span>
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

        {/* TILE 2: Malaysian DOE IPU (Haze / Air Quality) */}
        <div className="tactical-bento-tile">
          <div className="tactical-bento-tile__head">
            <Eye size={13} color={ipuMeta.color} />
            <span>{bm ? 'INDEKS IPU (JEREBU)' : 'MALAYSIA IPU'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
            <div className="tabular-mono tactical-bento-tile__value" style={{ color: ipuMeta.color }}>
              {weather.ipuIndex}
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
          <div className="tabular-mono tactical-bento-tile__sub">
            PM2.5: {weather.pm25} µg/m³
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
              {weather.dominantPollutant}
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
            ? (bm ? 'Tutup Ramalan Jam & Butiran IPU' : 'Hide Hourly Forecast & IPU Details')
            : (bm ? 'Lihat Ramalan 24 Jam & Analisis Penuh' : 'View 24h Hourly Strip & Full Analysis')}
        </span>
        <ChevronDown size={15} className={`drop-bar__chevron ${isExpanded ? 'drop-bar__chevron--rotated' : ''}`} />
      </button>

      {/* ─── Expanded View: Full DOE IPU, 24h Rain Outlook & Hourly Strip ────── */}
      {isExpanded && (
        <div className="drop-bar__expanded-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Malaysian DOE IPU Box */}
          <div
            className="weather-outlook"
            style={{
              color: ipuMeta.color,
              background: ipuMeta.bg,
              border: `1px solid ${ipuMeta.border}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800 }}>
                <Eye size={14} />
                {bm ? 'Indeks Pencemaran Udara (IPU):' : 'Malaysia Air Pollutant Index (IPU):'}{' '}
                <span className="tabular-mono">{weather.ipuIndex}</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${ipuMeta.border}`,
                  background: 'var(--bg-surface)',
                  color: ipuMeta.color
                }}
              >
                {ipuMeta.label}
              </span>
            </div>
            <span className="weather-outlook__meta tabular-mono">
              {ipuMeta.advice} (PM2.5: {weather.pm25} µg/m³ · PM10: {weather.pm10} µg/m³)
            </span>
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

          <div className="weather-source">
            {bm
              ? 'Sumber: OpenWeather, Open-Meteo Air Quality (IPU) & GloFAS River Flood. Rujuk MetMalaysia / JAS (APIMS) / NADMA.'
              : 'Sources: OpenWeather, Open-Meteo Air Quality (IPU) & GloFAS River Flood. Follow official MetMalaysia / DOE APIMS / NADMA alerts.'}
          </div>
        </div>
      )}
    </div>
  );
};
