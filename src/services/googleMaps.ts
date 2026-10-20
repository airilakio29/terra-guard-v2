// Google Maps loader + Routes API helper
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const hasGoogleKey = () => Boolean(KEY);

let loadPromise: Promise<void> | null = null;

/** Loads the Maps JavaScript API once. Rejects on missing key / auth failure / network error. */
export function loadGoogleMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error('missing-key'));
  if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const w = window as unknown as { gm_authFailure?: () => void; __gmapsReady?: () => void };
    w.gm_authFailure = () => {
      loadPromise = null;
      reject(new Error('auth-failure'));
    };
    w.__gmapsReady = () => resolve();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly&loading=async&callback=__gmapsReady`;
    s.async = true;
    s.onerror = () => {
      loadPromise = null;
      reject(new Error('network'));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

export interface WalkRoute {
  meters: number;
  seconds: number;
  encodedPolyline: string;
}

/**
 * Real walking route via Google Routes API.
 * NOTE: Google routing knows nothing about our flood zones - it does NOT avoid flooded roads.
 */
export async function fetchWalkRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<WalkRoute> {
  if (!KEY) throw new Error('missing-key');
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
      destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
      travelMode: 'WALK'
    })
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) throw new Error('No route found');
  return {
    meters: r.distanceMeters,
    seconds: parseInt(String(r.duration), 10),
    encodedPolyline: r.polyline.encodedPolyline
  };
}
