import React, { useContext } from 'react';
import logoSrc from '../assets/logo.png';
import { AppContext } from '../context/AppContext';

export interface LogoProps {
  /** Size in pixels (applies to width & height) or predefined size name */
  size?: number | 'sm' | 'md' | 'lg' | 'xl' | 'splash';
  /** Display style variant */
  variant?: 'default' | 'badge' | 'header' | 'splash' | 'minimal';
  /** Optional breathing aura / glow animation */
  withGlow?: boolean;
  /** Explicit override to force or hide the backing badge */
  withBadge?: boolean;
  /** Language override if outside AppProvider */
  language?: 'en' | 'bm';
  /** Custom accessible alt text (automatically localized if omitted) */
  alt?: string;
  /** Custom tooltip title */
  title?: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<string, number> = {
  sm: 26,
  md: 40,
  lg: 64,
  xl: 88,
  splash: 104,
};

/**
 * Official Terra Guard V2 Logo Component.
 * 
 * Centralizes the application logo across splash, auth, headers, navigation,
 * settings, toasts, and modals with high-contrast badge backings and sharp scaling.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 40,
  variant = 'default',
  withGlow = false,
  withBadge,
  language,
  alt,
  title,
  className = '',
  style = {},
}) => {
  const appContext = useContext(AppContext);
  const effectiveLang = language || appContext?.language || 'en';

  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 40;
  const isBadge = withBadge !== undefined ? withBadge : (variant === 'badge' || variant === 'header');

  const defaultAlt = effectiveLang === 'bm'
    ? 'Logo Rasmi Terra Guard V2 — Perisai & Glob Keselamatan Awam'
    : 'Official Terra Guard V2 Logo — Civilian Safety Shield & Globe';

  const effectiveAlt = alt || defaultAlt;
  const effectiveTitle = title || effectiveAlt;

  // Header variant uses a slightly smaller compact badge wrapper
  const isHeader = variant === 'header';
  const isSplash = variant === 'splash' || withGlow;

  return (
    <div
      className={`terra-logo-container terra-logo-container--${variant} ${isBadge ? 'terra-logo-container--badge' : ''} ${className}`}
      style={{
        width: isBadge ? `${numericSize + (isHeader ? 6 : 12)}px` : `${numericSize}px`,
        height: isBadge ? `${numericSize + (isHeader ? 6 : 12)}px` : `${numericSize}px`,
        ...style
      }}
      title={effectiveTitle}
    >
      {/* Ambient breathing halo for splash screen */}
      {isSplash && <div className="terra-logo-halo" aria-hidden />}

      <img
        src={logoSrc}
        srcSet="/logo.png 1x, /logo.png 2x"
        alt={effectiveAlt}
        width={numericSize}
        height={numericSize}
        loading="eager"
        decoding="async"
        className={`terra-logo-img ${isSplash ? 'terra-logo-img--breathe' : ''}`}
        style={{
          width: `${numericSize}px`,
          height: `${numericSize}px`,
        }}
      />
    </div>
  );
};

export default Logo;
