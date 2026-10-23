import React, { useState } from 'react';
import {
  Navigation,
  Phone,
  Coffee,
  Droplets,
  Activity,
  BatteryCharging,
  Home,
  Plus,
  Minus,
  Crosshair,
  ChevronUp,
  ChevronDown,
  LocateFixed,
  Radio,
  Mountain,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ShelterInfo } from '../types';
import { GoogleMapView, type RouteInfo } from './GoogleMapView';
import { hasGoogleKey } from '../services/googleMaps';

export const MapScreen: React.FC = () => {
  const {
    language,
    currentScenario,
    selectedShelter,
    setSelectedShelter,
    locateMe,
    locating,
    searchLocation,
    weather,
    t
  } = useApp();
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const [filter, setFilter] = useState<'all' | 'hazards' | 'shelters'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSheetMinimized, setIsSheetMinimized] = useState<boolean>(false);

  const [googleError, setGoogleError] = useState<string | null>(null);
  const useGoogle = hasGoogleKey() && !googleError;
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [elevation, setElevation] = useState<{ shelter: number | null; user: number | null }>({ shelter: null, user: null });
  const [recenterSignal, setRecenterSignal] = useState(0);

  const userCoord = { x: 50, y: 50 };

  const handleShelterClick = (shelter: ShelterInfo) => {
    setSelectedShelter(shelter);
    setIsSheetMinimized(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.35, 2.4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.35, 0.9));
  };

  const handleRecenter = () => {
    setZoomLevel(1);
    setRecenterSignal(n => n + 1);
  };

  const handleLocateAndCenter = () => {
    locateMe();
    setRecenterSignal(n => n + 1);
  };

  const handleStartNavigation = () => {
    if (!selectedShelter) return;
    if (typeof selectedShelter.lat === 'number' && typeof selectedShelter.lon === 'number') {
      const origin = `${currentScenario.lat},${currentScenario.lon}`;
      const dest = `${selectedShelter.lat},${selectedShelter.lon}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`,
        '_blank'
      );
      return;
    }
    const query = encodeURIComponent(`${selectedShelter.name}, ${selectedShelter.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="map-screen-layout">
      {/* 1. Map Header Toolbar */}
      <div className="map-header-toolbar">
        {/* Filter Pills */}
        <div className="map-filter-group">
          <button
            className={`map-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t.mapFilterAll} ({currentScenario.shelters.length})
          </button>
          <button
            className={`map-filter-pill ${filter === 'shelters' ? 'active' : ''}`}
            onClick={() => setFilter('shelters')}
          >
            {t.mapFilterShelters} ({currentScenario.shelters.length})
          </button>
        </div>

        {/* Map Control Actions */}
        <div className="map-action-controls" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {showMapSearch ? (
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!mapSearchQuery.trim()) return;
                const ok = await searchLocation(mapSearchQuery);
                if (ok) {
                  setMapSearchQuery('');
                  setShowMapSearch(false);
                  setRecenterSignal(n => n + 1);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <input
                type="text"
                value={mapSearchQuery}
                onChange={e => setMapSearchQuery(e.target.value)}
                placeholder={language === 'bm' ? 'Cari bandar (cth. Ipoh, Perak)...' : 'Search town (e.g. Ipoh, Perak)...'}
                autoFocus
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  width: '140px'
                }}
              />
              <button
                type="submit"
                className="map-filter-pill active"
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {language === 'bm' ? 'Cari' : 'Go'}
              </button>
              <button
                type="button"
                className="map-ctrl-btn"
                onClick={() => setShowMapSearch(false)}
                style={{ padding: '4px' }}
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="map-filter-pill"
              onClick={() => setShowMapSearch(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 8px' }}
              title={language === 'bm' ? 'Cari bandar atau negeri' : 'Search city or state'}
            >
              <Search size={13} />
              <span>{language === 'bm' ? 'Cari' : 'Search'}</span>
            </button>
          )}

          <button
            className="map-filter-pill active"
            onClick={handleLocateAndCenter}
            disabled={locating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
            title={language === 'bm' ? 'Kesan lokasi GPS saya' : 'Detect my live GPS location'}
          >
            <LocateFixed size={13} className={locating ? 'spin-icon' : ''} />
            <span>{locating ? 'GPS…' : 'GPS'}</span>
          </button>
          <button
            className="map-ctrl-btn"
            onClick={handleRecenter}
            title="Recenter on your location"
          >
            <Crosshair size={16} />
          </button>
          {!useGoogle && (
            <>
              <button
                className="map-ctrl-btn"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                className="map-ctrl-btn"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Hero Interactive Map Viewport */}
      <div className="map-viewport-frame">
        {/* Floating Legend */}
        <div className="map-floating-legend">
          <span style={{ color: 'var(--map-user-pin)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--map-user-pin)', display: 'inline-block' }} />
            {t.youAreHere}
          </span>
          <span style={{ color: 'var(--map-shelter-pin)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--map-shelter-pin)', display: 'inline-block' }} />
            Shelter
          </span>
        </div>

        {useGoogle && (
          <GoogleMapView
            scenario={currentScenario}
            userGrid={userCoord}
            selectedShelter={selectedShelter}
            filter={filter}
            language={language}
            recenterSignal={recenterSignal}
            youAreHere={t.youAreHere}
            onSelectShelter={handleShelterClick}
            onRoute={setRoute}
            onElevation={(shelter, user) => setElevation({ shelter, user })}
            onFail={setGoogleError}
          />
        )}

        {/* High Resolution SVG Vector Canvas Fallback */}
        {!useGoogle && (
          <svg
            className="map-svg-canvas"
            viewBox="0 0 100 85"
            preserveAspectRatio="xMidYMid slice"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--map-water)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="var(--map-water-dark)" stopOpacity="0.95" />
              </linearGradient>

              <radialGradient id="dangerFlood" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--danger-badge)" stopOpacity="0.55" />
                <stop offset="70%" stopColor="var(--danger-accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--danger-badge)" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="advisoryFlood" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--advisory-badge)" stopOpacity="0.5" />
                <stop offset="70%" stopColor="var(--advisory-accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--advisory-badge)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="100" height="85" fill="var(--map-land)" />

            <line x1="0" y1="15" x2="100" y2="15" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
            <line x1="0" y1="36" x2="100" y2="36" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
            <line x1="0" y1="70" x2="100" y2="70" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
            <line x1="18" y1="0" x2="18" y2="85" stroke="var(--map-road-secondary)" strokeWidth="1.2" />
            <line x1="75" y1="0" x2="75" y2="85" stroke="var(--map-road-secondary)" strokeWidth="1.2" />

            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--map-road-major)" strokeWidth="3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--map-road-stripe)" strokeWidth="1.2" strokeDasharray="2 2" />

            <path d="M 0,28 Q 50,32 100,24" fill="none" stroke="var(--map-road-artery)" strokeWidth="3.2" />
            <path d="M 0,28 Q 50,32 100,24" fill="none" stroke="var(--map-road-artery-stripe)" strokeWidth="1.2" />

            <line x1="48" y1="0" x2="48" y2="85" stroke="var(--map-road-major)" strokeWidth="2.8" />
            <line x1="48" y1="0" x2="48" y2="85" stroke="var(--map-road-stripe)" strokeWidth="1" strokeDasharray="2 2" />

            <path
              d="M -5,8 Q 30,18 55,10 T 105,18"
              fill="none"
              stroke="url(#riverGradient)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />

            {/* Hazard layer removed from SVG map */}

            {selectedShelter && (
              <g>
                <path
                  d={`M ${userCoord.x} ${userCoord.y} Q 36 56, ${selectedShelter.coords.x} ${selectedShelter.coords.y}`}
                  fill="none"
                  stroke="var(--map-route)"
                  strokeWidth="2.4"
                  strokeDasharray="3 2"
                  strokeLinecap="round"
                />
                <rect
                  x="32"
                  y="52"
                  width="22"
                  height="4.4"
                  rx="2.2"
                  fill="var(--map-route)"
                />
                <text
                  x="43"
                  y="55.2"
                  textAnchor="middle"
                  fill="var(--on-vivid)"
                  fontSize="2.2"
                  fontWeight="800"
                >
                  {selectedShelter.walkMinutes}m walk ({selectedShelter.distanceKm}km)
                </text>
              </g>
            )}

            {(filter === 'all' || filter === 'shelters') && currentScenario.shelters.map(s => {
              const isSelected = selectedShelter?.id === s.id;
              return (
                <g
                  key={s.id}
                  onClick={() => handleShelterClick(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={s.coords.x}
                    cy={s.coords.y}
                    r="4.2"
                    fill={isSelected ? 'var(--brand-primary)' : 'var(--map-shelter-pin)'}
                    stroke="var(--bg-surface)"
                    strokeWidth="1.2"
                  />
                  <text
                    x={s.coords.x}
                    y={s.coords.y + 1.2}
                    textAnchor="middle"
                    fill="var(--on-vivid)"
                    fontSize="3.4"
                    fontWeight="bold"
                  >
                    H
                  </text>

                  <rect
                    x={s.coords.x - 18}
                    y={s.coords.y + 6}
                    width="36"
                    height="5"
                    rx="2"
                    fill={isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)'}
                    stroke={isSelected ? 'var(--brand-primary)' : 'var(--border-strong)'}
                    strokeWidth="0.6"
                  />
                  <text
                    x={s.coords.x}
                    y={s.coords.y + 9.5}
                    textAnchor="middle"
                    fill={isSelected ? 'var(--on-vivid)' : 'var(--text-primary)'}
                    fontSize="2.1"
                    fontWeight="700"
                  >
                    {s.name.length > 14 ? `${s.name.substring(0, 13)}...` : s.name} ({s.capacityCurrent}/{s.capacityTotal})
                  </text>
                </g>
              );
            })}

            <g>
              <circle
                cx={userCoord.x}
                cy={userCoord.y}
                r="3.8"
                fill="var(--map-user-pin)"
                stroke="var(--bg-surface)"
                strokeWidth="1.4"
              />
              <circle
                cx={userCoord.x}
                cy={userCoord.y}
                r="1.6"
                fill="var(--on-vivid)"
              />

              <rect
                x={userCoord.x - 12}
                y={userCoord.y - 8.5}
                width="24"
                height="4.2"
                rx="2.1"
                fill="var(--text-primary)"
              />
              <text
                x={userCoord.x}
                y={userCoord.y - 5.6}
                textAnchor="middle"
                fill="var(--text-inverse)"
                fontSize="2.2"
                fontWeight="800"
              >
                {t.youAreHere}
              </text>
            </g>
          </svg>
        )}

        {/* Live Telemetry Badge */}
        <div
          className="tabular-mono"
          style={{
            position: 'absolute',
            top: useGoogle ? 48 : 8,
            right: 8,
            zIndex: 5,
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '4px 9px',
            borderRadius: 'var(--radius-xs)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Radio size={11} color="var(--brand-primary)" />
          <span>GPS: {currentScenario.locationName}</span>
          {weather && (
            <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
              · IPU {weather.ipuIndex}
            </span>
          )}
        </div>

        {/* 3. Floating Shelter Drawer at Bottom */}
        {selectedShelter && (
          <>
            {!isSheetMinimized && (
              <div
                className="map-sheet-backdrop"
                onClick={() => setIsSheetMinimized(true)}
                aria-hidden="true"
              />
            )}
            <div className={`floating-shelter-sheet ${isSheetMinimized ? 'floating-shelter-sheet--minimized' : ''}`}>
              <div className="shelter-sheet-top-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedShelter.status === 'open' ? 'var(--safe-bg)' : 'var(--advisory-bg)',
                      color: selectedShelter.status === 'open' ? 'var(--safe-text)' : 'var(--advisory-text)',
                      flexShrink: 0
                    }}
                  >
                    {selectedShelter.status === 'open' ? t.openStatus : t.limitedStatus}
                  </span>
                  <span className="tabular-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {route
                      ? `${(route.meters / 1000).toFixed(2)} km • ${Math.max(1, Math.round(route.seconds / 60))} ${t.walkMin}`
                      : `${selectedShelter.distanceKm} km • ${selectedShelter.walkMinutes} ${t.walkMin}`}
                  </span>
                </div>

                <button
                  type="button"
                  className="shelter-sheet-toggle-btn"
                  onClick={() => setIsSheetMinimized(!isSheetMinimized)}
                  title={isSheetMinimized ? 'Expand Shelter Details' : 'Minimize to View Full Map'}
                  aria-label={isSheetMinimized ? 'Expand Shelter Details' : 'Minimize to View Full Map'}
                >
                  {isSheetMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              <div style={{ marginTop: '4px' }}>
                <div className="shelter-sheet-title">
                  {language === 'bm' ? selectedShelter.nameBm : selectedShelter.name}
                </div>
                {!isSheetMinimized && (
                  <div className="shelter-sheet-sub">
                    {selectedShelter.address}
                    {useGoogle && elevation.shelter !== null && (
                      <div className="tabular-mono" style={{ marginTop: 4, fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <Mountain size={12} />
                        <span>{language === 'bm' ? 'Altitud' : 'Elevation'}: {Math.round(elevation.shelter)} m</span>
                        {elevation.user !== null && (
                          <span style={{ color: elevation.shelter >= elevation.user ? 'var(--safe-accent)' : 'var(--advisory-accent)' }}>
                            ({elevation.shelter >= elevation.user ? '▲' : '▼'} {Math.abs(Math.round(elevation.shelter - elevation.user))} m {language === 'bm' ? 'berbanding anda' : 'vs you'})
                          </span>
                        )}
                      </div>
                    )}
                    {useGoogle && route && (
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--advisory-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                        <span>
                          {language === 'bm'
                            ? 'Laluan Google tidak mengelak kawasan banjir. Semak keadaan jalan sebelum bergerak.'
                            : 'Google route does not avoid flooded areas. Check road conditions before moving.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isSheetMinimized && (
                <>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                      <span>{t.capacity}</span>
                      <span>
                        {selectedShelter.capacityCurrent} / {selectedShelter.capacityTotal} ({selectedShelter.capacityTotal - selectedShelter.capacityCurrent} {t.spotsLeft})
                      </span>
                    </div>
                    <div className="capacity-bar-container">
                      <div
                        className="capacity-bar-fill"
                        style={{
                          width: `${(selectedShelter.capacityCurrent / selectedShelter.capacityTotal) * 100}%`,
                          background: selectedShelter.capacityCurrent / selectedShelter.capacityTotal > 0.8 ? 'var(--advisory-badge)' : 'var(--safe-badge)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="shelter-amenities-row">
                    {selectedShelter.amenities.includes('food') && (
                      <span className="amenity-badge">
                        <Coffee size={12} /> Food Pack
                      </span>
                    )}
                    {selectedShelter.amenities.includes('water') && (
                      <span className="amenity-badge">
                        <Droplets size={12} /> Clean Water
                      </span>
                    )}
                    {selectedShelter.amenities.includes('medical') && (
                      <span className="amenity-badge">
                        <Activity size={12} color="var(--danger-accent)" /> First-Aid
                      </span>
                    )}
                    {selectedShelter.amenities.includes('power') && (
                      <span className="amenity-badge">
                        <BatteryCharging size={12} /> Phone Charging
                      </span>
                    )}
                    {selectedShelter.amenities.includes('bedding') && (
                      <span className="amenity-badge">
                        <Home size={12} /> Bedding
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="shelter-action-grid" style={{ marginTop: isSheetMinimized ? '8px' : '4px' }}>
                <button
                  className="btn btn--primary"
                  onClick={handleStartNavigation}
                >
                  <Navigation size={15} />
                  <span>{t.navigateBtn}</span>
                </button>
                <a
                  href={`tel:${selectedShelter.phone}`}
                  className="btn btn--secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <Phone size={15} />
                  <span>{t.callShelterBtn}</span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
