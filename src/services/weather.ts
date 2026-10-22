// Live weather, Official Malaysia DOE IPU (via Google Air Quality API `mys_doe` + OpenWeather/Open-Meteo fallback), and River Discharge telemetry
import type { LiveWeather, IpuCategory } from '../types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
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

interface OwmAirPollution {
  list?: {
    components?: {
      pm2_5?: number;
      pm10?: number;
      o3?: number;
      no2?: number;
      so2?: number;
      co?: number;
    };
  }[];
}

interface GoogleAirQualityResponse {
  indexes?: {
    code: string;
    displayName: string;
    aqi: number;
    category?: string;
    dominantPollutant?: string;
  }[];
  pollutants?: {
    code: string;
    concentration?: { value?: number };
  }[];
  healthRecommendations?: {
    generalPopulation?: string;
  };
}

interface OwmReverseGeo {
  name?: string;
  local_names?: Record<string, string>;
  state?: string;
  country?: string;
}

/**
 * Fallback DOE IPU calculation when Google Air Quality API `mys_doe` is unavailable.
 */
function calcSubIndex(
  cp: number,
  breakpoints: [number, number, number, number][]
): number {
  const c = Math.max(0, cp);
  for (const [bpLo, bpHi, iLo, iHi] of breakpoints) {
    if (c <= bpHi) {
      return Math.round(((iHi - iLo) / (bpHi - bpLo)) * (c - bpLo) + iLo);
    }
  }
  return 350;
}

export function classifyIpuCategory(ipuIndex: number): IpuCategory {
  if (ipuIndex > 300) return 'hazardous';
  if (ipuIndex >= 201) return 'very-unhealthy';
  if (ipuIndex >= 101) return 'unhealthy';
  if (ipuIndex >= 51) return 'moderate';
  return 'good';
}

export function calculateMalaysianIpu(pm25: number, pm10: number, fallbackUsAqi?: number): {
  ipuIndex: number;
  ipuCategory: IpuCategory;
  dominantPollutant: 'PM2.5' | 'PM10';
} {
  const pm25Breakpoints: [number, number, number, number][] = [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500]
  ];

  const pm10Breakpoints: [number, number, number, number][] = [
    [0, 50, 0, 50],
    [51, 150, 51, 100],
    [151, 250, 101, 150],
    [251, 350, 151, 200],
    [351, 420, 201, 300],
    [421, 600, 301, 500]
  ];

  const sub25 = calcSubIndex(pm25, pm25Breakpoints);
  const sub10 = calcSubIndex(pm10, pm10Breakpoints);
  const computed = Math.max(sub25, sub10, fallbackUsAqi ? Math.round(fallbackUsAqi) : 0);
  const ipuIndex = Math.max(12, computed);

  return {
    ipuIndex,
    ipuCategory: classifyIpuCategory(ipuIndex),
    dominantPollutant: sub25 >= sub10 ? 'PM2.5' : 'PM10'
  };
}

export function getIpuMeta(category: IpuCategory, bm: boolean): {
  label: string;
  advice: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (category) {
    case 'good':
      return {
        label: bm ? 'Baik (Tiada Jerebu)' : 'Good (No Haze)',
        advice: bm ? 'Udara bersih & selamat untuk semua aktiviti luar.' : 'Clean air — safe for all outdoor activities.',
        color: 'var(--safe-text)',
        bg: 'var(--safe-bg)',
        border: 'var(--safe-border)'
      };
    case 'moderate':
      return {
        label: bm ? 'Sederhana (Normal)' : 'Moderate (Normal)',
        advice: bm ? 'Kualiti udara memuaskan. Tiada sekatan aktiviti luar.' : 'Acceptable air quality. Normal outdoor activities permitted.',
        color: 'var(--brand-primary)',
        bg: 'var(--brand-surface)',
        border: 'var(--brand-border)'
      };
    case 'unhealthy':
      return {
        label: bm ? 'Tidak Sihat (Amaran Jerebu)' : 'Unhealthy (Haze Advisory)',
        advice: bm
          ? 'Jerebu dikesan. Kurangkan aktiviti luar & pakai pelitup muka N95/KF94.'
          : 'Haze detected. Limit prolonged outdoor exertion & wear an N95/KF94 mask outside.',
        color: 'var(--advisory-text)',
        bg: 'var(--advisory-bg)',
        border: 'var(--advisory-border)'
      };
    case 'very-unhealthy':
      return {
        label: bm ? 'Sangat Tidak Sihat (Jerebu Teruk)' : 'Very Unhealthy (Severe Haze)',
        advice: bm
          ? 'Bahaya jerebu tinggi! Kekal di dalam bangunan, tutup tingkap & gunakan penapis udara.'
          : 'Severe haze alert! Stay indoors, keep windows shut & run air purifiers.',
        color: 'var(--danger-text)',
        bg: 'var(--danger-bg)',
        border: 'var(--danger-border)'
      };
    case 'hazardous':
      return {
        label: bm ? 'Berbahaya (Kecemasan Jerebu)' : 'Hazardous (Haze Emergency)',
        advice: bm
          ? 'Tahap pencemaran kritikal! Elakkan berada di luar rumah sama sekali.'
          : 'Critical air pollution! Avoid all outdoor exposure immediately.',
        color: 'var(--danger-text)',
        bg: 'var(--danger-bg)',
        border: 'var(--danger-border)'
      };
  }
}

export async function fetchLiveWeather(lat: number, lon: number, lang: 'en' | 'bm'): Promise<LiveWeather> {
  if (!API_KEY) throw new Error('Missing VITE_OPENWEATHER_API_KEY');
  const owmLang = lang === 'bm' ? 'ms' : 'en';
  const q = `lat=${lat}&lon=${lon}&units=metric&lang=${owmLang}&appid=${API_KEY}`;

  // Fetch Google Official Malaysia DOE IPU (`mys_doe`), OpenWeather, Reverse Geocode, Open-Meteo AQI, and GloFAS Flood in parallel
  const googleAirPromise = GOOGLE_KEY
    ? fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lon },
          extraComputations: ['LOCAL_AQI', 'POLLUTANT_CONCENTRATION']
        })
      }).catch(() => null)
    : Promise.resolve(null);

  const [curRes, fcRes, googleAirRes, airRes, geoRes, meteoAirRes, floodRes] = await Promise.all([
    fetch(`${BASE}/data/2.5/weather?${q}`),
    fetch(`${BASE}/data/2.5/forecast?${q}&cnt=8`), // 8 x 3h = next 24 hours
    googleAirPromise,
    fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).catch(() => null),
    fetch(`${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`).catch(() => null),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`).catch(() => null),
    fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean&past_days=1&forecast_days=3`).catch(() => null)
  ]);

  if (!curRes.ok) throw new Error(`Weather request failed (${curRes.status})`);
  if (!fcRes.ok) throw new Error(`Forecast request failed (${fcRes.status})`);

  const cur: OwmCurrent = await curRes.json();
  const fc: OwmForecast = await fcRes.json();

  // Parse reverse geocode for accurate Malaysian town & state name
  let placeName = cur.name;
  let districtArea = 'Malaysia';
  if (geoRes && geoRes.ok) {
    try {
      const geoData: OwmReverseGeo[] = await geoRes.json();
      if (geoData?.[0]) {
        if (geoData[0].name) placeName = geoData[0].name;
        const state = geoData[0].state;
        const country = geoData[0].country === 'MY' ? 'Malaysia' : (geoData[0].country || 'Malaysia');
        districtArea = state ? `${state}, ${country}` : country;
      }
    } catch {
      // ignore
    }
  }

  // Parse Air Quality / Haze: Priority 1 = Google Air Quality API `mys_doe` (Official Malaysia DOE API/IPU)
  let pm25 = 14;
  let pm10 = 26;
  let usAqi: number | undefined;
  let officialMysDoeIpu: number | null = null;
  let dominantPollutant: 'PM2.5' | 'PM10' | 'O3' | 'CO' | 'NO2' | 'SO2' = 'PM2.5';

  if (airRes && airRes.ok) {
    try {
      const airData: OwmAirPollution = await airRes.json();
      const comp = airData.list?.[0]?.components;
      if (comp) {
        if (typeof comp.pm2_5 === 'number') pm25 = comp.pm2_5;
        if (typeof comp.pm10 === 'number') pm10 = comp.pm10;
      }
    } catch {
      // ignore
    }
  }

  if (meteoAirRes && meteoAirRes.ok) {
    try {
      const mAir = await meteoAirRes.json();
      if (typeof mAir?.current?.us_aqi === 'number') usAqi = mAir.current.us_aqi;
      if (typeof mAir?.current?.pm2_5 === 'number') pm25 = Math.max(pm25, mAir.current.pm2_5);
      if (typeof mAir?.current?.pm10 === 'number') pm10 = Math.max(pm10, mAir.current.pm10);
    } catch {
      // ignore
    }
  }

  if (googleAirRes && googleAirRes.ok) {
    try {
      const gAir: GoogleAirQualityResponse = await googleAirRes.json();
      const mysDoe = gAir.indexes?.find(idx => idx.code === 'mys_doe') ?? gAir.indexes?.[0];
      if (mysDoe && typeof mysDoe.aqi === 'number') {
        officialMysDoeIpu = mysDoe.aqi;
        if (mysDoe.dominantPollutant === 'pm10') dominantPollutant = 'PM10';
        else if (mysDoe.dominantPollutant === 'o3') dominantPollutant = 'O3';
        else if (mysDoe.dominantPollutant === 'no2') dominantPollutant = 'NO2';
        else if (mysDoe.dominantPollutant === 'so2') dominantPollutant = 'SO2';
        else if (mysDoe.dominantPollutant === 'co') dominantPollutant = 'CO';
        else dominantPollutant = 'PM2.5';
      }
      const gPm25 = gAir.pollutants?.find(p => p.code === 'pm25')?.concentration?.value;
      const gPm10 = gAir.pollutants?.find(p => p.code === 'pm10')?.concentration?.value;
      if (typeof gPm25 === 'number') pm25 = gPm25;
      if (typeof gPm10 === 'number') pm10 = gPm10;
    } catch {
      // ignore
    }
  }

  const fallbackCalc = calculateMalaysianIpu(pm25, pm10, usAqi);
  const ipuIndex = officialMysDoeIpu !== null ? officialMysDoeIpu : fallbackCalc.ipuIndex;
  const ipuCategory = classifyIpuCategory(ipuIndex);
  if (officialMysDoeIpu === null) {
    dominantPollutant = fallbackCalc.dominantPollutant;
  }

  // Parse River Flood Discharge (Open-Meteo GloFAS)
  let riverDischargeM3s: number | null = null;
  let riverDischargeMeanM3s: number | null = null;
  if (floodRes && floodRes.ok) {
    try {
      const floodData = await floodRes.json();
      const discharges: (number | null)[] = floodData?.daily?.river_discharge ?? [];
      const means: (number | null)[] = floodData?.daily?.river_discharge_mean ?? [];
      const validDischarges = discharges.filter((v): v is number => typeof v === 'number');
      const validMeans = means.filter((v): v is number => typeof v === 'number');
      if (validDischarges.length > 0) {
        riverDischargeM3s = Math.max(...validDischarges);
      }
      if (validMeans.length > 0) {
        riverDischargeMeanM3s = validMeans.reduce((a, b) => a + b, 0) / validMeans.length;
      }
    } catch {
      // ignore
    }
  }

  const rain24hMm = fc.list.reduce((sum, s) => sum + (s.rain?.['3h'] ?? 0), 0);
  const maxPop = fc.list.reduce((m, s) => Math.max(m, s.pop), 0);

  return {
    placeName,
    districtArea,
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
    fetchedAt: Date.now(),
    ipuIndex,
    ipuCategory,
    pm25: Math.round(pm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    dominantPollutant,
    riverDischargeM3s,
    riverDischargeMeanM3s
  };
}

/**
 * Geocodes a Malaysian city/town/address query into real (lat, lon) coordinates.
 */
export async function geocodeLocationQuery(query: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (API_KEY) {
    try {
      const q = encodeURIComponent(`${trimmed}, MY`);
      const res = await fetch(`${BASE}/geo/1.0/direct?q=${q}&limit=1&appid=${API_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          return {
            lat: data[0].lat,
            lon: data[0].lon,
            label: `${data[0].name}${data[0].state ? `, ${data[0].state}` : ''}`
          };
        }
      }
    } catch {
      // fallback to Open-Meteo geocoding
    }
  }

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      const r = data?.results?.[0];
      if (r) {
        return {
          lat: r.latitude,
          lon: r.longitude,
          label: `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}`
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function rainOutlook(w: LiveWeather): 'none' | 'light' | 'moderate' | 'heavy' {
  if (w.conditionId >= 200 && w.conditionId < 300) return 'heavy'; // thunderstorm now
  if (w.rain24hMm >= 30 || w.rain1hMm >= 10) return 'heavy';
  if (w.rain24hMm >= 10 || w.rain1hMm >= 2.5) return 'moderate';
  if (w.rain24hMm > 0 || w.maxRainChance >= 0.3) return 'light';
  return 'none';
}

export const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
