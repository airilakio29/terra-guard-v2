import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeById, type FloatingEffectType } from '../data/themes';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
  angle: number;
  rotationSpeed: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  seed: number;
  shapeVariant: number; // 0: dot/droplet/streak, 1: leaf/cloud
}

/**
 * Live Floating Background for Terra Guard V2
 * Supports 3 themes:
 * 1. Terra Classic: Floating moisture droplets and civilian beacons
 * 2. Monsoon Slate: Gentle translucent rain streaks and drifting mist clouds
 * 3. Sime Darby: Slow drifting golden dots and soft flora leaf shapes
 *
 * Effect code for deleted themes has been completely removed.
 * Strictly respects reduceEffects and reduceMotion settings.
 */
export const FloatingBackground: React.FC = () => {
  const { themeId, reduceEffects, reduceMotion, currentScenario } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const theme = getThemeById(themeId);
  const effect = theme.floatingEffect;

  useEffect(() => {
    if (reduceEffects || reduceMotion) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resizeCanvas = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);

    // Particle count: 20-28 particles for optimal battery efficiency
    const count = Math.min(26, Math.max(16, Math.floor(width / 32)));
    const palette = effect.colors;

    const createParticle = (initY?: number): Particle => {
      const sizeBase = effect.type === 'rain-clouds' ? 18 : effect.type === 'golden-leaves' ? 14 : 12;
      return {
        x: Math.random() * width,
        y: typeof initY === 'number' ? initY : Math.random() * height,
        size: (sizeBase * 0.7) + Math.random() * (sizeBase * 0.9),
        speed: effect.speed * (0.6 + Math.random() * 0.8),
        color: palette[Math.floor(Math.random() * palette.length)],
        opacity: effect.opacity * (0.5 + Math.random() * 0.5),
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        wobbleSpeed: 0.8 + Math.random() * 1.4,
        wobbleAmplitude: 12 + Math.random() * 20,
        seed: Math.random() * 100,
        shapeVariant: Math.random() > 0.65 ? 1 : 0,
      };
    };

    particlesRef.current = Array.from({ length: count }, () => createParticle());

    // ─── 1. Terra Classic: Water Droplets & Beacons ─────────────────────────
    const drawDroplet = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * 0.2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      const r = p.size * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.6);
      ctx.bezierCurveTo(r * 1.2, -r * 0.2, r * 1.1, r * 1.2, 0, r * 1.2);
      ctx.bezierCurveTo(-r * 1.1, r * 1.2, -r * 1.2, -r * 0.2, 0, -r * 1.6);
      ctx.fill();

      // Delicate glint highlight
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * 0.5;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.2, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // ─── 2. Monsoon Slate: Rain Streaks & Clouds ────────────────────────────
    const drawRainOrCloud = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacity;

      if (p.shapeVariant === 1) {
        // Slow drifting cloud puff
        ctx.fillStyle = p.color;
        const cw = p.size * 1.5;
        const ch = p.size * 0.75;
        ctx.beginPath();
        ctx.arc(0, 0, ch * 0.5, 0, Math.PI * 2);
        ctx.arc(-cw * 0.3, ch * 0.1, ch * 0.38, 0, Math.PI * 2);
        ctx.arc(cw * 0.3, ch * 0.1, ch * 0.38, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Angled rain streak (~15 deg slant)
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-p.size * 0.25, p.size * 1.1);
        ctx.stroke();
      }
      ctx.restore();
    };

    // ─── 3. Sime Darby: Golden Dots & Soft Leaves ───────────────────────────
    const drawGoldenDotOrLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = Math.min(0.25, p.opacity); // Strictly low contrast, never over text

      if (p.shapeVariant === 1) {
        // Soft Flora Leaf Shape
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        const len = p.size * 0.85;
        const widthHalf = p.size * 0.38;

        ctx.beginPath();
        ctx.moveTo(0, -len);
        ctx.quadraticCurveTo(widthHalf, 0, 0, len);
        ctx.quadraticCurveTo(-widthHalf, 0, 0, -len);
        ctx.fill();

        // Subtle center vein
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = Math.min(0.18, p.opacity * 0.7);
        ctx.beginPath();
        ctx.moveTo(0, -len * 0.75);
        ctx.lineTo(0, len * 0.75);
        ctx.stroke();
      } else {
        // Slow drifting golden particle dot
        ctx.fillStyle = p.color;
        const r = p.size * 0.32;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // ─── Animation Loop ─────────────────────────────────────────────────────
    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      ctx.clearRect(0, 0, width, height);

      const type: FloatingEffectType = effect.type;
      const direction = effect.direction;

      particlesRef.current.forEach((p) => {
        if (direction === 'up') {
          p.y -= p.speed * 32 * dt;
          p.x += Math.sin((now * 0.001 * p.wobbleSpeed) + p.seed) * (p.wobbleAmplitude * dt);
          if (p.y < -p.size * 2) {
            p.y = height + p.size;
            p.x = Math.random() * width;
          }
        } else if (direction === 'down') {
          p.y += p.speed * 42 * dt;
          p.x += Math.sin((now * 0.001 * p.wobbleSpeed) + p.seed) * (p.wobbleAmplitude * dt);
          if (p.y > height + p.size * 2) {
            p.y = -p.size;
            p.x = Math.random() * width;
          }
        } else {
          // 'drift': gentle atmospheric sway
          p.y -= Math.sin(now * 0.0006 + p.seed) * (p.speed * 14 * dt);
          p.x += Math.cos(now * 0.0005 + p.seed) * (p.speed * 12 * dt);

          if (p.x < -p.size * 2) p.x = width + p.size;
          if (p.x > width + p.size * 2) p.x = -p.size;
          if (p.y < -p.size * 2) p.y = height + p.size;
          if (p.y > height + p.size * 2) p.y = -p.size;
        }

        p.angle += p.rotationSpeed;

        if (type === 'droplets') {
          drawDroplet(p);
        } else if (type === 'rain-clouds') {
          drawRainOrCloud(p);
        } else if (type === 'golden-leaves') {
          drawGoldenDotOrLeaf(p);
        } else {
          drawDroplet(p);
        }
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else {
        lastTimeRef.current = performance.now();
        if (!animFrameIdRef.current) {
          animFrameIdRef.current = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [themeId, effect, reduceEffects, reduceMotion]);

  if (reduceEffects || reduceMotion) {
    return null;
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="floating-bg-canvas"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        className={`tactical-atmosphere tactical-atmosphere--${currentScenario.riskLevel}`}
        aria-hidden="true"
      >
        <div className="tactical-atmosphere__grid" />
      </div>
    </>
  );
};
