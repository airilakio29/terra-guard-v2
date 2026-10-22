import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Phone,
  Check,
  Copy,
  CheckCheck,
  ShieldAlert,
  PackageCheck,
  Flame,
  LifeBuoy,
  HeartHandshake,
  Cross,
  MapPin,
  Radio,
  RotateCcw,
  Siren,
  Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EMERGENCY_CONTACTS, OFFLINE_CHECKLIST_ITEMS } from '../data/scenarios';
import type { EmergencyContact } from '../types';

const HOLD_DURATION_MS = 3000;

export const SosScreen: React.FC = () => {
  const {
    language,
    checklist,
    toggleChecklistItem,
    currentScenario,
    isGpsLocked,
    locateMe,
    locating,
    t
  } = useApp();

  const bm = language === 'bm';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [coordsCopied, setCoordsCopied] = useState(false);

  // ─── Tactile Hold-to-Activate SOS State ────────────────────────────────────
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0..100
  const [sosTriggered, setSosTriggered] = useState(false);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const totalItems = OFFLINE_CHECKLIST_ITEMS.length;
  const checkedCount = OFFLINE_CHECKLIST_ITEMS.filter(item => checklist[item.id]).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const stopHoldAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startHold = () => {
    if (sosTriggered) return;
    setIsHolding(true);
    holdStartRef.current = performance.now();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }

    const tick = (now: number) => {
      if (holdStartRef.current === null) return;
      const elapsed = now - holdStartRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        setIsHolding(false);
        setSosTriggered(true);
        holdStartRef.current = null;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([120, 60, 180]);
          } catch {
            // ignore
          }
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const endHold = useCallback(() => {
    stopHoldAnimation();
    setIsHolding(false);
    holdStartRef.current = null;
    if (!sosTriggered) {
      setHoldProgress(0);
    }
  }, [sosTriggered, stopHoldAnimation]);

  const resetSos = () => {
    stopHoldAnimation();
    setSosTriggered(false);
    setHoldProgress(0);
    setIsHolding(false);
  };

  useEffect(() => {
    return () => stopHoldAnimation();
  }, [stopHoldAnimation]);

  const handleCopy = (id: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formattedCoords = `${currentScenario.lat.toFixed(5)}°N, ${currentScenario.lon.toFixed(5)}°E`;

  const handleCopyCoords = () => {
    const payload = `${currentScenario.locationName} (${formattedCoords})`;
    navigator.clipboard.writeText(payload);
    setCoordsCopied(true);
    setTimeout(() => setCoordsCopied(false), 2200);
  };

  const getAgencyIcon = (iconType: EmergencyContact['iconType']) => {
    switch (iconType) {
      case 'police':
        return <ShieldAlert size={18} />;
      case 'fire':
        return <Flame size={18} />;
      case 'civil':
        return <LifeBuoy size={18} />;
      case 'welfare':
        return <HeartHandshake size={18} />;
      case 'crescent':
        return <Cross size={18} />;
      default:
        return <Phone size={18} />;
    }
  };

  const getAgencyBadge = (iconType: EmergencyContact['iconType']) => {
    switch (iconType) {
      case 'police':
        return 'MERS 999';
      case 'fire':
        return 'JBPM • BOMBA';
      case 'civil':
        return 'APM • PERTAHANAN AWAM';
      case 'welfare':
        return 'JKM • KEBAJIKAN';
      case 'crescent':
        return 'PBSM • MEDIK';
      default:
        return 'HOTLINE';
    }
  };

  const remainingSeconds = Math.max(0, ((100 - holdProgress) / 100) * (HOLD_DURATION_MS / 1000)).toFixed(1);
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (holdProgress / 100) * ringCircumference;

  return (
    <div className="screen-scroll-container">
      {/* ─── 1. TACTICAL HOLD-TO-ACTIVATE SOS BEACON MODULE ──────────────────── */}
      <div className={`sos-tactical-hero ${sosTriggered ? 'sos-tactical-hero--triggered' : ''}`}>
        <div className="sos-tactical-hero__top">
          <div className="tactical-badge tactical-badge--danger">
            <span className="tactical-ping-dot" />
            <span>{bm ? 'MOD KECEMASAN TAKTIKAL' : 'TACTICAL EMERGENCY DISPATCH'}</span>
          </div>
          <span className="tabular-mono sos-tactical-hero__code">MERS-999 // MY</span>
        </div>

        {!sosTriggered ? (
          <div className="sos-hold-stage">
            <div className="sos-hold-ring-wrapper">
              {/* Outer Sonar Rings when holding */}
              {isHolding && (
                <>
                  <div className="sos-sonar-wave sos-sonar-wave--1" />
                  <div className="sos-sonar-wave sos-sonar-wave--2" />
                </>
              )}

              <svg className="sos-hold-svg" width="132" height="132" viewBox="0 0 132 132">
                <circle
                  cx="66"
                  cy="66"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--danger-border)"
                  strokeWidth="6"
                  opacity="0.45"
                />
                <circle
                  cx="66"
                  cy="66"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--danger-accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 66 66)"
                  style={{ transition: isHolding ? 'none' : 'stroke-dashoffset 220ms ease-out' }}
                />
              </svg>

              <button
                type="button"
                className={`sos-hold-trigger-btn ${isHolding ? 'is-holding' : ''}`}
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={e => {
                  e.preventDefault();
                  startHold();
                }}
                onTouchEnd={endHold}
                onTouchCancel={endHold}
                onKeyDown={e => {
                  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                    e.preventDefault();
                    startHold();
                  }
                }}
                onKeyUp={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    endHold();
                  }
                }}
                aria-label={bm ? 'Tekan dan tahan 3 saat untuk aktifkan SOS' : 'Press and hold 3 seconds to activate SOS'}
              >
                <Siren size={28} />
                <span className="sos-hold-trigger-btn__label">
                  {isHolding ? `${remainingSeconds}s` : 'SOS'}
                </span>
                <span className="sos-hold-trigger-btn__sub">
                  {isHolding
                    ? (bm ? 'TAHAN…' : 'HOLDING…')
                    : (bm ? 'TAHAN 3S' : 'HOLD 3S')}
                </span>
              </button>
            </div>

            <div className="sos-hold-instructions">
              <div className="sos-hold-instructions__title">
                {isHolding
                  ? (bm ? 'Teruskan menahan untuk membuka kunci talian 999…' : 'Keep holding to unlock direct 999 dispatch…')
                  : (bm ? 'Tekan & Tahan 3 Saat untuk Kecemasan' : 'Press & Hold 3 Seconds for Emergency')}
              </div>
              <div className="sos-hold-instructions__desc">
                {bm
                  ? 'Kunci keselamatan 3 saat mengelakkan panggilan tidak sengaja semasa panik atau hujan.'
                  : '3-second tactile safety lock prevents accidental pocket dials during heavy rain or evacuation.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="sos-dispatch-unlocked">
            <div className="sos-dispatch-unlocked__header">
              <div>
                <div className="sos-dispatch-unlocked__title">
                  {bm ? 'KUNCI KECEMASAN DIBUKA' : 'EMERGENCY LOCK RELEASED'}
                </div>
                <div className="sos-dispatch-unlocked__subtitle">
                  {bm
                    ? 'Baca koordinat GPS di bawah kepada operator MERS 999:'
                    : 'Read your live GPS telemetry below to the MERS 999 dispatcher:'}
                </div>
              </div>
              <button
                type="button"
                className="sos-reset-btn"
                onClick={resetSos}
                title={bm ? 'Batal / Tetap Semula' : 'Cancel / Reset Lock'}
              >
                <RotateCcw size={14} />
                <span>{bm ? 'Batal' : 'Reset'}</span>
              </button>
            </div>

            <div className="sos-dispatch-actions">
              <a href="tel:999" className="sos-primary-dial-btn">
                <Phone size={18} />
                <span>{bm ? 'DAIL MERS 999 SEKARANG' : 'DIAL MERS 999 NOW'}</span>
              </a>
              <a href="tel:994" className="sos-secondary-dial-btn">
                <Flame size={16} />
                <span>{bm ? 'BOMBA (994)' : 'FIRE & RESCUE (994)'}</span>
              </a>
            </div>
          </div>
        )}

        {/* Live Telemetry Coordinates Readout Bar (Always visible for operator reference) */}
        <div className="sos-telemetry-bar">
          <div className="sos-telemetry-bar__left">
            <div className="sos-telemetry-bar__label">
              <MapPin size={12} />
              <span>{bm ? 'KOORDINAT SEMASA ANDA' : 'YOUR LIVE DISPATCH COORDINATES'}</span>
              <span className="sos-telemetry-bar__tag">
                <Radio size={10} />
                {isGpsLocked ? (bm ? 'GPS Tepat' : 'GPS Locked') : (bm ? 'Anggaran' : 'Default')}
              </span>
            </div>
            <div className="tabular-mono sos-telemetry-bar__coords">
              {currentScenario.locationName} — {formattedCoords}
            </div>
          </div>

          <div className="sos-telemetry-bar__actions">
            {!isGpsLocked && (
              <button
                type="button"
                className="sos-coord-btn"
                onClick={locateMe}
                disabled={locating}
                title={bm ? 'Kunci GPS sebenar' : 'Lock live GPS'}
              >
                <Navigation size={13} />
                <span>{locating ? '…' : 'GPS'}</span>
              </button>
            )}
            <button
              type="button"
              className="sos-coord-btn"
              onClick={handleCopyCoords}
              title={bm ? 'Salin koordinat GPS' : 'Copy GPS coordinates'}
            >
              {coordsCopied ? <CheckCheck size={13} color="var(--safe-accent)" /> : <Copy size={13} />}
              <span>{coordsCopied ? (bm ? 'Disalin' : 'Copied') : (bm ? 'Salin' : 'Copy')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Direct Emergency Hotlines Directory ──────────────────────────── */}
      <div className="section-card">
        <div className="tactical-section-header">
          <div className="section-title" style={{ color: 'var(--danger-accent)', marginBottom: 0 }}>
            <ShieldAlert size={17} />
            <span>{t.hotlinesTitle}</span>
          </div>
          <span className="tabular-mono tactical-tag">24/7 DISPATCH</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {t.hotlinesSubtitle}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {EMERGENCY_CONTACTS.map(c => (
            <div
              key={c.id}
              className={`hotline-card ${c.isPrimary ? 'primary' : ''}`}
            >
              <div className="hotline-card__left">
                <div className={`hotline-agency-icon ${c.isPrimary ? 'hotline-agency-icon--primary' : ''}`}>
                  {getAgencyIcon(c.iconType)}
                </div>
                <div className="hotline-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="tabular-mono hotline-agency-pill">
                      {getAgencyBadge(c.iconType)}
                    </span>
                    <span className="hotline-title">
                      {bm ? c.titleBm : c.titleEn}
                    </span>
                  </div>
                  <span className="hotline-desc">
                    {bm ? c.descriptionBm : c.descriptionEn}
                  </span>
                  <span className="tabular-mono hotline-number">
                    {c.number}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleCopy(c.id, c.number)}
                  title={t.copyNumber}
                  className="tactical-icon-btn"
                >
                  {copiedId === c.id ? (
                    <CheckCheck size={15} color="var(--safe-accent)" />
                  ) : (
                    <Copy size={15} color="var(--text-muted)" />
                  )}
                </button>

                <a
                  href={`tel:${c.number.replace(/\s+/g, '')}`}
                  className="hotline-call-btn"
                >
                  <Phone size={14} />
                  <span>{bm ? 'Dail' : 'Call'}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. 72-Hour Evacuation Survival Kit (100% Offline) ───────────────── */}
      <div className="section-card">
        <div className="tactical-section-header" style={{ marginBottom: '4px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <PackageCheck size={17} color="var(--brand-primary)" />
            <span>{t.offlineKitTitle}</span>
          </div>
          <span className="tabular-mono tactical-tag tactical-tag--brand">
            {String(checkedCount).padStart(2, '0')}/{String(totalItems).padStart(2, '0')} • {progressPercent}%
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {t.offlineKitSubtitle}
        </p>

        {/* Progress bar */}
        <div className="capacity-bar-container" style={{ marginBottom: '14px' }}>
          <div
            className="capacity-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: progressPercent === 100 ? 'var(--safe-badge)' : 'var(--brand-primary)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {OFFLINE_CHECKLIST_ITEMS.map((item, idx) => {
            const isChecked = !!checklist[item.id];
            return (
              <div
                key={item.id}
                className={`checklist-card ${isChecked ? 'checked' : ''}`}
                onClick={() => toggleChecklistItem(item.id)}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleChecklistItem(item.id);
                  }
                }}
              >
                <div className="checkbox-custom">
                  {isChecked && <Check size={14} className="checkbox-check-icon" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div className="checklist-title">
                      {bm ? item.titleBm : item.titleEn}
                    </div>
                    <span className="tabular-mono checklist-index">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="checklist-subtitle">
                    {bm ? item.subtitleBm : item.subtitleEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
