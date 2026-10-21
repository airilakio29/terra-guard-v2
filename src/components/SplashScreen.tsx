import React, { useEffect, useState, useRef } from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export interface SplashScreenProps {
  /** Called when splash finishes (~2.5s) with the next target screen */
  onFinish: (target: 'main' | 'login') => void;
  language?: 'en' | 'bm';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  language = 'en',
}) => {
  const { user, isGuest, loading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Keep latest auth values in refs so the completion timeout has fresh state
  const authStateRef = useRef({ user, isGuest, loading });
  useEffect(() => {
    authStateRef.current = { user, isGuest, loading };
  }, [user, isGuest, loading]);

  useEffect(() => {
    const startTime = performance.now();
    const TOTAL_DURATION_MS = 2500;
    const PROGRESS_TARGET_MS = 2200;
    const EXIT_ANIM_START_MS = 2100;

    // Smooth progress bar update
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / PROGRESS_TARGET_MS) * 100));
      setProgress(pct);

      if (elapsed >= EXIT_ANIM_START_MS && !isExiting) {
        setIsExiting(true);
      }
    }, 25);

    // Final finish transition after 2.5 seconds
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setProgress(100);

      const { user: currentUser, isGuest: currentGuest } = authStateRef.current;
      const target = (currentUser || currentGuest) ? 'main' : 'login';
      onFinish(target);
    }, TOTAL_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [onFinish, isExiting]);

  return (
    <div
      className={`splash-screen ${isExiting ? 'splash-screen--fade-slide-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="TerraGuard Loading"
    >
      {/* Ambient background aura */}
      <div className="splash-ambient-glow" aria-hidden />

      {/* Centered Logo & Branding */}
      <div className="splash-content">
        <div className="splash-logo-anim-in">
          <div className="splash-logo-pulse">
            <Logo size={92} title="TerraGuard" />
          </div>
        </div>

        <h1 className="splash-title">TerraGuard</h1>
        <p className="splash-subtitle">
          {language === 'bm'
            ? 'Teman Keselamatan Bencana Awam'
            : 'Citizen Disaster Companion'}
        </p>

        <div className="splash-pill-badge">
          <span aria-hidden>🛡️</span>
          <span>
            {language === 'bm'
              ? 'Sistem Tindak Balas Komuniti V2'
              : 'Community Emergency Network V2'}
          </span>
        </div>
      </div>

      {/* Thin Progress Indicator */}
      <div className="splash-progress-wrapper">
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
        <span className="splash-status-text">
          {language === 'bm'
            ? 'Menyemak suapan kecemasan & profil...'
            : 'Synchronizing emergency feeds & auth...'}
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
