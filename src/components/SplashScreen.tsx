import React, { useEffect, useState, useRef } from 'react';
import {
  Radar,
  CloudSun,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
  Radio,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export interface SplashScreenProps {
  /** Called when splash finishes with the next target screen */
  onFinish: (target: 'main' | 'login') => void;
  language?: 'en' | 'bm';
}

interface BootStep {
  id: string;
  threshold: number;
  doneAt: number;
  labelEn: string;
  labelBm: string;
  subEn: string;
  subBm: string;
  icon: React.ReactNode;
}

const BOOT_STEPS: BootStep[] = [
  {
    id: 'gps',
    threshold: 0,
    doneAt: 26,
    labelEn: 'GPS & Spatial Hazard Radar',
    labelBm: 'Radar Bahaya & Koordinat GPS',
    subEn: 'Locking live coordinates & elevation',
    subBm: 'Mengunci lokasi & aras ketinggian',
    icon: <Radar size={15} />,
  },
  {
    id: 'weather-ipu',
    threshold: 24,
    doneAt: 54,
    labelEn: 'OpenWeather & DOE IPU Haze',
    labelBm: 'Cuaca & Indeks IPU Jerebu JAS',
    subEn: 'Syncing rainfall, wind & official API (MY)',
    subBm: 'Menyegerak hujan, angin & IPU rasmi',
    icon: <CloudSun size={15} />,
  },
  {
    id: 'shelters',
    threshold: 52,
    doneAt: 80,
    labelEn: 'JPS River Basin & PPS Shelters',
    labelBm: 'Lembangan Sungai & Pusat PPS',
    subEn: 'Indexing flood basins & evacuation routes',
    subBm: 'Memetakan sungai & pusat pemindahan',
    icon: <ShieldCheck size={15} />,
  },
  {
    id: 'ai-sos',
    threshold: 78,
    doneAt: 96,
    labelEn: 'Gemini Safety AI & SOS Kit',
    labelBm: 'AI Keselamatan & Kit SOS 999',
    subEn: 'Arming emergency responder protocols',
    subBm: 'Mengaktifkan protokol kecemasan',
    icon: <Sparkles size={15} />,
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  language = 'en',
}) => {
  const { user, isGuest, loading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Keep latest callbacks and auth values in refs so the timer never resets mid-animation
  const authStateRef = useRef({ user, isGuest, loading });
  const onFinishRef = useRef(onFinish);
  const isExitingRef = useRef(false);

  useEffect(() => {
    authStateRef.current = { user, isGuest, loading };
  }, [user, isGuest, loading]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const startTime = performance.now();
    const PROGRESS_TARGET_MS = 2150;
    const EXIT_ANIM_START_MS = 2200;
    const TOTAL_DURATION_MS = 2520;

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const rawRatio = Math.min(1, elapsed / PROGRESS_TARGET_MS);
      // Smooth ease-out curve for realistic telemetry loading feel
      const easedRatio = 1 - Math.pow(1 - rawRatio, 1.85);
      const pct = Math.min(100, Math.round(easedRatio * 100));
      setProgress(pct);

      if (elapsed >= EXIT_ANIM_START_MS && !isExitingRef.current) {
        isExitingRef.current = true;
        setIsExiting(true);
      }
    }, 25);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setProgress(100);

      const { user: currentUser, isGuest: currentGuest } = authStateRef.current;
      const target = currentUser || currentGuest ? 'main' : 'login';
      onFinishRef.current(target);
    }, TOTAL_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const activeStep =
    BOOT_STEPS.find((s) => progress >= s.threshold && progress < s.doneAt) ||
    BOOT_STEPS[BOOT_STEPS.length - 1];

  return (
    <div
      className={`splash-screen splash-screen--gradient-anim ${isExiting ? 'splash-screen--fade-slide-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="TerraGuard Live Telemetry Loading"
    >
      {/* Ambient background aura */}
      <div className="splash-ambient-glow" aria-hidden />

      {/* Centered Logo, Radar Rings & Live Telemetry Console */}
      <div className="splash-content">
        <div className="splash-logo-anim-in">
          <div className="splash-radar-stage">
            <span className="splash-radar-ring splash-radar-ring--1" aria-hidden />
            <span className="splash-radar-ring splash-radar-ring--2" aria-hidden />
            <div className="splash-logo-pulse">
              <Logo size={92} variant="splash" withGlow />
            </div>
          </div>
        </div>

        <h1 className="splash-title">TerraGuard</h1>
        <p className="splash-subtitle">
          {language === 'bm'
            ? 'Teman Keselamatan Bencana Awam'
            : 'Citizen Disaster Companion'}
        </p>

        <div className="splash-pill-badge">
          <Radio size={13} className="splash-live-radio-icon" />
          <span>
            {language === 'bm'
              ? 'Rangkaian Telemetri Langsung V2'
              : 'Live Telemetry Network V2'}
          </span>
        </div>

        {/* Creative Live Telemetry Boot Sequence Card */}
        <div className="splash-telemetry-card">
          <div className="splash-telemetry-header">
            <span className="splash-telemetry-title">
              <span className="splash-telemetry-dot" />
              {language === 'bm' ? 'DIAGNOSTIK SISTEM LANGSUNG' : 'LIVE SYSTEM DIAGNOSTICS'}
            </span>
            <span className="splash-telemetry-pct">{progress}%</span>
          </div>

          {/* Progress Bar inside Card */}
          <div
            className="splash-progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 4-Step Live Feed Checklist */}
          <div className="splash-steps-list">
            {BOOT_STEPS.map((step) => {
              const isDone = progress >= step.doneAt;
              const isActive = !isDone && progress >= step.threshold;
              const stateClass = isDone
                ? 'splash-step--done'
                : isActive
                ? 'splash-step--active'
                : 'splash-step--pending';

              return (
                <div key={step.id} className={`splash-step-row ${stateClass}`}>
                  <div className="splash-step-icon">{step.icon}</div>
                  <div className="splash-step-text">
                    <div className="splash-step-label">
                      {language === 'bm' ? step.labelBm : step.labelEn}
                    </div>
                    <div className="splash-step-sub">
                      {language === 'bm' ? step.subBm : step.subEn}
                    </div>
                  </div>
                  <div className="splash-step-badge">
                    {isDone ? (
                      <span className="splash-badge-ready">
                        <CheckCircle2 size={13} />
                        {language === 'bm' ? 'SEDIA' : 'ONLINE'}
                      </span>
                    ) : isActive ? (
                      <span className="splash-badge-sync">
                        <Loader2 size={13} className="spin-icon" />
                        {language === 'bm' ? ' AKTIF' : 'SYNC'}
                      </span>
                    ) : (
                      <span className="splash-badge-wait">WAIT</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom live status ticker */}
          <div className="splash-telemetry-footer">
            <span className="splash-status-text">
              {progress >= 96
                ? language === 'bm'
                  ? 'Semua suapan bencana aktif — membuka papan pemuka...'
                  : 'All hazard feeds synchronized — launching dashboard...'
                : language === 'bm'
                ? activeStep.subBm
                : activeStep.subEn}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
