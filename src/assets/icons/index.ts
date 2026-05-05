/* Icons - SVG Components */

export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const defaultProps = {
  size: 24,
  color: 'currentColor',
  strokeWidth: 2,
  className: ''
};

function iconProps(props: IconProps = {}): string {
  const { size, color, strokeWidth, className } = { ...defaultProps, ...props };
  const w = typeof size === 'number' ? `${size}px` : size;
  const h = typeof size === 'number' ? `${size}px` : size;
  return `width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}"`;
}

function svg(attrs: string, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${content}</svg>`;
}

// NAVIGATION
export const IconMenu = (p?: IconProps) => svg(iconProps(p), '<line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line>');
export const IconArrowLeft = (p?: IconProps) => svg(iconProps(p), '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>');
export const IconChevronLeft = (p?: IconProps) => svg(iconProps(p), '<polyline points="15 18 9 12 15 6"></polyline>');
export const IconChevronRight = (p?: IconProps) => svg(iconProps(p), '<polyline points="9 18 15 12 9 6"></polyline>');
export const IconChevronDown = (p?: IconProps) => svg(iconProps(p), '<polyline points="6 9 12 15 18 9"></polyline>');
export const IconX = (p?: IconProps) => svg(iconProps(p), '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>');
export const IconHome = (p?: IconProps) => svg(iconProps(p), '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>');
export const IconSettings = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>');
export const IconPanelRight = (p?: IconProps) => svg(iconProps(p), '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path>');

// ACTIONS
export const IconSend = (p?: IconProps) => svg(iconProps(p), '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>');
export const IconEdit = (p?: IconProps) => svg(iconProps(p), '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>');
export const IconTrash = (p?: IconProps) => svg(iconProps(p), '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>');
export const IconRefreshCw = (p?: IconProps) => svg(iconProps(p), '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>');
export const IconGitBranch = (p?: IconProps) => svg(iconProps(p), '<line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>');
export const IconPlus = (p?: IconProps) => svg(iconProps(p), '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');
export const IconCopy = (p?: IconProps) => svg(iconProps(p), '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>');

// MEDIA
export const IconImage = (p?: IconProps) => svg(iconProps(p), '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>');
export const IconMic = (p?: IconProps) => svg(iconProps(p), '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>');
export const IconVolume = (p?: IconProps) => svg(iconProps(p), '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>');
export const IconPlay = (p?: IconProps) => svg(iconProps(p), '<polygon points="5 3 19 12 5 21 5 3"></polygon>');
export const IconPause = (p?: IconProps) => svg(iconProps(p), '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>');
export const IconAutoPlay = (p?: IconProps) => svg(iconProps(p), '<polygon points="5 3 19 12 5 21 5 3"></polygon><path d="m13 3 4 18"></path><path d="m19 3-4 18"></path><circle cx="9" cy="9" r="2"></circle><circle cx="15" cy="15" r="2"></circle>');

// SCENARIO
export const IconBookOpen = (p?: IconProps) => svg(iconProps(p), '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>');
export const IconLayers = (p?: IconProps) => svg(iconProps(p), '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>');
export const IconSparkles = (p?: IconProps) => svg(iconProps(p), '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M9 5h-4"></path><path d="M15 5h4"></path><path d="M19 3v4"></path><path d="M21 9h-4"></path><path d="M21 15h-4"></path><path d="M19 19v4"></path><path d="M15 21h4"></path><path d="M9 21h-4"></path><path d="M5 19v-4"></path><path d="M3 15h4"></path><path d="M3 9h4"></path>');
export const IconTheaterLogo = (p?: IconProps) => svg(iconProps(p), '<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"></path><path d="M8 7v10M16 7v10M12 7v10M4 12h16" stroke-dasharray="2 2" opacity="0.5"></path>');

// CHARACTER
export const IconUser = (p?: IconProps) => svg(iconProps(p), '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>');
export const IconUsers = (p?: IconProps) => svg(iconProps(p), '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>');
export const IconGhost = (p?: IconProps) => svg(iconProps(p), '<path d="M9 10h.01"></path><path d="M15 10h.01"></path><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>');

// CONTROLLERS
export const IconBrain = (p?: IconProps) => svg(iconProps(p), '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>');
export const IconWand = (p?: IconProps) => svg(iconProps(p), '<path d="M15 4V2"></path><path d="M15 16a4 4 0 0 0 4-4"></path><path d="M19.83 8.13a3 3 0 0 0 1.07-3.83"></path><path d="M21.5 4.5 20 3"></path><path d="m21 7 1-1"></path><path d="m3 21 7.548-7.548"></path><path d="m3 14.5 7.548 7.548"></path><path d="m17.5 9.5 1 1"></path><path d="M21 21 3 3"></path>');
export const IconEye = (p?: IconProps) => svg(iconProps(p), '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>');
export const IconEyeOff = (p?: IconProps) => svg(iconProps(p), '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line>');

// UI
export const IconCheck = (p?: IconProps) => svg(iconProps(p), '<polyline points="20 6 9 17 4 12"></polyline>');
export const IconAlertCircle = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>');
export const IconInfo = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>');
export const IconMoreVertical = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>');
export const IconMoreHorizontal = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>');
export const IconSearch = (p?: IconProps) => svg(iconProps(p), '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>');

// EMOTIONS
export const IconHeart = (p?: IconProps) => svg(iconProps(p), '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>');
export const IconSmile = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>');
export const IconFrown = (p?: IconProps) => svg(iconProps(p), '<circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>');

// STATUS
export const IconWifi = (p?: IconProps) => svg(iconProps(p), '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>');
export const IconWifiOff = (p?: IconProps) => svg(iconProps(p), '<line x1="2" y1="2" x2="22" y2="22"></line><path d="M8.5 16.5a5 5 0 0 1 7 0"></path><path d="M2 8.82a15 15 0 0 1 4.17-2.65"></path><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"></path><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"></path><path d="M5 13a10 10 0 0 1 5.24-2.76"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>');
export const IconLoader = (p?: IconProps) => svg(iconProps({ ...p, className: `${p?.className || ''} animate-spin` }), '<line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>');

// FEATURES
export const IconZap = (p?: IconProps) => svg(iconProps(p), '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>');
export const IconMessageSquare = (p?: IconProps) => svg(iconProps(p), '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>');
export const IconTerminal = (p?: IconProps) => svg(iconProps(p), '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>');
export const IconDownload = (p?: IconProps) => svg(iconProps(p), '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>');
export const IconUpload = (p?: IconProps) => svg(iconProps(p), '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>');

// ANIMATED
export const IconStreamingDots = (p?: IconProps) => svg(
  iconProps({ ...p, className: 'streaming-dots' }),
  '<circle cx="4" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="20" cy="12" r="2"></circle>'
);

// RENDER HELPER
export function renderIcon(iconFn: (props?: IconProps) => string, width?: number, height?: number, color?: string): string {
  return iconFn({ 
    size: width && height ? { width, height } : width || 24, 
    color 
  });
}

// COLOR HELPER
export function characterColorStyle(character: { color: string }): string {
  return `background: ${character.color}20; color: ${character.color}; border-color: ${character.color};`;
}

// ICON INDEX
export const ICONS = {
  // Navigation
  menu: IconMenu,
  arrowLeft: IconArrowLeft,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  chevronDown: IconChevronDown,
  x: IconX,
  home: IconHome,
  settings: IconSettings,
  panelRight: IconPanelRight,
  
  // Actions
  send: IconSend,
  edit: IconEdit,
  trash: IconTrash,
  refreshCw: IconRefreshCw,
  gitBranch: IconGitBranch,
  plus: IconPlus,
  copy: IconCopy,
  
  // Media
  image: IconImage,
  mic: IconMic,
  volume: IconVolume,
  play: IconPlay,
  pause: IconPause,
  autoPlay: IconAutoPlay,
  
  // Scenario
  bookOpen: IconBookOpen,
  layers: IconLayers,
  sparkles: IconSparkles,
  theaterLogo: IconTheaterLogo,
  
  // Character
  user: IconUser,
  users: IconUsers,
  ghost: IconGhost,
  
  // Controllers
  brain: IconBrain,
  wand: IconWand,
  eye: IconEye,
  eyeOff: IconEyeOff,
  
  // UI
  check: IconCheck,
  alertCircle: IconAlertCircle,
  info: IconInfo,
  moreVertical: IconMoreVertical,
  moreHorizontal: IconMoreHorizontal,
  search: IconSearch,
  
  // Emotions
  heart: IconHeart,
  smile: IconSmile,
  frown: IconFrown,
  
  // Status
  wifi: IconWifi,
  wifiOff: IconWifiOff,
  loader: IconLoader,
  
  // Features
  zap: IconZap,
  messageSquare: IconMessageSquare,
  terminal: IconTerminal,
  download: IconDownload,
  upload: IconUpload,
  
  // Animated
  streamingDots: IconStreamingDots,
};
