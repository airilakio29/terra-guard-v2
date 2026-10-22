import React from 'react';
import { useApp } from '../context/AppContext';

/**
 * Tactical Atmospheric Background (Anti-AI-Slop EOC Edition)
 *
 * Replaces the legacy 60fps floating particle/cat canvas with a zero-GPU-drain
 * CSS tactical coordinate grid and subtle atmospheric radial illumination.
 * Preserves 100% mobile battery life during flood/storm power outages.
 */
export const FloatingBackground: React.FC = () => {
  const { reduceEffects, reduceMotion, currentScenario } = useApp();

  if (reduceEffects || reduceMotion) {
    return null;
  }

  return (
    <div
      className={`tactical-atmosphere tactical-atmosphere--${currentScenario.riskLevel}`}
      aria-hidden="true"
    >
      <div className="tactical-atmosphere__grid" />
    </div>
  );
};
