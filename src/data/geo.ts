import type { ScenarioData } from '../types';

const LAT_PER_UNIT = 0.00018; // ~20 m per grid unit
const LNG_PER_UNIT = 0.0002;
const METERS_PER_UNIT = 22;

export const toLatLng = (
  s: ScenarioData,
  x: number,
  y: number,
  realLat?: number,
  realLon?: number
) => {
  if (typeof realLat === 'number' && typeof realLon === 'number') {
    return { lat: realLat, lng: realLon };
  }
  return {
    lat: s.lat + (50 - y) * LAT_PER_UNIT,
    lng: s.lon + (x - 50) * LNG_PER_UNIT
  };
};

export const unitsToMeters = (units: number) => units * METERS_PER_UNIT;
