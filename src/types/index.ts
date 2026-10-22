export type Language = 'en' | 'bm';

export type RiskLevel = 'safe' | 'advisory' | 'danger';

export type IpuCategory = 'good' | 'moderate' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

export interface ShelterInfo {
  id: string;
  name: string;
  nameBm: string;
  area: string;
  distanceKm: number;
  walkMinutes: number;
  driveMinutes: number;
  status: 'open' | 'limited' | 'full';
  capacityCurrent: number;
  capacityTotal: number;
  address: string;
  phone: string;
  amenities: ('food' | 'water' | 'medical' | 'bedding' | 'power')[];
  coords: { x: number; y: number }; // Relative map coordinates (0-100) for SVG fallback
  lat?: number;
  lon?: number;
}

export interface HazardZone {
  id: string;
  title: string;
  titleBm: string;
  type: 'flood' | 'storm' | 'roadblock' | 'haze' | 'landslide';
  severity: RiskLevel;
  waterDepthMeters?: number;
  ipuValue?: number;
  affectedRoads: string[];
  descriptionEn: string;
  descriptionBm: string;
  coords: { x: number; y: number; radius: number };
  lat?: number;
  lon?: number;
}

export interface ScenarioData {
  id: RiskLevel;
  locationName: string;
  locationArea: string;
  riskLevel: RiskLevel;
  headlineEn: string;
  headlineBm: string;
  directiveEn: string;
  directiveBm: string;
  hazardSummaryEn: string;
  hazardSummaryBm: string;
  primaryActionEn: string;
  primaryActionBm: string;
  primaryActionSubtitleEn: string;
  primaryActionSubtitleBm: string;
  nearestShelterId: string;
  hazards: HazardZone[];
  shelters: ShelterInfo[];
  /** Real-world centre of the scenario area (verified via GPS / OpenWeather geocoding) */
  lat: number;
  lon: number;
  isLive?: boolean;
}

export interface WeatherForecastSlot {
  time: number;
  tempC: number;
  icon: string;
  rainChance: number; // 0..1
  rainMm: number;
}

export interface LiveWeather {
  placeName: string;
  districtArea?: string;
  description: string;
  icon: string;
  conditionId: number;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windMs: number;
  rain1hMm: number;
  rain24hMm: number;
  maxRainChance: number; // 0..1
  forecast: WeatherForecastSlot[];
  observedAt: number;
  fetchedAt: number;
  /** Malaysian DOE IPU (Indeks Pencemaran Udara / Air Pollution Index, 0-500+) */
  ipuIndex: number;
  ipuCategory: IpuCategory;
  pm25: number;
  pm10: number;
  dominantPollutant: 'PM2.5' | 'PM10' | 'O3' | 'CO' | 'NO2' | 'SO2';
  /** Live river discharge from Open-Meteo GloFAS Flood API (m3/s) */
  riverDischargeM3s: number | null;
  riverDischargeMeanM3s: number | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  verificationSummary?: string;
  sourcesChecked?: string[];
  steps?: string[];
  suggestions?: string[];
  source?: 'gemini' | 'offline';
}

export interface EmergencyContact {
  id: string;
  titleEn: string;
  titleBm: string;
  number: string;
  descriptionEn: string;
  descriptionBm: string;
  iconType: 'police' | 'fire' | 'civil' | 'welfare' | 'crescent';
  isPrimary?: boolean;
}
