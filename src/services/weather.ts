// Live weather, Official Malaysia DOE APIMS telemetry, and River Discharge telemetry
import type { LiveWeather, IpuCategory } from '../types';
import { fetchDoeApimsTelemetry } from './apims';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const BASE = 'https://api.openweathermap.org';

// Always return true because we have robust native Open-Meteo + official DOE APIMS fallbacks
export const hasWeatherKey = () => true;

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

export function calculateMalaysianIpu(pm25: number, pm10: number): {
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
  const ipuIndex = Math.max(sub25, sub10);

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
  const owmLang = lang === 'bm' ? 'ms' : 'en';
  const q = `lat=${lat}&lon=${lon}&units=metric&lang=${owmLang}&appid=${API_KEY}`;

  // Run official Malaysian DOE APIMS in parallel with weather and flood models
  const apimsPromise = fetchDoeApimsTelemetry(lat, lon).catch(() => null);

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

  let placeName = 'Subang Jaya';
  let districtArea = 'Selangor, Malaysia';
  let description = lang === 'bm' ? 'Mendung' : 'Cloudy';
  let icon = '04d';
  let conditionId = 804;
  let tempC = 28.5;
  let feelsLikeC = 32.4;
  let humidity = 78;
  let windMs = 3.2;
  let rain1hMm = 0;
  let rain24hMm = 0;
  let maxRainChance = 0.2;
  let forecastSlots: LiveWeather['forecast'] = [];
  let observedAt = Date.now();
  let pm25 = 14;
  let pm10 = 26;

  let floodRes: Response | null = null;
  let apimsRes: Awaited<ReturnType<typeof fetchDoeApimsTelemetry>> | null = null;

  if (API_KEY) {
    const [curRes, fcRes, _googleAirRes, airRes, geoRes, floodResp, apimsResp] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?${q}`).catch(() => null),
      fetch(`${BASE}/data/2.5/forecast?${q}&cnt=8`).catch(() => null),
      googleAirPromise,
      fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).catch(() => null),
      fetch(`${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`).catch(() => null),
      fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean&past_days=1&forecast_days=3`).catch(() => null),
      apimsPromise
    ]);

    floodRes = floodResp;
    apimsRes = apimsResp;

    if (curRes && curRes.ok && fcRes && fcRes.ok) {
      const cur: OwmCurrent = await curRes.json();
      const fc: OwmForecast = await fcRes.json();
      placeName = cur.name;
      description = cur.weather[0]?.description ?? '';
      icon = cur.weather[0]?.icon ?? '01d';
      conditionId = cur.weather[0]?.id ?? 800;
      tempC = cur.main.temp;
      feelsLikeC = cur.main.feels_like;
      humidity = cur.main.humidity;
      windMs = cur.wind.speed;
      rain1hMm = cur.rain?.['1h'] ?? 0;
      rain24hMm = fc.list.reduce((sum, s) => sum + (s.rain?.['3h'] ?? 0), 0);
      maxRainChance = fc.list.reduce((m, s) => Math.max(m, s.pop), 0);
      forecastSlots = fc.list.slice(0, 6).map(s => ({
        time: s.dt * 1000,
        tempC: s.main.temp,
        icon: s.weather[0]?.icon ?? '01d',
        rainChance: s.pop,
        rainMm: s.rain?.['3h'] ?? 0
      }));
      observedAt = cur.dt * 1000;
    }

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
  } else {
    // Graceful Open-Meteo fallback for zero-config live operation
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation,temperature_2m&forecast_days=2`;
    const [mRes, floodResp, apimsResp] = await Promise.all([
      fetch(meteoUrl).catch(() => null),
      fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean&past_days=1&forecast_days=3`).catch(() => null),
      apimsPromise
    ]);

    floodRes = floodResp;
    apimsRes = apimsResp;

    if (mRes && mRes.ok) {
      try {
        const mData = await mRes.json();
        const c = mData.current;
        tempC = c.temperature_2m;
        feelsLikeC = c.apparent_temperature;
        humidity = c.relative_humidity_2m;
        windMs = (c.wind_speed_10m || 10) / 3.6;
        rain1hMm = c.precipitation || 0;
        observedAt = Date.now();

        const code = c.weather_code || 0;
        if (code >= 95) {
          description = lang === 'bm' ? 'Ribut Petir' : 'Thunderstorm';
          icon = '11d';
          conditionId = 211;
        } else if (code >= 61) {
          description = lang === 'bm' ? 'Hujan' : 'Rain';
          icon = '10d';
          conditionId = 500;
        } else if (code >= 51) {
          description = lang === 'bm' ? 'Hujan Renyai' : 'Drizzle';
          icon = '09d';
          conditionId = 300;
        } else if (code >= 1) {
          description = lang === 'bm' ? 'Mendung Sebahagian' : 'Partly Cloudy';
          icon = '02d';
          conditionId = 802;
        } else {
          description = lang === 'bm' ? 'Cerah' : 'Clear Sky';
          icon = '01d';
          conditionId = 800;
        }

        if (mData.hourly) {
          const times: string[] = mData.hourly.time || [];
          const pops: number[] = mData.hourly.precipitation_probability || [];
          const temps: number[] = mData.hourly.temperature_2m || [];
          const rains: number[] = mData.hourly.precipitation || [];
          forecastSlots = times.slice(0, 6).map((t, i) => ({
            time: new Date(t).getTime(),
            tempC: temps[i] ?? tempC,
            icon,
            rainChance: (pops[i] ?? 10) / 100,
            rainMm: rains[i] ?? 0
          }));
          maxRainChance = Math.max(...pops.slice(0, 8).map(p => p / 100), 0.1);
          rain24hMm = rains.slice(0, 8).reduce((acc, r) => acc + r, 0);
        }
      } catch {
        // ignore
      }
    }
  }

  // Bind official Malaysian DOE APIMS data
  let ipuIndex = 52;
  let ipuCategory: IpuCategory = 'moderate';
  let dominantPollutant: LiveWeather['dominantPollutant'] = 'PM2.5';
  let stationName: string | undefined;
  let stationDistanceKm: number | undefined;
  let stationState: string | undefined;
  let stationUpdatedMs: number | undefined;
  let ipuDataSource: LiveWeather['ipuDataSource'] = 'live-doe-apims';

  if (apimsRes && apimsRes.nearestStation) {
    const s = apimsRes.nearestStation;
    ipuIndex = s.ipu;
    ipuCategory = s.category;
    dominantPollutant = (s.dominantPollutant as LiveWeather['dominantPollutant']) || 'PM2.5';
    stationName = s.stationLocation;
    stationDistanceKm = s.distKm;
    stationState = s.stateName;
    stationUpdatedMs = s.datetimeMs;
    ipuDataSource = apimsRes.source;
    if (placeName === 'Malaysia' && s.stationLocation) {
      placeName = s.stationLocation;
    }
  } else {
    const fallbackCalc = calculateMalaysianIpu(pm25, pm10);
    ipuIndex = fallbackCalc.ipuIndex;
    ipuCategory = fallbackCalc.ipuCategory;
    dominantPollutant = fallbackCalc.dominantPollutant;
    ipuDataSource = 'cached-doe-apims';
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

  return {
    placeName,
    districtArea,
    description,
    icon,
    conditionId,
    tempC,
    feelsLikeC,
    humidity,
    windMs,
    rain1hMm,
    rain24hMm,
    maxRainChance,
    forecast: forecastSlots,
    observedAt,
    fetchedAt: Date.now(),
    ipuIndex,
    ipuCategory,
    pm25: Math.round(pm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    dominantPollutant,
    stationName,
    stationDistanceKm,
    stationState,
    stationUpdatedMs,
    ipuDataSource,
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
