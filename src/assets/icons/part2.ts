// ===== CORE ICONS - PART 2: Controller & Settings =====
import type { IconProps } from './part1';

export { IconProps, renderIcon, characterColorStyle, characterColorClass } from './part1';

// Controller/Debug
export const cpu = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`;

export const activity = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;

export const bug = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`;

export const terminal = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`;

// Settings
export const settings = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

export const panelRight = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>`;

export const moon = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

export const sun = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

export const search = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

export const autoPlay = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>`;

export const wand = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M15 4V2"/><path d="M15 16a4 4 0 0 0-4-4"/><path d="M15 22a4 4 0 0 0-4-4"/><path d="m17 8 1.414-1.414a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.828L21 12"/><path d="m21 12 1.414-1.414a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.828L24 16"/><path d="M4 16a4 4 0 0 1 4-4"/><path d="M4 22a4 4 0 0 1 4-4"/></svg>`;

export const fileJson = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1v-2"/><path d="M14 13v-2"/></svg>`;

export const cloudUpload = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`;

export const zap = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

export const brain = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`;

export const messageSquare = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

export const heart = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

export const lock = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

export const eye = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

export const loader = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/></svg>`;

export const moreHorizontal = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps = {}) =>
  `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`;
