/**
 * Single source of truth for the RALLY Design System & Color Palette
 * 
 * Hierarchy:
 * - PURPLE (#4F46E5)   : RALLY / primary interaction / branding / active tabs / active links / FAB
 * - DARK (#18181B)     : Strong primary CTA (CREATE A RALLY, BE THE FIRST TO RALLY)
 * - GREEN (#10B981)    : HELP / success / active / voice / microphone
 * - RED-PINK (#F43F5E) : ASK / alert / urgent / warnings / destructive
 * - BLUE-INDIGO (#6366F1): JOIN / social / community / people
 * - ORANGE (#F59E0B)   : PAID / premium / special / time-sensitive
 * - NEUTRALS           : #FAFAFA, #FFFFFF, #18181B, #52525B, #71717A, #E4E4E7, #F4F4F5
 */

export const RALLY_COLORS = {
  primary: {
    DEFAULT: '#4F46E5', // indigo-600
    hover: '#4338CA',   // indigo-700
    light: '#EEF2FF',   // indigo-50
    border: '#C7D2FE',  // indigo-200
    text: '#4F46E5',
  },
  dark: {
    DEFAULT: '#18181B', // zinc-900
    hover: '#27272A',   // zinc-800
    text: '#FFFFFF',
  },
  help: {
    DEFAULT: '#10B981', // emerald-500
    dark: '#059669',    // emerald-600
    light: '#ECFDF5',   // emerald-50
    border: '#A7F3D0',  // emerald-200
    text: '#047857',    // emerald-700
  },
  ask: {
    DEFAULT: '#F43F5E', // rose-500
    dark: '#E11D48',    // rose-600
    light: '#FFF1F2',   // rose-50
    border: '#FECDD3',  // rose-200
    text: '#BE123C',    // rose-700
  },
  join: {
    DEFAULT: '#6366F1', // indigo-500
    dark: '#4F46E5',    // indigo-600
    light: '#EEF2FF',   // indigo-50
    border: '#C7D2FE',  // indigo-200
    text: '#4338CA',    // indigo-700
  },
  paid: {
    DEFAULT: '#F59E0B', // amber-500
    dark: '#D97706',    // amber-600
    light: '#FFFBEB',   // amber-50
    border: '#FDE68A',  // amber-200
    text: '#B45309',    // amber-700
  },
  neutral: {
    background: '#FAFAFA', // zinc-50
    surface: '#FFFFFF',    // white
    text: '#18181B',       // zinc-900
    secondary: '#52525B',  // zinc-600
    muted: '#71717A',      // zinc-500
    border: '#E4E4E7',     // zinc-200
    subtle: '#F4F4F5',     // zinc-100
  }
} as const;

/**
 * Standard semantic badge styles for RALLY activity types
 */
export const TYPE_BADGE_STYLES = {
  ASK: {
    container: 'bg-rose-50 text-rose-600 border border-rose-100',
    iconColor: 'text-rose-600',
    hover: 'hover:bg-rose-100/60',
    dot: 'bg-rose-500',
  },
  HELP: {
    container: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    iconColor: 'text-emerald-600',
    hover: 'hover:bg-emerald-100/60',
    dot: 'bg-emerald-500',
  },
  JOIN: {
    container: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    iconColor: 'text-indigo-600',
    hover: 'hover:bg-indigo-100/60',
    dot: 'bg-indigo-500',
  },
} as const;

/**
 * Standard button variants adhering to RALLY design rules
 */
export const BUTTON_STYLES = {
  // Primary Dark (Strong CTA: CREATE A RALLY, BE THE FIRST TO RALLY)
  primaryDark: 'bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all shadow-sm active:scale-95 disabled:bg-zinc-300 disabled:text-zinc-500',
  
  // Primary Purple (Branded interactive actions)
  primaryPurple: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50',
  
  // Secondary (Neutral surface with clean border)
  secondary: 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50',
  
  // Subtle Neutral
  subtle: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold transition-all active:scale-95 disabled:opacity-50',
  
  // Danger / Destructive (Red-pink)
  danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all active:scale-95 disabled:opacity-50',
  
  // Voice / Mic action (Help green)
  voice: 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-sm active:scale-95',
} as const;
