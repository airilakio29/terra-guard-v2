import React, { useState } from 'react';
import { CloudRain, Droplets, Wind, Thermometer, LocateFixed, RotateCw, Radio, Eye, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { iconUrl, rainOutlook, getIpuMeta } from '../services/weather';

const OUTLOOK_TEXT = {
  none: { en: 'No rain expected in next 24h', bm: 'Tiada hujan dijangka 24 jam akan datang', color: 'var(--safe-text)', bg: 'var(--safe-bg)', border: 'var(--safe-border)' },
  light: { en: 'Light rain possible in next 24h', bm: 'Hujan renyai mungkin dalam 24 jam', color: 'var(--brand-primary)', bg: 'var(--brand-surface)', border: 'var(--brand-border)' },
  moderate: { en: 'Moderate rain expected - watch drains & low roads', bm: 'Hujan sederhana dijangka - awasi longkang & jalan rendah', color: 'var(--advisory-text)', bg: 'var(--advisory-bg)', border: 'var(--advisory-border)' },
  heavy: { en: 'Heavy rain / thunderstorm - flash flood risk rises', bm: 'Hujan lebat / ribut petir - risiko banjir kilat meningkat', color: 'var(--danger-text)', bg: 'var(--danger-bg)', border: 'var(--danger-border)' }
} as const;

function timeAgo(ms: number, bm: boolean) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 1) return bm ? 'baru sahaja' : 'just now';
  return bm ? `${mins} min lalu` : `${mins} min ago`;
}

export const LiveWeatherCard: React.FC = () => {
  const { weather, weatherError, language, locating, locateMe, refreshFeeds, isRefreshing } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const bm = language === 'bm';

  if (weatherError === 'missing-key') {
    return (
      <div className="section-card weather-card">
        <div className="section-title"><CloudRain size={16} /> <span>{bm ? 'Cuaca & Jerebu (IPU) Langsung' : 'Live Weather & Haze (IPU)'}</span></div>
        <p className="weather-muted">Add <code>VITE_OPENWEATHER_API_KEY</code> to <code>.env.local</code>.</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="section-card weather-card">
        <div className="section-title"><CloudRain size={16} /> <span>{bm ? 'Cuaca & Jerebu (IPU) Langsung' : 'Live Weather & Haze (IPU)'}</span></div>
        <p className="weather-muted">{weatherError ? `⚠️ ${weatherError}` : (bm ? 'Memuatkan telemetri cuaca & IPU…' : 'Loading live weather & IPU telemetry…')}</p>
      </div>
    );
  }

  const outlook = OUTLOOK_TEXT[rainOutlook(weather)];
  const ipuMeta = getIpuMeta(weather.ipuCategory, bm);

  return (
    <div className="section-card weather-card">
      <div className="weather-card__head">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <Radio size={16} color="var(--danger-accent)" className="weather-live-dot" />
          <span>{bm ? 'Cuaca & Jerebu (IPU) Langsung' : 'Live Weather & Haze (IPU)'}</span>
        </div>
        <button className="weather-icon-btn" onClick={refreshFeeds} disabled={isRefreshing} title={bm ? 'Muat semula' : 'Refresh'}>
          <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
        </button>
      </div>

      <div className="weather-card__place">
        📍 {weather.placeName || '—'} · {bm ? 'dikemas kini' : 'updated'} {timeAgo(weather.fetchedAt, bm)}
        <button className="weather-link-btn" onClick={locateMe} disabled={locating}>
          <LocateFixed size={11} /> {locating ? (bm ? 'Mengimbas GPS…' : 'Scanning GPS…') : (bm ? 'Kemas kini GPS saya' : 'Update my GPS')}
        </button>
      </div>

      {weatherError && (
        <div
          style={{
            fontSize: '11.5px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--advisory-bg)',
            color: 'var(--advisory-text)',
            border: '1px solid var(--advisory-border)',
            fontWeight: 600
          }}
        >
          ⚠️ {weatherError}
        </div>
      )}

      <div className="weather-card__main">
        <img src={iconUrl(weather.icon)} alt={weather.description} width={64} height={64} />
        <div>
          <div className="weather-card__temp">{Math.round(weather.tempC)}°C</div>
          <div className="weather-card__desc">{weather.description}</div>
        </div>
      </div>

      <div className="weather-card__stats">
        <span><Thermometer size={13} /> {bm ? 'Terasa' : 'Feels'} {Math.round(weather.feelsLikeC)}°</span>
        <span><Droplets size={13} /> {weather.humidity}%</span>
        <span><Wind size={13} /> {(weather.windMs * 3.6).toFixed(0)} km/h</span>
        <span><CloudRain size={13} /> {weather.rain1hMm.toFixed(1)} mm/h</span>
      </div>

      {/* Collapsed short summary teaser */}
      {!isExpanded && (
        <div className="weather-card__compact-strip">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              color: ipuMeta.color
            }}
          >
            <Eye size={13} />
            {bm ? 'Indeks Jerebu:' : 'Haze Index:'} {weather.ipuIndex} ({ipuMeta.label})
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            💧 {bm ? 'Ramalan 24j:' : '24h rain:'} {weather.rain24hMm.toFixed(1)} mm
          </span>
        </div>
      )}

      {/* Drop Bar Toggle Button */}
      <button
        type="button"
        className="weather-card__drop-bar"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <span>
          {isExpanded
            ? (bm ? 'Tutup Ramalan & Analisis Penuh' : 'Show Less')
            : (bm ? 'Lihat Ramalan Penuh (IPU, Ramalan 24J & Jam)' : 'See More (Full Haze IPU, 24h & Hourly)')}
        </span>
        <ChevronDown size={15} className={`drop-bar__chevron ${isExpanded ? 'drop-bar__chevron--rotated' : ''}`} />
      </button>

      {/* Fully Expanded View: Malaysian DOE IPU, 24h Rain Outlook, Hourly Strip & Sources */}
      {isExpanded && (
        <div className="drop-bar__expanded-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Malaysian DOE IPU (Indeks Pencemaran Udara / Haze Index) Box */}
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
                {bm ? 'Indeks Jerebu (IPU Malaysia):' : 'Haze Index (Malaysia IPU):'} {weather.ipuIndex}
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
            <span className="weather-outlook__meta">
              {ipuMeta.advice} (PM2.5: {weather.pm25} µg/m³ · PM10: {weather.pm10} µg/m³)
            </span>
          </div>

          {/* Rain & Flood Outlook Box */}
          <div
            className="weather-outlook"
            style={{ color: outlook.color, background: outlook.bg, border: `1px solid ${outlook.border}` }}
          >
            <span>{bm ? outlook.bm : outlook.en}</span>
            <span className="weather-outlook__meta">
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
                <span>{new Date(f.time).toLocaleTimeString(bm ? 'ms-MY' : 'en-MY', { hour: 'numeric' })}</span>
                <img src={iconUrl(f.icon)} alt="" width={32} height={32} />
                <strong>{Math.round(f.tempC)}°</strong>
                <span className="weather-forecast__pop">💧{Math.round(f.rainChance * 100)}%</span>
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
