import React from 'react';

// ─── 12 Friendly, Original Civil Companion SVG Avatars ────────────────────────

export const CatAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-orange-100)" />
    {/* Ears */}
    <path d="M26 40L35 18L48 30Z" fill="var(--avatar-orange-500)" />
    <path d="M74 40L65 18L52 30Z" fill="var(--avatar-orange-500)" />
    <path d="M30 36L36 24L44 32Z" fill="var(--avatar-rose-200)" />
    <path d="M70 36L64 24L56 32Z" fill="var(--avatar-rose-200)" />
    {/* Head */}
    <circle cx="50" cy="56" r="32" fill="var(--avatar-orange-400)" />
    {/* Eyes */}
    <ellipse cx="38" cy="52" rx="4.5" ry="5.5" fill="var(--avatar-slate-800)" />
    <ellipse cx="62" cy="52" rx="4.5" ry="5.5" fill="var(--avatar-slate-800)" />
    <circle cx="39.5" cy="50.5" r="1.5" fill="var(--text-inverse)" />
    <circle cx="63.5" cy="50.5" r="1.5" fill="var(--text-inverse)" />
    {/* Nose & Mouth */}
    <path d="M46 62L54 62L50 66Z" fill="var(--avatar-rose-500)" />
    <path d="M50 66V70M50 70C47 70 44 68 44 68M50 70C53 70 56 68 56 68" stroke="var(--avatar-brown-900)" strokeWidth="2" strokeLinecap="round" />
    {/* Whiskers */}
    <line x1="24" y1="58" x2="36" y2="60" stroke="var(--avatar-brown-900)" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="65" x2="35" y2="64" stroke="var(--avatar-brown-900)" strokeWidth="2" strokeLinecap="round" />
    <line x1="76" y1="58" x2="64" y2="60" stroke="var(--avatar-brown-900)" strokeWidth="2" strokeLinecap="round" />
    <line x1="76" y1="65" x2="65" y2="64" stroke="var(--avatar-brown-900)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BearAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-amber-100)" />
    {/* Ears */}
    <circle cx="28" cy="30" r="13" fill="var(--avatar-amber-600)" />
    <circle cx="72" cy="30" r="13" fill="var(--avatar-amber-600)" />
    <circle cx="28" cy="30" r="7" fill="var(--avatar-amber-200)" />
    <circle cx="72" cy="30" r="7" fill="var(--avatar-amber-200)" />
    {/* Head */}
    <circle cx="50" cy="56" r="33" fill="var(--avatar-amber-700)" />
    {/* Snout */}
    <ellipse cx="50" cy="65" rx="16" ry="12" fill="var(--avatar-amber-200)" />
    <ellipse cx="50" cy="60" rx="6" ry="4" fill="var(--avatar-brown-950)" />
    <path d="M50 64V68M50 68C47 68 45 66 45 66M50 68C53 68 55 66 55 66" stroke="var(--avatar-brown-950)" strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="37" cy="49" r="4" fill="var(--avatar-slate-800)" />
    <circle cx="63" cy="49" r="4" fill="var(--avatar-slate-800)" />
    <circle cx="38" cy="48" r="1.3" fill="var(--text-inverse)" />
    <circle cx="64" cy="48" r="1.3" fill="var(--text-inverse)" />
  </svg>
);

export const OwlAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-indigo-100)" />
    {/* Feather Tufts */}
    <path d="M30 38L22 18L40 28Z" fill="var(--avatar-indigo-700)" />
    <path d="M70 38L78 18L60 28Z" fill="var(--avatar-indigo-700)" />
    {/* Body & Head */}
    <ellipse cx="50" cy="54" rx="33" ry="34" fill="var(--avatar-indigo-500)" />
    {/* Belly */}
    <ellipse cx="50" cy="68" rx="20" ry="16" fill="var(--avatar-indigo-200)" />
    {/* Big Eye Patches */}
    <circle cx="36" cy="46" r="14" fill="var(--text-inverse)" />
    <circle cx="64" cy="46" r="14" fill="var(--text-inverse)" />
    <circle cx="36" cy="46" r="7" fill="var(--avatar-indigo-950)" />
    <circle cx="64" cy="46" r="7" fill="var(--avatar-indigo-950)" />
    <circle cx="38" cy="44" r="2.5" fill="var(--text-inverse)" />
    <circle cx="66" cy="44" r="2.5" fill="var(--text-inverse)" />
    {/* Beak */}
    <path d="M46 48L54 48L50 58Z" fill="var(--avatar-amber-500)" />
  </svg>
);

export const FoxAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-orange-100)" />
    {/* Big pointed ears */}
    <path d="M22 45L24 16L48 35Z" fill="var(--avatar-orange-600)" />
    <path d="M78 45L76 16L52 35Z" fill="var(--avatar-orange-600)" />
    <path d="M26 40L28 22L42 34Z" fill="var(--text-inverse)" />
    <path d="M74 40L72 22L58 34Z" fill="var(--text-inverse)" />
    {/* Head */}
    <path d="M20 50C20 68 34 82 50 82C66 82 80 68 80 50C80 40 68 38 50 38C32 38 20 40 20 50Z" fill="var(--avatar-orange-600)" />
    {/* White cheeks */}
    <path d="M20 54C26 68 40 78 50 78C60 78 74 68 80 54C76 46 64 54 50 60C36 54 24 46 20 54Z" fill="var(--text-inverse)" />
    {/* Nose */}
    <circle cx="50" cy="74" r="3.5" fill="var(--avatar-slate-800)" />
    {/* Eyes */}
    <path d="M32 48C36 44 42 45 44 49" stroke="var(--avatar-slate-800)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M68 48C64 44 58 45 56 49" stroke="var(--avatar-slate-800)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const DeerAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-green-100)" />
    {/* Antlers */}
    <path d="M36 28L30 14M30 14L22 18M30 14L34 8" stroke="var(--avatar-brown-800)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M64 28L70 14M70 14L78 18M70 14L66 8" stroke="var(--avatar-brown-800)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Ears */}
    <ellipse cx="24" cy="38" rx="10" ry="6" transform="rotate(-30 24 38)" fill="var(--avatar-amber-700)" />
    <ellipse cx="76" cy="38" rx="10" ry="6" transform="rotate(30 76 38)" fill="var(--avatar-amber-700)" />
    {/* Head */}
    <ellipse cx="50" cy="56" rx="28" ry="30" fill="var(--avatar-amber-600)" />
    <ellipse cx="50" cy="67" rx="15" ry="11" fill="var(--avatar-amber-100)" />
    {/* Snout & Nose */}
    <circle cx="50" cy="64" r="3.5" fill="var(--avatar-brown-950)" />
    {/* Big gentle eyes */}
    <circle cx="37" cy="49" r="4" fill="var(--avatar-slate-800)" />
    <circle cx="63" cy="49" r="4" fill="var(--avatar-slate-800)" />
    <circle cx="38" cy="47.5" r="1.5" fill="var(--text-inverse)" />
    <circle cx="64" cy="47.5" r="1.5" fill="var(--text-inverse)" />
    {/* Forehead spots */}
    <circle cx="50" cy="38" r="2" fill="var(--avatar-amber-100)" />
    <circle cx="45" cy="42" r="1.5" fill="var(--avatar-amber-100)" />
    <circle cx="55" cy="42" r="1.5" fill="var(--avatar-amber-100)" />
  </svg>
);

export const RabbitAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-pink-100)" />
    {/* Long Bunny Ears */}
    <ellipse cx="36" cy="26" rx="8" ry="22" transform="rotate(-8 36 26)" fill="var(--avatar-rose-400)" />
    <ellipse cx="36" cy="26" rx="4" ry="15" transform="rotate(-8 36 26)" fill="var(--avatar-pink-50)" />
    <ellipse cx="64" cy="26" rx="8" ry="22" transform="rotate(8 64 26)" fill="var(--avatar-rose-400)" />
    <ellipse cx="64" cy="26" rx="4" ry="15" transform="rotate(8 64 26)" fill="var(--avatar-pink-50)" />
    {/* Head */}
    <circle cx="50" cy="62" r="28" fill="var(--avatar-pink-500)" />
    {/* Cheeks */}
    <ellipse cx="36" cy="66" rx="10" ry="8" fill="var(--avatar-pink-50)" />
    <ellipse cx="64" cy="66" rx="10" ry="8" fill="var(--avatar-pink-50)" />
    {/* Nose */}
    <polygon points="47,62 53,62 50,65" fill="var(--avatar-pink-900)" />
    {/* Eyes */}
    <circle cx="37" cy="55" r="3.5" fill="var(--avatar-slate-800)" />
    <circle cx="63" cy="55" r="3.5" fill="var(--avatar-slate-800)" />
    <circle cx="38" cy="54" r="1.2" fill="var(--text-inverse)" />
    <circle cx="64" cy="54" r="1.2" fill="var(--text-inverse)" />
    {/* Whiskers */}
    <line x1="22" y1="64" x2="32" y2="65" stroke="var(--avatar-pink-800)" strokeWidth="1.5" />
    <line x1="78" y1="64" x2="68" y2="65" stroke="var(--avatar-pink-800)" strokeWidth="1.5" />
  </svg>
);

export const SproutAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-green-200)" />
    {/* Pot / Earth mound */}
    <path d="M24 74C30 68 70 68 76 74L72 84H28L24 74Z" fill="var(--avatar-green-700)" />
    {/* Sprout stem */}
    <path d="M50 70C50 56 48 44 42 36" stroke="var(--avatar-green-600)" strokeWidth="5" strokeLinecap="round" />
    {/* Leaf left */}
    <path d="M42 36C28 34 26 22 40 24C48 25 46 34 42 36Z" fill="var(--avatar-green-500)" />
    {/* Leaf right */}
    <path d="M45 42C60 38 64 26 50 28C43 30 44 40 45 42Z" fill="var(--avatar-green-400)" />
    {/* Little dew drop */}
    <circle cx="32" cy="27" r="2.5" fill="var(--avatar-sky-100)" />
  </svg>
);

export const MountainAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-sky-100)" />
    {/* Rising Sun */}
    <circle cx="68" cy="34" r="14" fill="var(--avatar-amber-400)" />
    {/* Back Mountain */}
    <polygon points="40,36 12,82 68,82" fill="var(--avatar-slate-500)" />
    <polygon points="40,36 31,50 48,50" fill="var(--avatar-slate-100)" />
    {/* Front Mountain */}
    <polygon points="62,42 34,82 90,82" fill="var(--avatar-sky-700)" />
    <polygon points="62,42 52,56 72,56" fill="var(--text-inverse)" />
  </svg>
);

export const WaveAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-cyan-100)" />
    {/* Dynamic Wave */}
    <path
      d="M16 66C24 66 32 58 40 48C48 38 56 30 68 32C78 34 84 44 80 54C76 64 66 66 60 62C54 58 56 50 62 48C66 46 70 48 70 50"
      stroke="var(--avatar-sky-600)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M16 78C30 78 40 70 50 64C60 58 72 62 84 72"
      stroke="var(--avatar-sky-400)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="48" cy="34" r="3.5" fill="var(--avatar-sky-600)" />
  </svg>
);

export const ShieldAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--brand-surface)" />
    {/* Themed Guardian Shield */}
    <path
      d="M50 18L26 28V50C26 66 36 78 50 84C64 78 74 66 74 50V28L50 18Z"
      fill="var(--brand-primary)"
    />
    <path
      d="M50 24L32 32V50C32 63 40 73 50 78C60 73 68 63 68 50V32L50 24Z"
      fill="var(--brand-hover)"
    />
    {/* Themed Star Beacon */}
    <path
      d="M50 36L53 45H62L55 51L57 60L50 55L43 60L45 51L38 45H47L50 36Z"
      fill="var(--brand-accent)"
    />
  </svg>
);

export const CompassAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-teal-100)" />
    {/* Dial ring */}
    <circle cx="50" cy="50" r="32" stroke="var(--avatar-teal-600)" strokeWidth="4" fill="var(--avatar-teal-50)" />
    {/* Cardinal marks */}
    <line x1="50" y1="20" x2="50" y2="25" stroke="var(--avatar-teal-700)" strokeWidth="3" />
    <line x1="50" y1="75" x2="50" y2="80" stroke="var(--avatar-teal-700)" strokeWidth="3" />
    <line x1="20" y1="50" x2="25" y2="50" stroke="var(--avatar-teal-700)" strokeWidth="3" />
    <line x1="75" y1="50" x2="80" y2="50" stroke="var(--avatar-teal-700)" strokeWidth="3" />
    {/* Star Needle */}
    <polygon points="50,26 55,48 50,45 45,48" fill="var(--avatar-red-500)" />
    <polygon points="50,74 55,52 50,55 45,52" fill="var(--avatar-teal-700)" />
    <circle cx="50" cy="50" r="4" fill="var(--avatar-teal-900)" />
  </svg>
);

export const SunAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="var(--avatar-amber-300)" />
    {/* Rays */}
    <g stroke="var(--avatar-amber-500)" strokeWidth="4" strokeLinecap="round">
      <line x1="50" y1="14" x2="50" y2="22" />
      <line x1="50" y1="78" x2="50" y2="86" />
      <line x1="14" y1="50" x2="22" y2="50" />
      <line x1="78" y1="50" x2="86" y2="50" />
      <line x1="24" y1="24" x2="30" y2="30" />
      <line x1="70" y1="70" x2="76" y2="76" />
      <line x1="24" y1="76" x2="30" y2="70" />
      <line x1="70" y1="30" x2="76" y2="24" />
    </g>
    {/* Sun Center */}
    <circle cx="50" cy="50" r="22" fill="var(--avatar-amber-400)" />
    {/* Smiling Face */}
    <circle cx="43" cy="46" r="2.5" fill="var(--avatar-brown-800)" />
    <circle cx="57" cy="46" r="2.5" fill="var(--avatar-brown-800)" />
    <path d="M43 54C46 58 54 58 57 54" stroke="var(--avatar-brown-800)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// ─── Preset Registry (12 Friendly Civil Avatars) ──────────────────────────────

export interface PresetAvatarItem {
  id: string;
  nameEn: string;
  nameBm: string;
  category: 'animal' | 'nature' | 'civic';
  Component: React.FC<{ size?: number }>;
}

export const PRESET_AVATARS: PresetAvatarItem[] = [
  { id: 'preset:cat', nameEn: 'Whiskers Cat', nameBm: 'Kucing Comel', category: 'animal', Component: CatAvatar },
  { id: 'preset:bear', nameEn: 'Gentle Bear', nameBm: 'Beruang Mesra', category: 'animal', Component: BearAvatar },
  { id: 'preset:owl', nameEn: 'Wise Owl', nameBm: 'Burung Hantu', category: 'animal', Component: OwlAvatar },
  { id: 'preset:fox', nameEn: 'Mountain Fox', nameBm: 'Musang Pintar', category: 'animal', Component: FoxAvatar },
  { id: 'preset:deer', nameEn: 'Forest Deer', nameBm: 'Rusa Hutan', category: 'animal', Component: DeerAvatar },
  { id: 'preset:rabbit', nameEn: 'Spring Rabbit', nameBm: 'Arnab Lincah', category: 'animal', Component: RabbitAvatar },
  { id: 'preset:sprout', nameEn: 'Resilient Sprout', nameBm: 'Pucuk Harapan', category: 'nature', Component: SproutAvatar },
  { id: 'preset:mountain', nameEn: 'Sunrise Peak', nameBm: 'Puncak Fajar', category: 'nature', Component: MountainAvatar },
  { id: 'preset:wave', nameEn: 'Calm Wave', nameBm: 'Ombak Tenang', category: 'nature', Component: WaveAvatar },
  { id: 'preset:shield', nameEn: 'Guardian Shield', nameBm: 'Perisai Awam', category: 'civic', Component: ShieldAvatar },
  { id: 'preset:compass', nameEn: 'Explorer Compass', nameBm: 'Kompas Pandu', category: 'civic', Component: CompassAvatar },
  { id: 'preset:sun', nameEn: 'Radiant Sun', nameBm: 'Suria Ceria', category: 'nature', Component: SunAvatar },
];

export const DEFAULT_AVATAR_ID = 'preset:shield';

// ─── Universal Avatar Display Helper ──────────────────────────────────────────

export const AvatarDisplay: React.FC<{
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}> = ({ avatarUrl, name = 'Civilian', size = 56, className = '' }) => {
  const currentAvatar = avatarUrl || DEFAULT_AVATAR_ID;

  // 1. Preset SVG Avatar
  if (currentAvatar.startsWith('preset:')) {
    const matched = PRESET_AVATARS.find(p => p.id === currentAvatar) || PRESET_AVATARS[9]; // default shield
    const SvgComp = matched.Component;
    return (
      <div 
        className={`avatar-frame ${className}`} 
        style={{ width: size, height: size, borderRadius: 'var(--radius-xs)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <SvgComp size={size} />
      </div>
    );
  }

  // 2. Custom Image (Storage URL or Data URL)
  if (currentAvatar.startsWith('http') || currentAvatar.startsWith('data:')) {
    return (
      <img
        src={currentAvatar}
        alt={name}
        className={`avatar-frame ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-xs)',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    );
  }

  // 3. Fallback Initial
  const initial = name ? name.charAt(0).toUpperCase() : 'C';
  return (
    <div
      className={`avatar-frame ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-xs)',
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover))',
        color: 'var(--text-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
      }}
    >
      {initial}
    </div>
  );
};
