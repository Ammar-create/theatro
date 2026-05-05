// ===== CORE ICONS - PART 1: Navigation & Actions =====
export interface IconProps {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function renderIcon(
  icon: (props: IconProps) => string,
  width = 24,
  height = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = ''
): string {
  return icon({ width, height, color, strokeWidth, className });
}

export function characterColorStyle(character: { color: string }): string {
  return `background: ${character.color}20; color: ${character.color}; border-color: ${character.color}40;`;
}

export function characterColorClass(character: { color: string }): string {
  return `character-${character.color.replace('#', '')}`;
}

// Navigation
export const chevronLeft = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="m15 18-6-6 6-6"/></svg>`;

export const chevronRight = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="m9 18 6-6-6-6"/></svg>`;

export const arrowLeft = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;

export const menu = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;

// Actions
export const plus = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;

export const x = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

export const edit = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;

export const trash = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;

export const save = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

export const check = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M20 6 9 17l-5-5"/></svg>`;

export const refreshCw = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`;

export const gitBranch = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`;

export const send = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.146-10.94 10.939"/></svg>`;

// Media
export const mic = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>`;

export const volume = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;

export const image = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

export const play = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

export const pause = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

export const sparkles = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;

// Scenario/Character
export const scenario = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

export const character = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

export const users = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

export const theaterLogo = ({ width = 32, height = 32, color = 'currentColor', strokeWidth = 1.5 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M2 10s3-3 7-3 7 3 7 3"/><path d="M16 10s3-3 7-3 7 3 7 3" transform="translate(-10,0)"/><path d="M6 10v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V10"/><path d="M2 7l2.5-2.5L7 7"/><path d="M17 7l2.5-2.5L22 7"/><line x1="12" x2="12" y1="2" y2="7"/></svg>`;
