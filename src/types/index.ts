export type Language = 'en' | 'bm';

export type RiskLevel = 'safe' | 'advisory' | 'danger';

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
  coords: { x: number; y: number }; // Relative map coordinates (0-100)
}

export interface HazardZone {
  id: string;
  title: string;
  titleBm: string;
  type: 'flood' | 'storm' | 'roadblock';
  severity: RiskLevel;
  waterDepthMeters?: number;
  affectedRoads: string[];
  descriptionEn: string;
  descriptionBm: string;
  coords: { x: number; y: number; radius: number };
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
  /** Real-world centre of the scenario area (verified via OpenWeather geocoding) */
  lat: number;
  lon: number;
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
