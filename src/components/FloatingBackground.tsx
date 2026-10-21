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
  shapeVariant: number; // For themes with multiple shapes (e.g. neko cat vs paw, star vs firefly)
}

export const FloatingBackground: React.FC = () => {
  const { themeId, reduceEffects, reduceMotion } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const targetThemeIdRef = useRef<string>(themeId);

  const themeConfig = getThemeById(themeId);
  const effect = themeConfig.floatingEffect;

  useEffect(() => {
    targetThemeIdRef.current = themeId;
  }, [themeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // 1. Check if effects or motion are reduced by user or OS preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceEffects || reduceMotion || prefersReducedMotion) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    // 2. Battery & hardware capability detection (Emergency energy conservation)
    let isLowPower = false;
    if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
      if (navigator.hardwareConcurrency <= 4) isLowPower = true;
    }

    // 3. Sizing with DPR clamp to prevent GPU battery drain
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 4. Initialize Particle Pool
    const isMobile = width < 768;
    const baseCount = isMobile ? (isLowPower ? 7 : 10) : isLowPower ? 11 : 16;
    const colors = effect.colors;

    const initParticle = (): Particle => {
      const sizeBase = isMobile ? 12 : 16;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: sizeBase * (0.65 + Math.random() * 0.7),
        speed: (0.45 + Math.random() * 0.55) * effect.speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: (0.18 + Math.random() * 0.22) * effect.opacity * 2.5,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        wobbleSpeed: 0.8 + Math.random() * 1.2,
        wobbleAmplitude: 12 + Math.random() * 16,
        seed: Math.random() * 100,
        shapeVariant: Math.random() > 0.5 ? 1 : 0,
      };
    };

    particlesRef.current = Array.from({ length: baseCount }, () => initParticle());

    // Dynamic Theme Tokens for Canvas Drawings
    const rootStyles = getComputedStyle(document.documentElement);
    const tokenHighlight = rootStyles.getPropertyValue('--text-inverse').trim();
    const tokenAccent = rootStyles.getPropertyValue('--brand-accent').trim();
    const tokenText = rootStyles.getPropertyValue('--text-primary').trim();

    // 5. Individual Shape Drawers
    const drawDroplet = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      if (p.shapeVariant === 1) {
        // Teardrop droplet
        ctx.beginPath();
        ctx.arc(0, p.size * 0.2, p.size * 0.45, 0, Math.PI);
        ctx.quadraticCurveTo(p.size * 0.45, -p.size * 0.1, 0, -p.size * 0.6);
        ctx.quadraticCurveTo(-p.size * 0.45, -p.size * 0.1, -p.size * 0.45, p.size * 0.2);
        ctx.fill();
      } else {
        // Soft glowing bokeh sphere
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 0.65);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawBubble = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacity;

      // Outer rim
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent wash
      ctx.globalAlpha = p.opacity * 0.35;
      ctx.fill();

      // Specular highlight arc
      ctx.globalAlpha = p.opacity * 0.8;
      ctx.strokeStyle = tokenHighlight;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-p.size * 0.15, -p.size * 0.15, p.size * 0.25, -Math.PI * 0.7, -Math.PI * 0.1);
      ctx.stroke();

      ctx.restore();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      // Organic curved leaf
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.6);
      ctx.quadraticCurveTo(p.size * 0.45, -p.size * 0.2, 0, p.size * 0.6);
      ctx.quadraticCurveTo(-p.size * 0.45, -p.size * 0.2, 0, -p.size * 0.6);
      ctx.fill();

      // Subtle center vein
      ctx.strokeStyle = tokenHighlight;
      ctx.globalAlpha = p.opacity * 0.6;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.5);
      ctx.lineTo(0, p.size * 0.5);
      ctx.stroke();

      ctx.restore();
    };

    const drawNeko = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * 0.3);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      if (p.shapeVariant === 1) {
        // Cute Cat Silhouette (Head & Ears)
        const r = p.size * 0.38;
        ctx.beginPath();
        // Head
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // Left Ear
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.5);
        ctx.lineTo(-r * 0.9, -r * 1.35);
        ctx.lineTo(-r * 0.1, -r * 0.85);
        ctx.closePath();
        ctx.fill();
        // Right Ear
        ctx.beginPath();
        ctx.moveTo(r * 0.7, -r * 0.5);
        ctx.lineTo(r * 0.9, -r * 1.35);
        ctx.lineTo(r * 0.1, -r * 0.85);
        ctx.closePath();
        ctx.fill();
      } else {
        // Cute 4-Toed Paw Print
        const r = p.size * 0.32;
        // Main pad
        ctx.beginPath();
        ctx.ellipse(0, r * 0.3, r, r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        // 4 Toe pads
        const toeR = r * 0.32;
        ctx.beginPath();
        ctx.arc(-r * 0.75, -r * 0.45, toeR, 0, Math.PI * 2);
        ctx.arc(-r * 0.25, -r * 0.75, toeR, 0, Math.PI * 2);
        ctx.arc(r * 0.25, -r * 0.75, toeR, 0, Math.PI * 2);
        ctx.arc(r * 0.75, -r * 0.45, toeR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawSakura = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      // Delicate notched cherry blossom petal
      const len = p.size * 0.6;
      const w = p.size * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, len);
      ctx.bezierCurveTo(-w, len * 0.5, -w * 1.1, -len * 0.5, -w * 0.4, -len);
      ctx.lineTo(0, -len * 0.75); // notch
      ctx.lineTo(w * 0.4, -len);
      ctx.bezierCurveTo(w * 1.1, -len * 0.5, w, len * 0.5, 0, len);
      ctx.fill();

      ctx.restore();
    };

    const drawStarOrFirefly = (p: Particle, time: number) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + p.seed);
      ctx.globalAlpha = p.opacity * (0.6 + 0.4 * twinkle);

      if (p.shapeVariant === 1) {
        // 4-point Diamond Star
        ctx.fillStyle = p.color;
        const r = p.size * 0.45 * (0.8 + 0.2 * twinkle);
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      } else {
        // Firefly with soft radial halo
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 0.6);
        grad.addColorStop(0, tokenHighlight);
        grad.addColorStop(0.35, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawLantern = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * 0.15); // gentle sway
      ctx.globalAlpha = p.opacity;

      const w = p.size * 0.55;
      const h = p.size * 0.75;

      // Glow halo
      const grad = ctx.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 1.2);
      grad.addColorStop(0, tokenAccent);
      grad.addColorStop(0.6, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, w * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Paper lantern body
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top and bottom rims
      ctx.strokeStyle = tokenText;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.5);
      ctx.lineTo(w * 0.3, -h * 0.5);
      ctx.moveTo(-w * 0.25, h * 0.5);
      ctx.lineTo(w * 0.25, h * 0.5);
      // Small tassel
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(0, h * 0.7);
      ctx.stroke();

      ctx.restore();
    };

    const drawRainOrCloud = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacity;

      if (p.shapeVariant === 1) {
        // Angled rain streak (~15 deg slant)
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-p.size * 0.25, p.size * 1.1);
        ctx.stroke();
      } else {
        // Slow drifting cloud puff
        ctx.fillStyle = p.color;
        const cw = p.size * 1.6;
        const ch = p.size * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, ch * 0.55, 0, Math.PI * 2);
        ctx.arc(-cw * 0.3, ch * 0.1, ch * 0.42, 0, Math.PI * 2);
        ctx.arc(cw * 0.3, ch * 0.1, ch * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // 6. Main Animation Loop
    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      ctx.clearRect(0, 0, width, height);

      const type: FloatingEffectType = effect.type;
      const direction = effect.direction;

      particlesRef.current.forEach((p) => {
        // Update positions based on direction and time
        if (direction === 'up') {
          p.y -= p.speed * 42 * dt;
          p.x += Math.sin((now * 0.001 * p.wobbleSpeed) + p.seed) * (p.wobbleAmplitude * dt);
          if (p.y < -p.size * 2) {
            p.y = height + p.size;
            p.x = Math.random() * width;
          }
        } else if (direction === 'down') {
          p.y += p.speed * 44 * dt;
          p.x += Math.sin((now * 0.001 * p.wobbleSpeed) + p.seed) * (p.wobbleAmplitude * dt);
          if (p.y > height + p.size * 2) {
            p.y = -p.size;
            p.x = Math.random() * width;
          }
        } else {
          // 'drift': gentle breathing vertical and horizontal sway
          p.y -= Math.sin(now * 0.0008 + p.seed) * (p.speed * 18 * dt);
          p.x += Math.cos(now * 0.0006 + p.seed) * (p.speed * 16 * dt);

          if (p.x < -p.size) p.x = width + p.size;
          if (p.x > width + p.size) p.x = -p.size;
          if (p.y < -p.size) p.y = height + p.size;
          if (p.y > height + p.size) p.y = -p.size;
        }

        p.angle += p.rotationSpeed;

        // Draw particle based on active theme effect
        switch (type) {
          case 'droplets':
            drawDroplet(p);
            break;
          case 'bubbles':
            drawBubble(p);
            break;
          case 'leaves':
            drawLeaf(p);
            break;
          case 'neko-paws':
            drawNeko(p);
            break;
          case 'sakura-petals':
            drawSakura(p);
            break;
          case 'stars-fireflies':
            drawStarOrFirefly(p, now * 0.001);
            break;
          case 'lanterns':
            drawLantern(p);
            break;
          case 'rain-clouds':
            drawRainOrCloud(p);
            break;
          default:
            drawDroplet(p);
            break;
        }
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    // 7. Pause when browser tab is inactive / backgrounded
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

    // Start loop
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

  return (
    <canvas
      ref={canvasRef}
      className="floating-bg-canvas"
      aria-hidden="true"
    />
  );
};
