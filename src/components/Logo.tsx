import React from 'react';

export interface LogoProps {
  /** Diameter or width/height in pixels */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label */
  title?: string;
}

/**
 * Centered placeholder logo for TerraGuard (Shield + Globe).
 * Designed in its own dedicated component so you can swap it with your
 * official SVG or production asset with just a single file change!
 */
export const Logo: React.FC<LogoProps> = ({
  size = 72,
  className = '',
  style = {},
  title = 'TerraGuard Shield & Globe Logo',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`terra-logo ${className}`}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <defs>
        {/* Themed Shield Gradient */}
        <linearGradient id="shieldGrad" x1="16" y1="8" x2="84" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-primary)" />
          <stop offset="60%" stopColor="var(--brand-hover)" />
          <stop offset="100%" stopColor="var(--brand-primary)" />
        </linearGradient>

        {/* Themed Shield Border Glow */}
        <linearGradient id="shieldStrokeGrad" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-border)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.4" />
        </linearGradient>

        {/* Themed Globe Arc Stroke */}
        <linearGradient id="globeStrokeGrad" x1="28" y1="26" x2="72" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--text-inverse)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--brand-border)" stopOpacity="0.8" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--brand-primary)" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Shield Body */}
      <path
        d="M50 10 C68 18 80 22 84 26 C84 56 68 76 50 90 C32 76 16 56 16 26 C20 22 32 18 50 10 Z"
        fill="url(#shieldGrad)"
        filter="url(#logoGlow)"
      />

      {/* Shield Bevel Border */}
      <path
        d="M50 10 C68 18 80 22 84 26 C84 56 68 76 50 90 C32 76 16 56 16 26 C20 22 32 18 50 10 Z"
        stroke="url(#shieldStrokeGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Shield Inset Line */}
      <path
        d="M50 16 C64 23 74 26 78 30 C78 54 64 70 50 82 C36 70 22 54 22 30 C26 26 36 23 50 16 Z"
        stroke="var(--brand-border)"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* --- Globe Group --- */}
      <g stroke="url(#globeStrokeGrad)" strokeLinecap="round" strokeLinejoin="round">
        {/* Globe Outer Circle */}
        <circle cx="50" cy="48" r="20" strokeWidth="2.2" fill="var(--brand-surface)" fillOpacity="0.55" />

        {/* Equator */}
        <line x1="30" y1="48" x2="70" y2="48" strokeWidth="1.6" />

        {/* Northern Latitude */}
        <path d="M34 40 Q50 44 66 40" strokeWidth="1.4" strokeOpacity="0.85" />

        {/* Southern Latitude */}
        <path d="M34 56 Q50 52 66 56" strokeWidth="1.4" strokeOpacity="0.85" />

        {/* Prime Meridian (Vertical) */}
        <line x1="50" y1="28" x2="50" y2="68" strokeWidth="1.6" />

        {/* West Meridian Arc */}
        <path d="M50 28 C40 34 40 62 50 68" strokeWidth="1.4" strokeOpacity="0.85" />

        {/* East Meridian Arc */}
        <path d="M50 28 C60 34 60 62 50 68" strokeWidth="1.4" strokeOpacity="0.85" />
      </g>

      {/* Central Beacon Pulse Dot */}
      <circle cx="50" cy="48" r="3" fill="var(--text-inverse)" />
      <circle cx="50" cy="48" r="5" stroke="var(--brand-accent)" strokeWidth="1.2" strokeOpacity="0.9" />
    </svg>
  );
};

export default Logo;
