import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export interface SplashScreenProps {
  /** Triggered the moment the splash starts fading out so underlying screen can be safely revealed */
  onStartExit?: () => void;
  /** Triggered when the fade-out completes to unmount splash completely from DOM */
  onFinish: () => void;
  /** Language override for accessibility announcements */
  language?: 'en' | 'bm';
}

/**
 * Terra Guard V2 Minimal Loading / Splash Screen (Task 2)
 *
 * Displays only the official Terra Guard logo with calm breathing animation and
 * a sharp square horizontal loading bar (120px x 3px).
 *
 * Guarantees:
 * - Minimum display duration of 1500ms to avoid harsh flashes
 * - Stays visible until auth state resolves
 * - Capped at 4000ms hard ceiling so the user is never stuck
 * - Fades out smoothly over 250ms, revealing underlying screen without paint-through
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStartExit,
  onFinish,
  language = 'en',
}) => {
  const { loading: authLoading } = useAuth();
  const [isExiting, setIsExiting] = useState(false);

  const onStartExitRef = useRef(onStartExit);
  const onFinishRef = useRef(onFinish);
  const isExitingRef = useRef(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    onStartExitRef.current = onStartExit;
  }, [onStartExit]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleComplete = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinishRef.current();
  }, []);

  const triggerExit = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);
    if (onStartExitRef.current) {
      onStartExitRef.current();
    }

    // Safety fallback: ensure unmount occurs even if animationend event doesn't fire
    window.setTimeout(() => {
      handleComplete();
    }, 280);
  }, [handleComplete]);

  useEffect(() => {
    const MIN_DURATION_MS = 1500;
    const MAX_DURATION_MS = 4000;
    const startTime = performance.now();

    // Check timer loop
    const checkTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      // If auth is resolved and minimum duration has elapsed, start exit
      if (!authLoading && elapsed >= MIN_DURATION_MS) {
        window.clearInterval(checkTimer);
        triggerExit();
      }
    }, 50);

    // Hard ceiling: never trap the user on the splash screen
    const maxTimer = window.setTimeout(() => {
      window.clearInterval(checkTimer);
      triggerExit();
    }, MAX_DURATION_MS);

    return () => {
      window.clearInterval(checkTimer);
      window.clearTimeout(maxTimer);
    };
  }, [authLoading, triggerExit]);

  return (
    <div
      className={`splash-screen ${isExiting ? 'splash-screen--fade-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={language === 'bm' ? 'Memuatkan Terra Guard' : 'Loading Terra Guard'}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && isExiting) {
          handleComplete();
        }
      }}
    >
      <div className="splash-center">
        {/* Large centered Terra Guard logo with calm breathing scale and glow */}
        <div className="splash-logo-wrap">
          <Logo
            size={190}
            variant="splash"
            withGlow
            className="splash-main-logo"
            language={language}
          />
        </div>

        {/* Small sharp horizontal indicator (120px x 3px) with sliding square bar */}
        <div
          className="splash-loader-track"
          role="progressbar"
          aria-label={language === 'bm' ? 'Memuatkan' : 'Loading'}
        >
          <div className="splash-loader-bar" />
        </div>

        {/* Accessible screen-reader label in EN and BM */}
        <span className="sr-only">
          {language === 'bm' ? 'Memuatkan Terra Guard...' : 'Loading Terra Guard...'}
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
