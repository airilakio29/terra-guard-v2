/**
 * Official Malaysia Department of Environment (DOE / JAS) APIMS Service
 * Queries the 68 official national air quality monitoring stations from APIMS
 * (Air Pollutant Index Management System — https://eqms.doe.gov.my/APIMS/main).
 *
 * Implements:
 * - Nearest station lookup using Haversine GPS geodesics
 * - Manual state-level station filtering
 * - Strict Malaysian DOE IPU band classification (0-50, 51-100, 101-200, 201-300, 301+)
 * - Dominant sub-index pollutant identification (PM2.5, PM10, O3, NO2, SO2, CO)
 * - Offline cached fallback with age telemetry
 * - Zero hardcoded colors (theme token driven)
 */

import type { DoeStationRecord, IpuCategory } from '../types';
import fallbackStationsRaw from '../data/doeStationsFallback.json';

const CACHE_KEY = 'terra_doe_apims_cache_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (APIMS updates hourly)

export interface ApimsResponse {
  stations: DoeStationRecord[];
  nearestStation: DoeStationRecord;
  source: 'live-doe-apims' | 'cached-doe-apims' | 'offline-doe-apims' | 'waqi-relay';
  fetchedAt: number;
  cacheAgeMinutes: number;
  isStale: boolean;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Official Malaysian Department of Environment (DOE) IPU Band Classification
 * 0 - 50: Good (Baik)
 * 51 - 100: Moderate (Sederhana)
 * 101 - 200: Unhealthy (Tidak Sihat)
 * 201 - 300: Very Unhealthy (Sangat Tidak Sihat)
 * 301+: Hazardous (Berbahaya)
 */
export function classifyMalaysianIpu(ipu: number): IpuCategory {
  if (ipu > 300) return 'hazardous';
  if (ipu >= 201) return 'very-unhealthy';
  if (ipu >= 101) return 'unhealthy';
  if (ipu >= 51) return 'moderate';
  return 'good';
}

/**
 * Maps APIMS parameter symbols to standardized dominant pollutant codes
 * ** = PM2.5, * = PM10, a = SO2, b = NO2, c = O3, d = CO
 */
export function parseParamSymbol(symbol?: string, selected?: string): 'PM2.5' | 'PM10' | 'O3' | 'CO' | 'NO2' | 'SO2' {
  if (symbol === '**' || selected?.toUpperCase() === 'PM2.5') return 'PM2.5';
  if (symbol === '*' || selected?.toUpperCase() === 'PM10') return 'PM10';
  if (symbol === 'c' || selected?.toUpperCase() === 'O3') return 'O3';
  if (symbol === 'b' || selected?.toUpperCase() === 'NO2') return 'NO2';
  if (symbol === 'a' || selected?.toUpperCase() === 'SO2') return 'SO2';
  if (symbol === 'd' || selected?.toUpperCase() === 'CO') return 'CO';
  return 'PM2.5';
}

export interface IpuBandAdvice {
  label: string;
  advice: string;
  action: string;
  colorVar: string;
  bgVar: string;
  borderVar: string;
}

export function getMalaysianIpuAdvice(category: IpuCategory, bm: boolean): IpuBandAdvice {
  switch (category) {
    case 'good':
      return {
        label: bm ? 'Baik' : 'Good',
        advice: bm
          ? 'Kualiti udara bersih & sihat. Tiada sekatan untuk semua aktiviti luar.'
          : 'Clean & healthy air quality. No restrictions on any outdoor activity.',
        action: bm ? 'Aktiviti luar digalakkan' : 'Normal outdoor activities',
        colorVar: 'var(--safe-text)',
        bgVar: 'var(--safe-bg)',
        borderVar: 'var(--safe-border)'
      };
    case 'moderate':
      return {
        label: bm ? 'Sederhana' : 'Moderate',
        advice: bm
          ? 'Kualiti udara memuaskan. Golongan sensitif dinasihatkan memantau simptom.'
          : 'Acceptable air quality. Sensitive individuals should monitor respiratory symptoms.',
        action: bm ? 'Aktiviti luar biasa dibenarkan' : 'Normal activities permitted',
        colorVar: 'var(--brand-primary)',
        bgVar: 'var(--brand-surface)',
        borderVar: 'var(--brand-border)'
      };
    case 'unhealthy':
      return {
        label: bm ? 'Tidak Sihat' : 'Unhealthy',
        advice: bm
          ? 'Jerebu dikesan! Kurangkan aktiviti fizikal berat di luar dan pakai pelitup muka N95/KF94.'
          : 'Haze detected! Limit strenuous outdoor exertion and wear an N95/KF94 particulate respirator outside.',
        action: bm ? 'Pakai pelitup N95 di luar' : 'Wear N95 mask outdoors',
        colorVar: 'var(--advisory-text)',
        bgVar: 'var(--advisory-bg)',
        borderVar: 'var(--advisory-border)'
      };
    case 'very-unhealthy':
      return {
        label: bm ? 'Sangat Tidak Sihat' : 'Very Unhealthy',
        advice: bm
          ? 'Amaran jerebu teruk! Kekal di dalam bangunan, tutup semua tingkap & pasang penapis udara HEPA.'
          : 'Severe haze alert! Stay indoors, keep all windows shut, and run HEPA air purifiers.',
        action: bm ? 'Kekal di dalam bangunan' : 'Stay indoors with closed windows',
        colorVar: 'var(--danger-text)',
        bgVar: 'var(--danger-bg)',
        borderVar: 'var(--danger-border)'
      };
    case 'hazardous':
      return {
        label: bm ? 'Berbahaya' : 'Hazardous',
        advice: bm
          ? 'Tahap kecemasan pencemaran udara kritikal! Elakkan semua pendedahan luar sama sekali.'
          : 'Emergency-level air pollution! Avoid all outdoor exposure completely. Follow civil defense broadcast.',
        action: bm ? 'Kecemasan jerebu' : 'Emergency condition',
        colorVar: 'var(--danger-text)',
        bgVar: 'var(--danger-bg)',
        borderVar: 'var(--danger-border)'
      };
  }
}

function parseRawFeatures(features: Array<{ attributes: Record<string, unknown> }>): DoeStationRecord[] {
  return features.map(f => {
    const a = f.attributes;
    const ipuNum = typeof a.API === 'number' ? a.API : Number(a.API) || 50;
    const dominant = parseParamSymbol(
      typeof a.PARAM_SYMBOL === 'string' ? a.PARAM_SYMBOL : undefined,
      typeof a.PARAM_SELECTED === 'string' ? a.PARAM_SELECTED : undefined
    );

    return {
      stationId: String(a.STATION_ID || ''),
      stationLocation: String(a.STATION_LOCATION || 'Malaysia Station'),
      stateName: String(a.STATE_NAME || 'Selangor'),
      place: typeof a.PLACE === 'string' ? a.PLACE : undefined,
      lat: Number(a.LATITUDE) || 3.05,
      lon: Number(a.LONGITUDE) || 101.58,
      ipu: ipuNum,
      category: classifyMalaysianIpu(ipuNum),
      dominantPollutant: dominant,
      datetimeMs: typeof a.DATETIME === 'number' ? a.DATETIME : Date.now()
    };
  });
}

function getFallbackStations(): DoeStationRecord[] {
  return (fallbackStationsRaw as Array<Record<string, unknown>>).map(s => {
    const ipuNum = typeof s.ipu === 'number' ? s.ipu : 50;
    return {
      stationId: String(s.stationId || ''),
      stationLocation: String(s.stationLocation || ''),
      stateName: String(s.stateName || ''),
      place: typeof s.place === 'string' ? s.place : undefined,
      lat: Number(s.lat) || 3.05,
      lon: Number(s.lon) || 101.58,
      ipu: ipuNum,
      category: classifyMalaysianIpu(ipuNum),
      dominantPollutant: parseParamSymbol(String(s.paramSymbol || '**'), String(s.paramSelected || 'PM2.5')),
      datetimeMs: typeof s.datetime === 'number' ? s.datetime : Date.now()
    };
  });
}

/**
 * Fetches the 68 official Malaysian monitoring stations from DOE APIMS
 * with Haversine distance ranking and failover caching.
 */
export async function fetchDoeApimsTelemetry(
  userLat = 3.0515,
  userLon = 101.5823,
  stateFilter?: string
): Promise<ApimsResponse> {
  let stations: DoeStationRecord[] = [];
  let source: ApimsResponse['source'] = 'live-doe-apims';
  let fetchedAt = Date.now();
  let cacheAgeMinutes = 0;

  // 1. Try Live Serverless / Dev Proxy / Direct APIMS
  const endpoints = ['/api/apims'];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.features) && json.features.length > 0) {
          stations = parseRawFeatures(json.features);
          source = 'live-doe-apims';
          fetchedAt = Date.now();

          // Save to local cache
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                stations,
                cachedAt: fetchedAt
              })
            );
          } catch {
            // LocalStorage quota or restricted
          }
          break;
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 2. Try LocalStorage Cache
  if (stations.length === 0) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed.stations) && parsed.stations.length > 0) {
          stations = parsed.stations;
          fetchedAt = Number(parsed.cachedAt) || Date.now();
          cacheAgeMinutes = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
          source = 'cached-doe-apims';
        }
      }
    } catch {
      // LocalStorage error
    }
  }

  // 3. Fallback to Verified Offline Station Snapshot
  if (stations.length === 0) {
    stations = getFallbackStations();
    source = 'offline-doe-apims';
    fetchedAt = stations[0]?.datetimeMs || Date.now();
    cacheAgeMinutes = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
  }

  // Attach geodetic distance from user location
  stations = stations.map(s => ({
    ...s,
    distKm: Math.round(haversineKm(userLat, userLon, s.lat, s.lon) * 10) / 10
  }));

  // Apply state filter if user selected a specific state
  let filtered = stations;
  if (stateFilter && stateFilter !== 'all') {
    const cleanState = stateFilter.toLowerCase().trim();
    const stateMatched = stations.filter(s => s.stateName.toLowerCase().includes(cleanState));
    if (stateMatched.length > 0) {
      filtered = stateMatched;
    }
  }

  // Sort by nearest distance
  const sorted = [...filtered].sort((a, b) => (a.distKm ?? 0) - (b.distKm ?? 0));
  const nearestStation = sorted[0] || stations[0];

  return {
    stations: sorted,
    nearestStation,
    source,
    fetchedAt,
    cacheAgeMinutes,
    isStale: source !== 'live-doe-apims' || cacheAgeMinutes > Math.round(CACHE_TTL_MS / 60000)
  };
}

/**
 * Returns distinct Malaysian states that have DOE monitoring stations
 */
export function getMalaysianStatesWithStations(stations: DoeStationRecord[]): string[] {
  const set = new Set<string>();
  for (const s of stations) {
    if (s.stateName) set.add(s.stateName);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
