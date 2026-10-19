// Live weather from OpenWeatherMap (free tier endpoints: /data/2.5/weather, /data/2.5/forecast, /geo/1.0)
import type { LiveWeather } from '../types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const BASE = 'https://api.openweathermap.org';

export const hasWeatherKey = () => Boolean(API_KEY);

interface OwmCurrent {
  name: string;
  weather: { id: number; main: string; description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  rain?: { '1h'?: number };
  dt: number;
}

interface OwmForecast {
  list: {
    dt: number;
    pop: number;
    rain?: { '3h'?: number };
    weather: { description: string; icon: string }[];
    main: { temp: number };
  }[];
}

export async function fetchLiveWeather(lat: number, lon: number, lang: 'en' | 'bm'): Promise<LiveWeather> {
  if (!API_KEY) throw new Error('Missing VITE_OPENWEATHER_API_KEY');
  const owmLang = lang === 'bm' ? 'ms' : 'en';
  const q = `lat=${lat}&lon=${lon}&units=metric&lang=${owmLang}&appid=${API_KEY}`;

  const [curRes, fcRes] = await Promise.all([
    fetch(`${BASE}/data/2.5/weather?${q}`),
    fetch(`${BASE}/data/2.5/forecast?${q}&cnt=8`) // 8 x 3h = next 24 hours
  ]);
  if (!curRes.ok) throw new Error(`Weather request failed (${curRes.status})`);
  if (!fcRes.ok) throw new Error(`Forecast request failed (${fcRes.status})`);

  const cur: OwmCurrent = await curRes.json();
  const fc: OwmForecast = await fcRes.json();

  const rain24hMm = fc.list.reduce((sum, s) => sum + (s.rain?.['3h'] ?? 0), 0);
  const maxPop = fc.list.reduce((m, s) => Math.max(m, s.pop), 0);

  return {
    placeName: cur.name,
    description: cur.weather[0]?.description ?? '',
    icon: cur.weather[0]?.icon ?? '01d',
    conditionId: cur.weather[0]?.id ?? 800,
    tempC: cur.main.temp,
    feelsLikeC: cur.main.feels_like,
    humidity: cur.main.humidity,
    windMs: cur.wind.speed,
    rain1hMm: cur.rain?.['1h'] ?? 0,
    rain24hMm,
    maxRainChance: maxPop,
    forecast: fc.list.slice(0, 6).map(s => ({
      time: s.dt * 1000,
      tempC: s.main.temp,
      icon: s.weather[0]?.icon ?? '01d',
      rainChance: s.pop,
      rainMm: s.rain?.['3h'] ?? 0
    })),
    observedAt: cur.dt * 1000,
    fetchedAt: Date.now()
  };
}

/**
 * Simple rain-outlook indicator derived from the OpenWeather forecast.
 * Thresholds are our own heuristic (not an official MetMalaysia scale) and
 * this is NOT an official warning - official alerts come from MetMalaysia / NADMA.
 */
export function rainOutlook(w: LiveWeather): 'none' | 'light' | 'moderate' | 'heavy' {
  if (w.conditionId >= 200 && w.conditionId < 300) return 'heavy'; // thunderstorm now
  if (w.rain24hMm >= 30 || w.rain1hMm >= 10) return 'heavy';
  if (w.rain24hMm >= 10 || w.rain1hMm >= 2.5) return 'moderate';
  if (w.rain24hMm > 0 || w.maxRainChance >= 0.3) return 'light';
  return 'none';
}

export const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
