/**
 * Terra Guard V2 — Theme Registry & Design System Tokens
 *
 * CRITICAL CIVIC SAFETY RULE:
 * The emergency status semantic colors (All Clear safe green, Advisory amber,
 * Danger critical red) and their emergency icons MUST remain fixed and clearly
 * distinguishable across EVERY theme. Themes may only customize the neutral
 * palette, surfaces, borders, brand accents, and subtle background effects.
 */

export interface ThemeColors {
  '--bg-canvas': string;
  '--bg-surface': string;
  '--bg-subtle': string;
  '--border-subtle': string;
  '--border-strong': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--brand-primary': string;
  '--brand-hover': string;
  '--brand-surface': string;
  '--brand-border': string;
}

export type BackgroundEffectId = 'subtle-grid' | 'none' | 'mesh' | 'dots';

export type FloatingEffectType =
  | 'droplets'         // 1. Terra Classic
  | 'rain-clouds'      // 2. Monsoon Slate
  | 'golden-leaves';   // 3. Sime Darby

export interface FloatingEffectConfig {
  type: FloatingEffectType;
  direction: 'up' | 'down' | 'drift';
  speed: number;       // base speed multiplier (0.8 - 1.4)
  opacity: number;     // base opacity (0.15 - 0.4)
  colors: string[];    // particle color palette
}

export interface ThemeConfig {
  id: string;
  nameEn: string;
  nameBm: string;
  mode: 'light' | 'dark';
  descriptionEn: string;
  descriptionBm: string;
  preview: {
    bgCanvas: string;
    bgSurface: string;
    brandPrimary: string;
    textPrimary: string;
    borderSubtle: string;
    accentColor: string;
  };
  colors: ThemeColors;
  backgroundEffectId: BackgroundEffectId;
  floatingEffect: FloatingEffectConfig;
}

export const DEFAULT_THEME_ID = 'terra-classic';

export const THEME_REGISTRY: ThemeConfig[] = [
  // ─── 1. Terra Classic (Light, Official Civic Default) ───────────────────────
  {
    id: 'terra-classic',
    nameEn: 'Terra Classic',
    nameBm: 'Terra Klasik',
    mode: 'light',
    descriptionEn: 'High contrast daylight palette with floating moisture droplets and glowing civilian safety beacons.',
    descriptionBm: 'Palet siang berkontras tinggi dengan titisan air terapung dan suar keselamatan awam berseri.',
    preview: {
      bgCanvas: '#F8FAFC',
      bgSurface: '#FFFFFF',
      brandPrimary: '#0284C7',
      textPrimary: '#0F172A',
      borderSubtle: '#E2E8F0',
      accentColor: '#10B981',
    },
    colors: {
      '--bg-canvas': '#F8FAFC',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#F1F5F9',
      '--border-subtle': '#E2E8F0',
      '--border-strong': '#CBD5E1',
      '--text-primary': '#0F172A',
      '--text-secondary': '#1E293B',
      '--text-muted': '#475569',
      '--brand-primary': '#0284C7',
      '--brand-hover': '#0369A1',
      '--brand-surface': '#F0F9FF',
      '--brand-border': '#BAE6FD',
    },
    backgroundEffectId: 'subtle-grid',
    floatingEffect: {
      type: 'droplets',
      direction: 'drift',
      speed: 0.9,
      opacity: 0.28,
      colors: ['#0284C7', '#10B981', '#38BDF8', '#34D399'],
    },
  },

  // ─── 2. Monsoon Slate (Dark, Tactical Storm & Mist) ─────────────────────────
  {
    id: 'monsoon',
    nameEn: 'Monsoon Slate',
    nameBm: 'Tengkujuh Monsun',
    mode: 'dark',
    descriptionEn: 'Tactical stormy weather palette with gentle translucent rain streaks and drifting mist clouds.',
    descriptionBm: 'Palet cuaca ribut taktikal dengan titisan hujan telus tenang dan kabus berarak santai.',
    preview: {
      bgCanvas: '#0D1117',
      bgSurface: '#161B22',
      brandPrimary: '#38BDF8',
      textPrimary: '#FFFFFF',
      borderSubtle: '#30363D',
      accentColor: '#0EA5E9',
    },
    colors: {
      '--bg-canvas': '#0D1117',
      '--bg-surface': '#161B22',
      '--bg-subtle': '#21262D',
      '--border-subtle': '#30363D',
      '--border-strong': '#484F58',
      '--text-primary': '#FFFFFF',
      '--text-secondary': '#F0F6FC',
      '--text-muted': '#C9D1D9',
      '--brand-primary': '#38BDF8',
      '--brand-hover': '#0EA5E9',
      '--brand-surface': 'rgba(56, 189, 248, 0.14)',
      '--brand-border': 'rgba(56, 189, 248, 0.32)',
    },
    backgroundEffectId: 'none',
    floatingEffect: {
      type: 'rain-clouds',
      direction: 'down',
      speed: 1.1,
      opacity: 0.3,
      colors: ['#38BDF8', '#0EA5E9', '#94A3B8', '#E2E8F0'],
    },
  },

  // ─── 3. Sime Darby (Signature Brand Orange & Golden Yellow) ────────────────
  {
    id: 'sime-darby',
    nameEn: 'Sime Darby',
    nameBm: 'Sime Darby',
    mode: 'light',
    descriptionEn: 'Signature Sime Darby brand palette in warm vibrant orange and golden yellow with drifting golden aura particles and soft flora leaves.',
    descriptionBm: 'Palet rasmi jenama Sime Darby dengan jingga terang dan kuning keemasan berseri serta zarah emas dan dedaun terapung.',
    preview: {
      bgCanvas: '#FFF4DC',
      bgSurface: '#FFFBF2',
      brandPrimary: '#F28C00',
      textPrimary: '#2B1A00',
      borderSubtle: '#F2D49B',
      accentColor: '#FFC20E',
    },
    colors: {
      '--bg-canvas': '#FFF4DC',
      '--bg-surface': '#FFFBF2',
      '--bg-subtle': '#FEF3D6',
      '--border-subtle': '#F2D49B',
      '--border-strong': '#E5BE72',
      '--text-primary': '#2B1A00',
      '--text-secondary': '#3D2600',
      '--text-muted': '#6B4A12',
      '--brand-primary': '#F28C00',
      '--brand-hover': '#D97700',
      '--brand-surface': '#FFF4DC',
      '--brand-border': '#F2D49B',
    },
    backgroundEffectId: 'dots',
    floatingEffect: {
      type: 'golden-leaves',
      direction: 'drift',
      speed: 0.8,
      opacity: 0.22,
      colors: ['#F28C00', '#FFC20E', '#E5BE72', '#D97700'],
    },
  },
];

/**
 * Apply a theme to the root element through CSS custom properties
 */
export function applyTheme(
  theme: ThemeConfig,
  reduceEffects: boolean = false,
  reduceMotion: boolean = false
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Set CSS Color Custom Properties
  Object.entries(theme.colors).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  // 2. Data attributes for theme ID and mode (light vs dark)
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.dataset.bgEffect = reduceEffects ? 'none' : theme.backgroundEffectId;
  root.style.colorScheme = theme.mode;

  // 3. Update browser UI color (meta theme-color)
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme && theme.preview.bgCanvas) {
    metaTheme.setAttribute('content', theme.preview.bgCanvas);
  }



  if (reduceEffects) {
    root.dataset.reduceEffects = 'true';
  } else {
    delete root.dataset.reduceEffects;
  }

  // 5. Manual reduce-motion override
  if (reduceMotion) {
    root.dataset.reduceMotion = 'true';
  } else {
    delete root.dataset.reduceMotion;
  }
}

/**
 * Find a theme config by ID, falling back to default
 */
export function getThemeById(themeId: string): ThemeConfig {
  if (themeId === 'default-slate') {
    return THEME_REGISTRY[0];
  }
  return THEME_REGISTRY.find(t => t.id === themeId) || THEME_REGISTRY[0];
}
