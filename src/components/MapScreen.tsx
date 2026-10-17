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
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ShelterInfo } from '../types';

export const MapScreen: React.FC = () => {
  const { 
    language, 
    currentScenario, 
    selectedShelter, 
    setSelectedShelter, 
    t 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'hazards' | 'shelters'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSheetMinimized, setIsSheetMinimized] = useState<boolean>(false);

  // User's relative coordinates (0-100)
  const userCoord = { x: 45, y: 65 };

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
  };

  const handleStartNavigation = () => {
    if (!selectedShelter) return;
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
            {t.mapFilterAll} ({currentScenario.hazards.length + currentScenario.shelters.length})
          </button>
          <button 
            className={`map-filter-pill ${filter === 'hazards' ? 'active' : ''}`}
            onClick={() => setFilter('hazards')}
          >
            {t.mapFilterHazards} ({currentScenario.hazards.length})
          </button>
          <button 
            className={`map-filter-pill ${filter === 'shelters' ? 'active' : ''}`}
            onClick={() => setFilter('shelters')}
          >
            {t.mapFilterShelters} ({currentScenario.shelters.length})
          </button>
        </div>

        {/* Map Control Actions */}
        <div className="map-action-controls">
          <button 
            className="map-ctrl-btn" 
            onClick={handleRecenter}
            title="Recenter on your location"
          >
            <Crosshair size={16} />
          </button>
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
        </div>
      </div>

      {/* 2. Hero Interactive Map Viewport (Takes 100% of remaining space!) */}
      <div className="map-viewport-frame">
        {/* Floating Legend */}
        <div className="map-floating-legend">
          <span style={{ color: '#0284C7', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284C7', display: 'inline-block' }} /> 
            {t.youAreHere}
          </span>
          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#059669', display: 'inline-block' }} /> 
            Shelter
          </span>
          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} /> 
            Hazard
          </span>
        </div>

        {/* High Resolution SVG Vector Canvas */}
        <svg 
          className="map-svg-canvas" 
          viewBox="0 0 100 85" 
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* River Gradient */}
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
            </linearGradient>

            {/* Danger Flood Gradient */}
            <radialGradient id="dangerFlood" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#F87171" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>

            {/* Advisory Flood Gradient */}
            <radialGradient id="advisoryFlood" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#FBBF24" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Land / District background grid */}
          <rect width="100" height="85" fill="#E8EDF2" />

          {/* Secondary road vectors */}
          <line x1="0" y1="15" x2="100" y2="15" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="0" y1="36" x2="100" y2="36" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="18" y1="0" x2="18" y2="85" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="75" y1="0" x2="75" y2="85" stroke="#CBD5E1" strokeWidth="1.2" />

          {/* Major Expressways / Arteries */}
          {/* Persiaran Kewajipan */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#94A3B8" strokeWidth="3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#F8FAFC" strokeWidth="1.2" strokeDasharray="2 2" />

          {/* KESAS Expressway */}
          <path d="M 0,28 Q 50,32 100,24" fill="none" stroke="#64748B" strokeWidth="3.2" />
          <path d="M 0,28 Q 50,32 100,24" fill="none" stroke="#FEF08A" strokeWidth="1.2" />

          {/* Jalan Subang 1 */}
          <line x1="48" y1="0" x2="48" y2="85" stroke="#94A3B8" strokeWidth="2.8" />
          <line x1="48" y1="0" x2="48" y2="85" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="2 2" />

          {/* Winding River (Sungai Klang / Basin) */}
          <path 
            d="M -5,8 Q 30,18 55,10 T 105,18" 
            fill="none" 
            stroke="url(#riverGradient)" 
            strokeWidth="5.5" 
            strokeLinecap="round"
          />

          {/* River Label */}
          <text x="32" y="11" fill="#0369A1" fontSize="2.4" fontWeight="800" letterSpacing="0.4">
            ~ SUNGAI KLANG (RIVER BASIN) ~
          </text>

          {/* Road Name Labels */}
          <text x="4" y="47.5" fill="#475569" fontSize="2.4" fontWeight="700">
            Persiaran Kewajipan
          </text>
          <text x="4" y="26" fill="#1E293B" fontSize="2.4" fontWeight="800">
            KESAS Expressway (E5)
          </text>
          <text x="50" y="78" fill="#475569" fontSize="2.4" fontWeight="700">
            Jalan Subang 1
          </text>

          {/* Active Hazards Layer */}
          {(filter === 'all' || filter === 'hazards') && currentScenario.hazards.map(h => (
            <g key={h.id}>
              {/* Radial Inundation Zone */}
              <circle
                cx={h.coords.x}
                cy={h.coords.y}
                r={h.coords.radius}
                fill={h.severity === 'danger' ? 'url(#dangerFlood)' : 'url(#advisoryFlood)'}
              />
              <circle
                cx={h.coords.x}
                cy={h.coords.y}
                r={h.coords.radius}
                fill="none"
                stroke={h.severity === 'danger' ? '#EF4444' : '#F59E0B'}
                strokeWidth="1.2"
                strokeDasharray="2 1.5"
              />

              {/* Flooded Road Obstruction Bar */}
              <line 
                x1={h.coords.x - 7} 
                y1={h.coords.y} 
                x2={h.coords.x + 7} 
                y2={h.coords.y} 
                stroke="#DC2626" 
                strokeWidth="2.8" 
                strokeLinecap="round"
              />

              {/* Hazard Label Pill */}
              <rect
                x={h.coords.x - 14}
                y={h.coords.y - 7}
                width="28"
                height="4.8"
                rx="2"
                fill="#FEF2F2"
                stroke="#EF4444"
                strokeWidth="0.6"
              />
              <text 
                x={h.coords.x} 
                y={h.coords.y - 3.8} 
                textAnchor="middle" 
                fill="#991B1B" 
                fontSize="2.4" 
                fontWeight="800"
              >
                ⚠️ {h.waterDepthMeters ? `Water: ${h.waterDepthMeters}m` : 'Hazard Zone'}
              </text>
            </g>
          ))}

          {/* Dotted Walking Path to Selected Shelter */}
          {selectedShelter && (
            <g>
              <path
                d={`M ${userCoord.x} ${userCoord.y} Q 36 56, ${selectedShelter.coords.x} ${selectedShelter.coords.y}`}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.4"
                strokeDasharray="3 2"
                strokeLinecap="round"
              />
              {/* Route ETA Badge midpoint */}
              <rect
                x="32"
                y="52"
                width="22"
                height="4.4"
                rx="2.2"
                fill="#0284C7"
              />
              <text
                x="43"
                y="55.2"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="2.2"
                fontWeight="800"
              >
                🚶 {selectedShelter.walkMinutes} min walk ({selectedShelter.distanceKm}km)
              </text>
            </g>
          )}

          {/* Shelters Pins Layer */}
          {(filter === 'all' || filter === 'shelters') && currentScenario.shelters.map(s => {
            const isSelected = selectedShelter?.id === s.id;
            return (
              <g 
                key={s.id} 
                onClick={() => handleShelterClick(s)}
                style={{ cursor: 'pointer' }}
              >
                {/* Selected Halo Ring */}
                {isSelected && (
                  <circle
                    cx={s.coords.x}
                    cy={s.coords.y}
                    r="6.8"
                    fill="rgba(2, 132, 199, 0.22)"
                    stroke="#0284C7"
                    strokeWidth="1.4"
                  />
                )}

                {/* Shelter Pin */}
                <circle
                  cx={s.coords.x}
                  cy={s.coords.y}
                  r="4.2"
                  fill="#059669"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
                <text
                  x={s.coords.x}
                  y={s.coords.y + 1.2}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="3.4"
                  fontWeight="bold"
                >
                  H
                </text>

                {/* Shelter Name Pill */}
                <rect
                  x={s.coords.x - 16}
                  y={s.coords.y + 6}
                  width="32"
                  height="4.4"
                  rx="2"
                  fill={isSelected ? '#0284C7' : '#FFFFFF'}
                  stroke={isSelected ? '#0284C7' : '#CBD5E1'}
                  strokeWidth="0.6"
                />
                <text
                  x={s.coords.x}
                  y={s.coords.y + 9.2}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#0F172A'}
                  fontSize="2.1"
                  fontWeight="700"
                >
                  {s.name.length > 22 ? `${s.name.substring(0, 20)}...` : s.name}
                </text>
              </g>
            );
          })}

          {/* User Location Radar Beacon */}
          <g>
            {/* Outer Pulse Wave */}
            <circle
              cx={userCoord.x}
              cy={userCoord.y}
              r="6.5"
              fill="rgba(2, 132, 199, 0.25)"
              stroke="#38BDF8"
              strokeWidth="0.8"
            />
            {/* Core Pin */}
            <circle
              cx={userCoord.x}
              cy={userCoord.y}
              r="3.8"
              fill="#0284C7"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
            <circle
              cx={userCoord.x}
              cy={userCoord.y}
              r="1.6"
              fill="#FFFFFF"
            />

            {/* User Label */}
            <rect
              x={userCoord.x - 12}
              y={userCoord.y - 8.5}
              width="24"
              height="4.2"
              rx="2.1"
              fill="#0F172A"
            />
            <text
              x={userCoord.x}
              y={userCoord.y - 5.6}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="2.2"
              fontWeight="800"
            >
              📍 {t.youAreHere}
            </text>
          </g>
        </svg>

        {/* 3. Floating Shelter Drawer at Bottom */}
        {selectedShelter && (
          <div className={`floating-shelter-sheet ${isSheetMinimized ? 'floating-shelter-sheet--minimized' : ''}`}>
            {/* Top row with toggle minimize button */}
            <div className="shelter-sheet-top-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedShelter.status === 'open' ? '#D1FAE5' : '#FEF3C7',
                    color: selectedShelter.status === 'open' ? '#065F46' : '#92400E'
                  }}
                >
                  {selectedShelter.status === 'open' ? t.openStatus : t.limitedStatus}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {selectedShelter.distanceKm} km • {selectedShelter.walkMinutes} {t.walkMin}
                </span>
              </div>

              <button
                onClick={() => setIsSheetMinimized(!isSheetMinimized)}
                style={{
                  border: 'none',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-full)',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                title={isSheetMinimized ? 'Expand Shelter Details' : 'Minimize to View Full Map'}
              >
                {isSheetMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Shelter Title & Address */}
            <div style={{ marginTop: '4px' }}>
              <div className="shelter-sheet-title">
                {language === 'bm' ? selectedShelter.nameBm : selectedShelter.name}
              </div>
              {!isSheetMinimized && (
                <div className="shelter-sheet-sub">
                  {selectedShelter.address}
                </div>
              )}
            </div>

            {/* Expanded Details: Capacity & Amenities */}
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
                        background: selectedShelter.capacityCurrent / selectedShelter.capacityTotal > 0.8 ? '#F59E0B' : '#10B981'
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
                      <Activity size={12} color="#DC2626" /> First-Aid
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

            {/* Action Buttons */}
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
        )}
      </div>
    </div>
  );
};
