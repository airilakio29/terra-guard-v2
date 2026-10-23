import React, { useEffect, useRef, useState } from 'react';
import type { ScenarioData, ShelterInfo } from '../types';
import { loadGoogleMaps, fetchWalkRoute } from '../services/googleMaps';
import { toLatLng, unitsToMeters } from '../data/geo';

export interface RouteInfo {
  meters: number;
  seconds: number;
}

interface Props {
  scenario: ScenarioData;
  userGrid: { x: number; y: number };
  selectedShelter: ShelterInfo;
  filter: 'all' | 'hazards' | 'shelters';
  language: 'en' | 'bm';
  recenterSignal: number;
  youAreHere: string;
  onSelectShelter: (s: ShelterInfo) => void;
  onRoute: (r: RouteInfo | null) => void;
  onElevation: (shelterM: number | null, userM: number | null) => void;
  onFail: (reason: string) => void;
}

type MapKind = 'roadmap' | 'terrain' | 'hybrid';

const LABELS = {
  en: { roadmap: 'Map', terrain: 'Terrain', hybrid: 'Satellite', traffic: 'Traffic' },
  bm: { roadmap: 'Peta', terrain: 'Rupa Bumi', hybrid: 'Satelit', traffic: 'Trafik' }
};

const getVar = (name: string, fallback = '') => {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const pill = (text: string, bg: string, fg: string, border = 'var(--border-subtle)') => {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};border-radius:var(--radius-xs);padding:3px 9px;font:700 11px system-ui,sans-serif;white-space:nowrap;box-shadow:var(--shadow-sm);`;
  return el;
};

export const GoogleMapView: React.FC<Props> = ({
  scenario, userGrid, selectedShelter, filter, language, recenterSignal, youAreHere,
  onSelectShelter, onRoute, onElevation, onFail
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);
  const [ready, setReady] = useState(false);
  const [mapKind, setMapKind] = useState<MapKind>('roadmap');
  const [traffic, setTraffic] = useState(false);

  const userPos = scenario.isLive
    ? { lat: scenario.lat, lng: scenario.lon }
    : toLatLng(scenario, userGrid.x, userGrid.y);
  const center = { lat: scenario.lat, lng: scenario.lon };

  // 1. Create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps();
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        await google.maps.importLibrary('marker');
        await google.maps.importLibrary('geometry');
        if (cancelled || !hostRef.current) return;
        mapRef.current = new Map(hostRef.current, {
          center,
          zoom: 15,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false
        });
        setReady(true);
      } catch (e) {
        onFail(e instanceof Error ? e.message : 'unknown');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Map type + traffic layer
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setMapTypeId(mapKind);
    if (!trafficRef.current) trafficRef.current = new google.maps.TrafficLayer();
    trafficRef.current.setMap(traffic ? map : null);
  }, [ready, mapKind, traffic]);

  // 3. Recenter when live coordinates change or user taps recenter
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.panTo({ lat: scenario.lat, lng: scenario.lon });
    mapRef.current.setZoom(15);
  }, [ready, scenario.id, scenario.lat, scenario.lon, recenterSignal]);

  // 4. Hazards, shelters, user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const cleanups: (() => void)[] = [];

    const dangerColor = getVar('--danger-accent');
    const advisoryColor = getVar('--advisory-accent');
    const safeColor = getVar('--safe-accent');
    const brandColor = getVar('--brand-primary');

    if (filter === 'all' || filter === 'hazards') {
      scenario.hazards.forEach(h => {
        const c = toLatLng(scenario, h.coords.x, h.coords.y, h.lat, h.lon);
        const color = h.severity === 'danger' ? dangerColor : advisoryColor;
        const radiusM = unitsToMeters(h.coords.radius);

        // Generate realistic 8-vertex hazard polygon contour
        const latDelta = radiusM / 111320;
        const lngDelta = radiusM / (111320 * Math.cos(c.lat * (Math.PI / 180)));
        const hash = h.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const polyCoords: google.maps.LatLngLiteral[] = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i * 2 * Math.PI) / 8;
          const variance = 0.82 + (((hash * (i + 1) * 31) % 100) / 100) * 0.32;
          polyCoords.push({
            lat: c.lat + Math.sin(angle) * latDelta * variance * 0.85,
            lng: c.lng + Math.cos(angle) * lngDelta * variance,
          });
        }

        const polygon = new google.maps.Polygon({
          map,
          paths: polyCoords,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.35,
        });

        const badgeText = h.ipuValue
          ? `🌫️ IPU ${h.ipuValue}`
          : h.waterDepthMeters
            ? `⚠️ ${h.waterDepthMeters} m depth`
            : '⚠️ Hazard';
        const label = new google.maps.marker.AdvancedMarkerElement({
          map, position: c,
          content: pill(badgeText, 'var(--bg-surface)', 'var(--text-primary)', color),
          title: language === 'bm' ? h.titleBm : h.title
        });
        cleanups.push(() => { polygon.setMap(null); label.map = null; });
      });
    }

    if (filter === 'all' || filter === 'shelters') {
      scenario.shelters.forEach(s => {
        const sel = s.id === selectedShelter.id;
        const shortName = s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name;
        const m = new google.maps.marker.AdvancedMarkerElement({
          map, position: toLatLng(scenario, s.coords.x, s.coords.y, s.lat, s.lon),
          content: pill(`🏠 ${shortName} (${s.capacityCurrent}/${s.capacityTotal})`, sel ? brandColor : safeColor, 'var(--on-vivid)', 'var(--on-vivid)'),
          title: `${s.name} (${s.capacityCurrent}/${s.capacityTotal} cap)`,
          zIndex: sel ? 10 : 1
        });
        m.addListener('gmp-click', () => onSelectShelter(s));
        cleanups.push(() => { m.map = null; });
      });
    }

    const me = new google.maps.marker.AdvancedMarkerElement({
      map, position: userPos, content: pill(`📍 ${youAreHere}`, 'var(--text-primary)', 'var(--text-inverse)', brandColor), zIndex: 20
    });
    cleanups.push(() => { me.map = null; });

    return () => cleanups.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scenario, filter, selectedShelter.id, language, youAreHere]);

  // 5. Real walking route + elevation to the selected shelter
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    let line: google.maps.Polyline | null = null;
    const dest = toLatLng(scenario, selectedShelter.coords.x, selectedShelter.coords.y, selectedShelter.lat, selectedShelter.lon);
    const routeColor = getVar('--map-route');

    fetchWalkRoute(userPos, dest)
      .then(r => {
        if (cancelled) return;
        line = new google.maps.Polyline({
          map, path: google.maps.geometry.encoding.decodePath(r.encodedPolyline),
          strokeColor: routeColor, strokeWeight: 6, strokeOpacity: 0.9
        });
        onRoute({ meters: r.meters, seconds: r.seconds });
      })
      .catch(() => { if (!cancelled) onRoute(null); });

    google.maps.importLibrary('elevation').then(lib => {
      const { ElevationService } = lib as google.maps.ElevationLibrary;
      return new ElevationService().getElevationForLocations({ locations: [dest, userPos] });
    }).then(res => {
      if (!cancelled) onElevation(res.results[0]?.elevation ?? null, res.results[1]?.elevation ?? null);
    }).catch(() => { if (!cancelled) onElevation(null, null); });

    return () => { cancelled = true; line?.setMap(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scenario.id, scenario.lat, scenario.lon, selectedShelter.id]);

  const L = LABELS[language];
  const btn = (active: boolean): React.CSSProperties => ({
    border: 'none', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? 'var(--brand-primary)' : 'var(--bg-surface)', color: active ? 'var(--on-vivid)' : 'var(--text-primary)'
  });

  return (
    <>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      {ready && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', gap: 8, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', borderRadius: 'var(--radius-xs)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
            {(['roadmap', 'terrain', 'hybrid'] as MapKind[]).map(k => (
              <button key={k} style={btn(mapKind === k)} onClick={() => setMapKind(k)}>{L[k]}</button>
            ))}
          </div>
          <div style={{ borderRadius: 'var(--radius-xs)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
            <button style={btn(traffic)} onClick={() => setTraffic(t => !t)}>🚦 {L.traffic}</button>
          </div>
        </div>
      )}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {language === 'bm' ? 'Memuatkan Google Maps…' : 'Loading Google Maps…'}
        </div>
      )}
    </>
  );
};
