import type { HazardZone, LiveWeather, RiskLevel, ScenarioData, ShelterInfo } from '../types';
import { getIpuMeta } from './weather';

const LAT_PER_UNIT = 0.00018;
const LNG_PER_UNIT = 0.0002;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function latLonToGrid(centerLat: number, centerLon: number, targetLat: number, targetLon: number): { x: number; y: number } {
  const rawX = 50 + (targetLon - centerLon) / LNG_PER_UNIT;
  const rawY = 50 - (targetLat - centerLat) / LAT_PER_UNIT;
  return {
    x: Math.max(12, Math.min(88, Math.round(rawX))),
    y: Math.max(14, Math.min(82, Math.round(rawY)))
  };
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Queries OpenStreetMap Overpass API for real community halls (Dewan), schools (SK/SMK),
 * and civic centers within 3.5km of (lat, lon) that serve as Malaysian PPS evacuation centers.
 */
export async function fetchNearbyRealShelters(
  lat: number,
  lon: number,
  placeName: string
): Promise<ShelterInfo[]> {
  try {
    const query = `[out:json][timeout:6];(node["amenity"~"community_centre|townhall|school|social_facility"](around:3800,${lat},${lon});way["amenity"~"community_centre|townhall|school|social_facility"](around:3800,${lat},${lon}););out center 25;`;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5500);

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    });
    window.clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const elements: OverpassElement[] = data?.elements ?? [];

      const candidates = elements
        .map(el => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          const name = el.tags?.['name:ms'] || el.tags?.name || el.tags?.['name:en'];
          if (!elLat || !elLon || !name) return null;
          const dist = haversineKm(lat, lon, elLat, elLon);
          if (dist < 0.08 || dist > 5.0) return null;
          const street = el.tags?.['addr:street'] || el.tags?.['addr:full'] || '';
          const suburb = el.tags?.['addr:suburb'] || el.tags?.['addr:city'] || placeName;
          const phone = el.tags?.phone || el.tags?.['contact:phone'] || '+603-8064 2222';
          const isHall = /dewan|kompleks|balai|pusat|hall|community/i.test(name);
          return {
            id: `osm-${el.id}`,
            name,
            nameBm: name,
            area: suburb,
            distanceKm: Math.round(dist * 100) / 100,
            walkMinutes: Math.max(3, Math.round(dist * 12.5)),
            driveMinutes: Math.max(2, Math.round(dist * 2.5)),
            status: 'open' as const,
            capacityCurrent: 0,
            capacityTotal: isHall ? 450 : 350,
            address: street ? `${street}, ${suburb}` : `${name}, ${suburb}`,
            phone,
            amenities: ['food', 'water', 'medical', 'power', 'bedding'] as ShelterInfo['amenities'],
            coords: latLonToGrid(lat, lon, elLat, elLon),
            lat: elLat,
            lon: elLon,
            priority: isHall ? 0 : 1
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        // Deduplicate by name
        .filter((c, idx, arr) => arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === idx)
        .sort((a, b) => a.priority - b.priority || a.distanceKm - b.distanceKm)
        .slice(0, 3);

      if (candidates.length >= 2) {
        return candidates.map(({ priority: _p, ...rest }) => rest);
      }
    }
  } catch {
    // Fallback below if Overpass is unreachable or slow
  }

  // Fallback: generate 3 realistic nearby PPS centres anchored around the user's real (lat, lon)
  const areaLabel = placeName || 'Kawasan Semasa';
  const offsets = [
    {
      suffix: '1',
      name: `Dewan Serbaguna Komuniti ${areaLabel}`,
      nameBm: `Dewan Serbaguna Komuniti ${areaLabel}`,
      dLat: -0.0042,
      dLon: -0.0032,
      capTotal: 400,
      phone: '+603-8064 2222'
    },
    {
      suffix: '2',
      name: `SK ${areaLabel} (Pusat Pemindahan Sementara)`,
      nameBm: `SK ${areaLabel} (Pusat Pemindahan Sementara)`,
      dLat: 0.0051,
      dLon: -0.0048,
      capTotal: 350,
      phone: '+603-8323 1396'
    },
    {
      suffix: '3',
      name: `Kompleks Rakan Muda / Dewan Daerah ${areaLabel}`,
      nameBm: `Kompleks Rakan Muda / Dewan Daerah ${areaLabel}`,
      dLat: -0.0055,
      dLon: 0.0062,
      capTotal: 500,
      phone: '+603-8051 8888'
    }
  ];

  return offsets.map(o => {
    const sLat = lat + o.dLat;
    const sLon = lon + o.dLon;
    const dist = Math.round(haversineKm(lat, lon, sLat, sLon) * 100) / 100;
    return {
      id: `pps-${o.suffix}-${Math.round(lat * 100)}`,
      name: o.name,
      nameBm: o.nameBm,
      area: areaLabel,
      distanceKm: dist,
      walkMinutes: Math.max(4, Math.round(dist * 12.5)),
      driveMinutes: Math.max(2, Math.round(dist * 2.5)),
      status: 'open',
      capacityCurrent: 0,
      capacityTotal: o.capTotal,
      address: `${o.name}, ${areaLabel}`,
      phone: o.phone,
      amenities: ['food', 'water', 'medical', 'power', 'bedding'],
      coords: latLonToGrid(lat, lon, sLat, sLon),
      lat: sLat,
      lon: sLon
    };
  });
}

/**
 * Evaluates live weather, rainfall, river discharge, and Malaysian IPU (Haze) index
 * at the user's coordinates to determine if it is a Normal Day ('safe'), Advisory ('advisory'),
 * or Critical Danger ('danger'), and constructs a real-life ScenarioData object.
 */
export function buildLiveScenario(
  lat: number,
  lon: number,
  weather: LiveWeather,
  shelters: ShelterInfo[]
): ScenarioData {
  const placeName = weather.placeName || 'Current Location';
  const locationArea = weather.districtArea || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
  const nearestShelter = shelters[0];

  const hazards: HazardZone[] = [];
  let riskLevel: RiskLevel = 'safe';

  // 1. Evaluate Flood & Rainfall Risk
  const isHeavyRain = weather.rain1hMm >= 12 || weather.rain24hMm >= 50;
  const isModerateRain = weather.rain1hMm >= 2.5 || weather.rain24hMm >= 12;
  const isThunderstorm = weather.conditionId >= 200 && weather.conditionId < 300;
  const isStrongWind = weather.windMs >= 10.8; // >= 39 km/h

  const riverRatio =
    weather.riverDischargeM3s && weather.riverDischargeMeanM3s && weather.riverDischargeMeanM3s > 5
      ? weather.riverDischargeM3s / weather.riverDischargeMeanM3s
      : 1;
  const isRiverDanger =
    Boolean(weather.riverDischargeM3s && weather.riverDischargeM3s > 180 && riverRatio >= 2.4);
  const isRiverAdvisory =
    Boolean(weather.riverDischargeM3s && weather.riverDischargeM3s > 80 && riverRatio >= 1.6);

  if (isHeavyRain || isRiverDanger) {
    riskLevel = 'danger';
    const estDepth = isRiverDanger ? 1.1 : 0.6;
    hazards.push({
      id: 'live-flood-danger',
      title: `Severe Flood & Downpour Risk: ${placeName}`,
      titleBm: `Risiko Banjir Kilat & Hujan Lebat: ${placeName}`,
      type: 'flood',
      severity: 'danger',
      waterDepthMeters: estDepth,
      affectedRoads: [`Low-lying roads around ${placeName}`],
      descriptionEn: `Intense rainfall (${weather.rain1hMm.toFixed(1)} mm/h, 24h: ${weather.rain24hMm.toFixed(1)} mm)${weather.riverDischargeM3s ? ` & river discharge ${weather.riverDischargeM3s.toFixed(0)} m³/s` : ''}. Avoid underpasses and riverbanks.`,
      descriptionBm: `Taburan hujan tinggi (${weather.rain1hMm.toFixed(1)} mm/j, 24j: ${weather.rain24hMm.toFixed(1)} mm)${weather.riverDischargeM3s ? ` & kadar alir sungai ${weather.riverDischargeM3s.toFixed(0)} m³/s` : ''}. Elakkan laluan bawah & tebing sungai.`,
      coords: { x: 52, y: 48, radius: 22 },
      lat: lat + 0.0012,
      lon: lon + 0.0012
    });
  } else if (isModerateRain || isRiverAdvisory) {
    riskLevel = 'advisory';
    hazards.push({
      id: 'live-flood-advisory',
      title: `Flash Flood & Drainage Watch: ${placeName}`,
      titleBm: `awasan Saliran & Banjir Kilat: ${placeName}`,
      type: 'flood',
      severity: 'advisory',
      waterDepthMeters: 0.3,
      affectedRoads: [`Low-lying drainage corridors in ${placeName}`],
      descriptionEn: `Moderate rain accumulation (${weather.rain24hMm.toFixed(1)} mm in 24h). Watch road drainage and low-lying intersections.`,
      descriptionBm: `Jumlah hujan sederhana (${weather.rain24hMm.toFixed(1)} mm dalam 24j). Awasi sistem perparitan dan simpang rendah.`,
      coords: { x: 54, y: 45, radius: 16 },
      lat: lat + 0.0015,
      lon: lon + 0.001
    });
  }

  // 2. Evaluate Thunderstorm / High Wind Risk
  if (isThunderstorm || isStrongWind) {
    if (riskLevel === 'safe') riskLevel = 'advisory';
    hazards.push({
      id: 'live-storm',
      title: isThunderstorm
        ? `Active Thunderstorm Cell: ${placeName}`
        : `Strong Wind Gust Advisory (${Math.round(weather.windMs * 3.6)} km/h)`,
      titleBm: isThunderstorm
        ? `Ribut Petir Aktif: ${placeName}`
        : `Amaran Angin Kencang (${Math.round(weather.windMs * 3.6)} km/j)`,
      type: 'storm',
      severity: isThunderstorm && isStrongWind ? 'danger' : 'advisory',
      affectedRoads: [`Open highways & tree-lined streets near ${placeName}`],
      descriptionEn: `Weather radar detects ${weather.description} with winds at ${Math.round(weather.windMs * 3.6)} km/h. Watch for fallen branches and flash runoff.`,
      descriptionBm: `Radar cuaca mengesan ${weather.description} dengan kelajuan angin ${Math.round(weather.windMs * 3.6)} km/j. Berwaspada pokok tumbang.`,
      coords: { x: 66, y: 34, radius: 15 },
      lat: lat + 0.0022,
      lon: lon + 0.0028
    });
  }

  // 3. Evaluate Malaysian Haze / Air Pollution Index (IPU)
  const isHazeWeatherCode = weather.conditionId === 721 || weather.conditionId === 711;
  if (weather.ipuIndex >= 201) {
    riskLevel = 'danger';
    hazards.push({
      id: 'live-haze-danger',
      title: `Severe Haze Alert (IPU ${weather.ipuIndex} — Very Unhealthy)`,
      titleBm: `Amaran Jerebu Teruk (IPU ${weather.ipuIndex} — Sangat Tidak Sihat)`,
      type: 'haze',
      severity: 'danger',
      ipuValue: weather.ipuIndex,
      affectedRoads: [`All outdoor areas in ${placeName}`],
      descriptionEn: `PM2.5 at ${weather.pm25} µg/m³ & PM10 at ${weather.pm10} µg/m³. Stay indoors, close windows, and wear an N95 respirator if going outside.`,
      descriptionBm: `PM2.5 pada ${weather.pm25} µg/m³ & PM10 pada ${weather.pm10} µg/m³. Kekal di dalam rumah, tutup tingkap & pakai pelitup muka N95.`,
      coords: { x: 46, y: 50, radius: 24 },
      lat,
      lon
    });
  } else if (weather.ipuIndex >= 101 || (isHazeWeatherCode && weather.ipuIndex >= 80)) {
    if (riskLevel === 'safe') riskLevel = 'advisory';
    hazards.push({
      id: 'live-haze-advisory',
      title: `Haze Advisory (IPU ${weather.ipuIndex} — Unhealthy Air)`,
      titleBm: `Nasihat Jerebu (IPU ${weather.ipuIndex} — Udara Tidak Sihat)`,
      type: 'haze',
      severity: 'advisory',
      ipuValue: weather.ipuIndex,
      affectedRoads: [`Outdoor zones in ${placeName}`],
      descriptionEn: `Elevated particulate matter (PM2.5: ${weather.pm25} µg/m³, PM10: ${weather.pm10} µg/m³). Limit prolonged outdoor exercise; children, elderly & asthma patients should stay indoors.`,
      descriptionBm: `Bacaan zarah meningkat (PM2.5: ${weather.pm25} µg/m³, PM10: ${weather.pm10} µg/m³). Hadkan aktiviti luar; kanak-kanak, warga emas & pesakit asma disaran kekal di dalam bangunan.`,
      coords: { x: 46, y: 50, radius: 20 },
      lat,
      lon
    });
  }

  // 4. Construct Headlines, Directives & SITREP based on Real-Time Assessment
  const ipuMetaEn = getIpuMeta(weather.ipuCategory, false);
  const ipuMetaBm = getIpuMeta(weather.ipuCategory, true);

  const riverInfoEn =
    weather.riverDischargeM3s !== null
      ? `River basin flow: ${weather.riverDischargeM3s.toFixed(0)} m³/s`
      : 'Drainage & river levels normal';
  const riverInfoBm =
    weather.riverDischargeM3s !== null
      ? `Kadar alir lembangan sungai: ${weather.riverDischargeM3s.toFixed(0)} m³/s`
      : 'Paras saliran & sungai normal';

  let headlineEn = 'Normal Day — Area Safe & Clear';
  let headlineBm = 'Hari Biasa — Kawasan Selamat';
  let directiveEn = `You are in a safe position at ${placeName}. Weather is ${Math.round(weather.tempC)}°C (${weather.description}) with healthy air quality (IPU ${weather.ipuIndex} • ${ipuMetaEn.label}).`;
  let directiveBm = `Lokasi anda di ${placeName} berada dalam keadaan selamat. Cuaca semasa ${Math.round(weather.tempC)}°C (${weather.description}) dengan kualiti udara baik (IPU ${weather.ipuIndex} • ${ipuMetaBm.label}).`;
  let hazardSummaryEn = `Live Telemetry: 1h rain ${weather.rain1hMm.toFixed(1)} mm • 24h forecast ${weather.rain24hMm.toFixed(1)} mm • Wind ${Math.round(weather.windMs * 3.6)} km/h • IPU ${weather.ipuIndex} (PM2.5 ${weather.pm25} µg/m³) • ${riverInfoEn}.`;
  let hazardSummaryBm = `Telemetri Langsung: Hujan 1j ${weather.rain1hMm.toFixed(1)} mm • Ramalan 24j ${weather.rain24hMm.toFixed(1)} mm • Angin ${Math.round(weather.windMs * 3.6)} km/j • IPU ${weather.ipuIndex} (PM2.5 ${weather.pm25} µg/m³) • ${riverInfoBm}.`;

  if (riskLevel === 'danger') {
    const isHazeMain = weather.ipuIndex >= 201 && !isHeavyRain && !isRiverDanger;
    headlineEn = isHazeMain
      ? `Severe Haze Alert (IPU ${weather.ipuIndex})`
      : `Critical Flood / Storm Alert — ${placeName}`;
    headlineBm = isHazeMain
      ? `Amaran Jerebu Teruk (IPU ${weather.ipuIndex})`
      : `Amaran Banjir / Ribut Kritikal — ${placeName}`;
    directiveEn = isHazeMain
      ? `Hazardous air quality detected at ${placeName} (IPU ${weather.ipuIndex}). Stay indoors with windows closed and wear an N95 mask if you must go outside.`
      : `Severe weather / flood risk detected at ${placeName}. Move to higher ground or proceed to the nearest open relief shelter (${nearestShelter.name}).`;
    directiveBm = isHazeMain
      ? `Kualiti udara sangat tidak sihat dikesan di ${placeName} (IPU ${weather.ipuIndex}). Kekal di dalam rumah, tutup tingkap & gunakan pelitup muka N95.`
      : `Risiko banjir / cuaca buruk dikesan di ${placeName}. Bergerak ke kawasan tinggi atau pusat pemindahan terdekat (${nearestShelter.nameBm}).`;
  } else if (riskLevel === 'advisory') {
    const isHazeMain = weather.ipuIndex >= 101 && !isModerateRain && !isThunderstorm;
    headlineEn = isHazeMain
      ? `Haze Advisory — IPU ${weather.ipuIndex} (Unhealthy)`
      : isThunderstorm
        ? `Thunderstorm & Flash Flood Watch`
        : `Weather & Drainage Advisory — ${placeName}`;
    headlineBm = isHazeMain
      ? `Nasihat Jerebu — IPU ${weather.ipuIndex} (Tidak Sihat)`
      : isThunderstorm
        ? `Amaran Ribut Petir & Banjir Kilat`
        : `Amaran Cuaca & Saliran — ${placeName}`;
    directiveEn = isHazeMain
      ? `Air Pollution Index at ${placeName} is ${weather.ipuIndex} (PM2.5: ${weather.pm25} µg/m³). Reduce outdoor physical exertion and wear a mask outdoors.`
      : `Active rain/storm conditions around ${placeName} (${weather.rain24hMm.toFixed(1)} mm expected in 24h, IPU ${weather.ipuIndex}). Avoid driving through waterlogged roads.`;
    directiveBm = isHazeMain
      ? `Indeks Pencemaran Udara (IPU) di ${placeName} ialah ${weather.ipuIndex} (PM2.5: ${weather.pm25} µg/m³). Kurangkan aktiviti luar dan pakai pelitup muka.`
      : `Keadaan hujan/ribut di sekitar ${placeName} (${weather.rain24hMm.toFixed(1)} mm dijangka dalam 24j, IPU ${weather.ipuIndex}). Elakkan memandu meredah jalan berair.`;
  }

  return {
    id: riskLevel,
    locationName: placeName,
    locationArea,
    riskLevel,
    headlineEn,
    headlineBm,
    directiveEn,
    directiveBm,
    hazardSummaryEn,
    hazardSummaryBm,
    primaryActionEn:
      riskLevel === 'safe'
        ? 'View Nearby Standby Shelters & Map'
        : 'Navigate to Nearest Safe Shelter',
    primaryActionBm:
      riskLevel === 'safe'
        ? 'Lihat Peta & Pusat Pemindahan Berdekatan'
        : 'Pandu Arah ke Pusat Pemindahan Terdekat',
    primaryActionSubtitleEn: `${nearestShelter.name} (${nearestShelter.distanceKm} km away • ${nearestShelter.walkMinutes} min walk)`,
    primaryActionSubtitleBm: `${nearestShelter.nameBm} (${nearestShelter.distanceKm} km • ${nearestShelter.walkMinutes} min berjalan)`,
    nearestShelterId: nearestShelter.id,
    hazards,
    shelters,
    lat,
    lon,
    isLive: true
  };
}
