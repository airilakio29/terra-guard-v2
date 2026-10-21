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
  | 'bubbles'          // 2. Ocean
  | 'leaves'           // 3. Forest
  | 'neko-paws'        // 4. Neko
  | 'sakura-petals'    // 5. Sakura
  | 'stars-fireflies'  // 6. Aurora Night
  | 'lanterns'         // 7. Sunset Lantern
  | 'rain-clouds';     // 8. Monsoon

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

  // ─── 2. Ocean (Light, Aqua and Deep Blue) ───────────────────────────────────
  {
    id: 'ocean',
    nameEn: 'Ocean Aqua',
    nameBm: 'Laut Biru',
    mode: 'light',
    descriptionEn: 'Refreshing coastal tones with softly wobbling rising bubbles and deep sea marine accents.',
    descriptionBm: 'Rona pesisir segar dengan buih laut terapung perlahan dan aksen marin biru pekat.',
    preview: {
      bgCanvas: '#F0F9FF',
      bgSurface: '#FFFFFF',
      brandPrimary: '#0284C7',
      textPrimary: '#0A192F',
      borderSubtle: '#BAE6FD',
      accentColor: '#0EA5E9',
    },
    colors: {
      '--bg-canvas': '#F0F9FF',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#E0F2FE',
      '--border-subtle': '#BAE6FD',
      '--border-strong': '#7DD3FC',
      '--text-primary': '#0A192F',
      '--text-secondary': '#1E293B',
      '--text-muted': '#3B536E',
      '--brand-primary': '#0284C7',
      '--brand-hover': '#0369A1',
      '--brand-surface': '#E0F2FE',
      '--brand-border': '#7DD3FC',
    },
    backgroundEffectId: 'dots',
    floatingEffect: {
      type: 'bubbles',
      direction: 'up',
      speed: 1.0,
      opacity: 0.32,
      colors: ['#38BDF8', '#0EA5E9', '#7DD3FC', '#0284C7'],
    },
  },

  // ─── 3. Forest (Light, Fresh Greens & Warm Earth Accents) ───────────────────
  {
    id: 'forest',
    nameEn: 'Forest Woodland',
    nameBm: 'Rimbun Hutan',
    mode: 'light',
    descriptionEn: 'Calm canopy greens with rotating falling leaves and grounded earth timber highlights.',
    descriptionBm: 'Hijau rimbunan rimba tenang dengan dedaun berputar perlahan dan tona kayu bumi.',
    preview: {
      bgCanvas: '#F2FBF5',
      bgSurface: '#FFFFFF',
      brandPrimary: '#15803D',
      textPrimary: '#061D12',
      borderSubtle: '#D1E7DD',
      accentColor: '#D97706',
    },
    colors: {
      '--bg-canvas': '#F2FBF5',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#E8F5E9',
      '--border-subtle': '#D1E7DD',
      '--border-strong': '#A3CFBB',
      '--text-primary': '#061D12',
      '--text-secondary': '#132E1E',
      '--text-muted': '#2E4C38',
      '--brand-primary': '#15803D',
      '--brand-hover': '#166534',
      '--brand-surface': '#F0FDF4',
      '--brand-border': '#BBF7D0',
    },
    backgroundEffectId: 'subtle-grid',
    floatingEffect: {
      type: 'leaves',
      direction: 'down',
      speed: 0.85,
      opacity: 0.3,
      colors: ['#22C55E', '#16A34A', '#84CC16', '#D97706'],
    },
  },

  // ─── 4. Neko (Light, Soft Peach & Cream with Coral Accent) ──────────────────
  {
    id: 'neko',
    nameEn: 'Neko Peach',
    nameBm: 'Neko Persik',
    mode: 'light',
    descriptionEn: 'Gentle warmth with drifting cat silhouettes, playful paw prints, and warm cream surfaces.',
    descriptionBm: 'Kehangatan mesra dengan siluet kucing terapung, jejak tapak comel, dan tona krim persik.',
    preview: {
      bgCanvas: '#FFF8F3',
      bgSurface: '#FFFFFF',
      brandPrimary: '#E11D48',
      textPrimary: '#1B0C06',
      borderSubtle: '#FEE2D5',
      accentColor: '#F97316',
    },
    colors: {
      '--bg-canvas': '#FFF8F3',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#FFF1EB',
      '--border-subtle': '#FEE2D5',
      '--border-strong': '#FDBA9B',
      '--text-primary': '#1B0C06',
      '--text-secondary': '#2E160E',
      '--text-muted': '#4A281E',
      '--brand-primary': '#E11D48',
      '--brand-hover': '#BE123C',
      '--brand-surface': '#FFF1F2',
      '--brand-border': '#FECDD3',
    },
    backgroundEffectId: 'none',
    floatingEffect: {
      type: 'neko-paws',
      direction: 'drift',
      speed: 0.75,
      opacity: 0.26,
      colors: ['#FB7185', '#FDBA74', '#F43F5E', '#FDA4AF'],
    },
  },

  // ─── 5. Sakura (Light, Soft Pink with Deep Plum Accent) ─────────────────────
  {
    id: 'sakura',
    nameEn: 'Sakura Blossom',
    nameBm: 'Bunga Sakura',
    mode: 'light',
    descriptionEn: 'Poetic spring elegance featuring drifting cherry blossom petals and deep plum typography.',
    descriptionBm: 'Keanggunan musim bunga dengan kelopak sakura gugur berbuai dan tipografi plum pekat.',
    preview: {
      bgCanvas: '#FDF2F8',
      bgSurface: '#FFFFFF',
      brandPrimary: '#BE185D',
      textPrimary: '#1C0612',
      borderSubtle: '#FBCFE8',
      accentColor: '#EC4899',
    },
    colors: {
      '--bg-canvas': '#FDF2F8',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#FCE7F3',
      '--border-subtle': '#FBCFE8',
      '--border-strong': '#F472B6',
      '--text-primary': '#1C0612',
      '--text-secondary': '#2E0F20',
      '--text-muted': '#4A2239',
      '--brand-primary': '#BE185D',
      '--brand-hover': '#9D174D',
      '--brand-surface': '#FDF2F8',
      '--brand-border': '#FBCFE8',
    },
    backgroundEffectId: 'dots',
    floatingEffect: {
      type: 'sakura-petals',
      direction: 'down',
      speed: 0.9,
      opacity: 0.32,
      colors: ['#F472B6', '#FDA4AF', '#FDF2F8', '#EC4899'],
    },
  },

  // ─── 6. Aurora Night (Dark, Deep Navy with Teal & Violet Accents) ───────────
  {
    id: 'aurora-night',
    nameEn: 'Aurora Night',
    nameBm: 'Malam Aurora',
    mode: 'dark',
    descriptionEn: 'Deep space night mode with gentle twinkling stars, glowing fireflies, and vibrant aurora teal.',
    descriptionBm: 'Mod malam angkasa dengan kerlipan bintang, kelip-kelip berseri, dan aurora firus bercahaya.',
    preview: {
      bgCanvas: '#0B0F19',
      bgSurface: '#111827',
      brandPrimary: '#14B8A6',
      textPrimary: '#FFFFFF',
      borderSubtle: '#26334D',
      accentColor: '#A78BFA',
    },
    colors: {
      '--bg-canvas': '#0B0F19',
      '--bg-surface': '#111827',
      '--bg-subtle': '#1F2937',
      '--border-subtle': '#26334D',
      '--border-strong': '#3B4D70',
      '--text-primary': '#FFFFFF',
      '--text-secondary': '#F3F4F6',
      '--text-muted': '#D1D5DB',
      '--brand-primary': '#14B8A6',
      '--brand-hover': '#0D9488',
      '--brand-surface': 'rgba(20, 184, 166, 0.14)',
      '--brand-border': 'rgba(20, 184, 166, 0.35)',
    },
    backgroundEffectId: 'none',
    floatingEffect: {
      type: 'stars-fireflies',
      direction: 'up',
      speed: 0.7,
      opacity: 0.38,
      colors: ['#2DD4BF', '#A78BFA', '#38BDF8', '#FDE047'],
    },
  },

  // ─── 7. Sunset Lantern (Warm Light, Orange & Gold with Deep Maroon) ─────────
  {
    id: 'sunset-lantern',
    nameEn: 'Sunset Lantern',
    nameBm: 'Tanglung Senja',
    mode: 'light',
    descriptionEn: 'Warm twilight glow with slowly rising festival paper lanterns and amber gold accents.',
    descriptionBm: 'Kilauan senja hangat dengan tanglung perayaan naik perlahan dan aksen emas jingga.',
    preview: {
      bgCanvas: '#FFFBEB',
      bgSurface: '#FFFFFF',
      brandPrimary: '#D97706',
      textPrimary: '#1C0F05',
      borderSubtle: '#FDE68A',
      accentColor: '#F59E0B',
    },
    colors: {
      '--bg-canvas': '#FFFBEB',
      '--bg-surface': '#FFFFFF',
      '--bg-subtle': '#FEF3C7',
      '--border-subtle': '#FDE68A',
      '--border-strong': '#FBBF24',
      '--text-primary': '#1C0F05',
      '--text-secondary': '#2E180A',
      '--text-muted': '#4D2D18',
      '--brand-primary': '#D97706',
      '--brand-hover': '#B45309',
      '--brand-surface': '#FFFBEB',
      '--brand-border': '#FDE68A',
    },
    backgroundEffectId: 'dots',
    floatingEffect: {
      type: 'lanterns',
      direction: 'up',
      speed: 0.8,
      opacity: 0.35,
      colors: ['#F59E0B', '#F97316', '#FBBF24', '#EF4444'],
    },
  },

  // ─── 8. Monsoon (Dark Slate & Blue Grey with Cyan Accent) ───────────────────
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

  // 4. Update dynamic favicon with active theme brand color
  try {
    const favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (favicon) {
      const brandColor = encodeURIComponent(theme.preview.brandPrimary);
      favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${brandColor}'><path d='M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 10.38 9.5 9s1.12-2.5 2.5-2.5zm0 13c-2.33 0-4.32-.93-5.75-2.42.03-1.91 3.83-2.96 5.75-2.96 1.91 0 5.72 1.05 5.75 2.96-1.43 1.49-3.42 2.42-5.75 2.42z'/></svg>`;
    }
  } catch {
    // ignore
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
