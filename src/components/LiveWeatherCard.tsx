import React from 'react';
import { CloudRain, Droplets, Wind, Thermometer, LocateFixed, X, RotateCw, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { iconUrl, rainOutlook } from '../services/weather';

const OUTLOOK_TEXT = {
  none: { en: 'No rain expected in next 24h', bm: 'Tiada hujan dijangka 24 jam akan datang', color: '#059669', bg: '#ECFDF5' },
  light: { en: 'Light rain possible in next 24h', bm: 'Hujan renyai mungkin dalam 24 jam', color: '#0284C7', bg: '#F0F9FF' },
  moderate: { en: 'Moderate rain expected - watch drains & low roads', bm: 'Hujan sederhana dijangka - awasi longkang & jalan rendah', color: '#D97706', bg: '#FFFBEB' },
  heavy: { en: 'Heavy rain / thunderstorm - flash flood risk rises', bm: 'Hujan lebat / ribut petir - risiko banjir kilat meningkat', color: '#DC2626', bg: '#FEF2F2' }
} as const;

function timeAgo(ms: number, bm: boolean) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 1) return bm ? 'baru sahaja' : 'just now';
  return bm ? `${mins} min lalu` : `${mins} min ago`;
}

export const LiveWeatherCard: React.FC = () => {
  const { weather, weatherError, language, userLocation, locating, locateMe, clearMyLocation, refreshFeeds, isRefreshing } = useApp();
  const bm = language === 'bm';

  if (weatherError === 'missing-key') {
    return (
      <div className="section-card weather-card">
        <div className="section-title"><CloudRain size={16} /> <span>{bm ? 'Cuaca Langsung' : 'Live Weather'}</span></div>
        <p className="weather-muted">Add <code>VITE_OPENWEATHER_API_KEY</code> to <code>.env.local</code>.</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="section-card weather-card">
        <div className="section-title"><CloudRain size={16} /> <span>{bm ? 'Cuaca Langsung' : 'Live Weather'}</span></div>
        <p className="weather-muted">{weatherError ? `⚠️ ${weatherError}` : (bm ? 'Memuatkan data cuaca…' : 'Loading live weather…')}</p>
      </div>
    );
  }

  const outlook = OUTLOOK_TEXT[rainOutlook(weather)];

  return (
    <div className="section-card weather-card">
      <div className="weather-card__head">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <Radio size={16} color="#DC2626" className="weather-live-dot" />
          <span>{bm ? 'Cuaca Langsung' : 'Live Weather'}</span>
        </div>
        <button className="weather-icon-btn" onClick={refreshFeeds} disabled={isRefreshing} title={bm ? 'Muat semula' : 'Refresh'}>
          <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
        </button>
      </div>

      <div className="weather-card__place">
        📍 {weather.placeName || '—'} · {bm ? 'dikemas kini' : 'updated'} {timeAgo(weather.fetchedAt, bm)}
        {userLocation ? (
          <button className="weather-link-btn" onClick={clearMyLocation}><X size={11} /> {bm ? 'Guna lokasi senario' : 'Use scenario location'}</button>
        ) : (
          <button className="weather-link-btn" onClick={locateMe} disabled={locating}>
            <LocateFixed size={11} /> {locating ? (bm ? 'Mencari…' : 'Locating…') : (bm ? 'Guna lokasi saya' : 'Use my location')}
          </button>
        )}
      </div>

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

      <div className="weather-outlook" style={{ color: outlook.color, background: outlook.bg }}>
        {bm ? outlook.bm : outlook.en}
        <span className="weather-outlook__meta">
          {bm ? 'Jumlah 24j' : '24h total'}: {weather.rain24hMm.toFixed(1)} mm · {bm ? 'Peluang maks' : 'Max chance'}: {Math.round(weather.maxRainChance * 100)}%
        </span>
      </div>

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
          ? 'Sumber: OpenWeather. Penunjuk sahaja - rujuk amaran rasmi MetMalaysia / NADMA.'
          : 'Source: OpenWeather. Indicator only - follow official MetMalaysia / NADMA warnings.'}
      </div>
    </div>
  );
};
