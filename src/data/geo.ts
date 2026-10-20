import type { ScenarioData } from '../types';

/**
 * The demo scenarios lay shelters/hazards out on a 0-100 grid. These helpers anchor that grid
 * onto the real scenario location so it can be drawn on a real map.
 * The shelter/hazard positions are ILLUSTRATIVE demo data, not surveyed coordinates.
 */
const LAT_PER_UNIT = 0.00018; // ~20 m per grid unit
const LNG_PER_UNIT = 0.0002;
const METERS_PER_UNIT = 22;

export const toLatLng = (s: ScenarioData, x: number, y: number) => ({
  lat: s.lat + (50 - y) * LAT_PER_UNIT,
  lng: s.lon + (x - 50) * LNG_PER_UNIT
});

export const unitsToMeters = (units: number) => units * METERS_PER_UNIT;
