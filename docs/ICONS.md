# Theatro Icon System

## Philosophy

Every icon in Theatro is **inline SVG**. No raster images, no icon fonts, no external sprite sheets.

- **Scalable**: Infinite resolution, perfect on all displays
- **Styleable**: Uses `currentColor` for automatic theme adaptation
- **Animatable**: CSS-driven animations, no GIFs
- **Tree-shakeable**: Only icons used are bundled

## Directory Structure

```
src/assets/icons/
├── index.ts          # Barrel exports
├── types.ts          # IconProps interface
├── navigation/       # Drawer, menu, back, forward
├── actions/          # Send, edit, delete, branch, regenerate
├── media/            # Image, voice, mic, play, pause
├── scenario/         # Branch, scene, story arc
├── character/        # Person, group, avatar, emotion
├── controllers/      # Brain, magic spark, wand
├── ui/               # Check, x, warning, info, settings
├── emotions/         # Heart, angry, sad, surprised, etc.
├── status/           # Online, offline, streaming, pending
├── providers/        # Pollinations, Aqua, custom
├── features/         # Auto-improve, auto-scenario, debug
└── decorative/       # Ornaments, dividers, background patterns
```

## Icon Component Interface

```typescript
interface IconProps {
  size?: number | string;      // 24 (default), '1em', '100%'
  color?: string;              // 'currentColor' (default), '#hex', 'var(--color)'
  strokeWidth?: number;        // 2 (default), 1.5, 1
  className?: string;          // Additional CSS classes
  animated?: boolean;          // Enable CSS animation if available
}

// Usage
import { IconSend, IconLoading } from '@/assets/icons';

<IconSend size={20} color="var(--text-secondary)" />
<IconLoading size={24} animated />
```

## Animation Guidelines

Only these icons have CSS animations:

| Icon | Animation | CSS |
|------|-----------|-----|
| `IconLoading` | 360° spin | `animation: spin 1s linear infinite` |
| `IconStreamingDots` | Bouncing dots | `animation: bounce 0.6s ease-in-out infinite` |
| `IconVoiceWave` | Waveform bars | `animation: wave 1s ease-in-out infinite` |
| `IconThinking` | Pulsing brain | `animation: pulse 2s ease-in-out infinite` |

All animations are **CSS-based**, use `transform` and `opacity` only (GPU-accelerated).

## Design Principles

1. **Stroke-based**: All icons use stroke (not fill) for crisp edges at any size
2. **2px default stroke**: Readable at 16px, balanced at 24px
3. **24×24 viewBox**: Standard canvas, scale with CSS
4. **Minimal nodes**: < 20 path commands per icon
5. **Geometric consistency**: 2px corner radius, consistent line caps

## Adding New Icons

1. Create in Figma/Illustrator at 24×24
2. Export as optimized SVG (SVGOMG)
3. Convert to React/Vanilla component
4. Place in correct category folder
5. Export from `index.ts`

## Example Icon Component

```typescript
// src/assets/icons/actions/IconSend.ts
export const IconSend = (props: IconProps = {}) => {
  const { size = 24, color = 'currentColor', strokeWidth = 2, className = '' } = props;
  
  return `
    <svg 
      width="${size}" 
      height="${size}" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="${color}" 
      stroke-width="${strokeWidth}" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      class="${className}"
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  `;
};
```

For vanilla JS with template literals, icons return strings that are inserted with `innerHTML` or `insertAdjacentHTML` after sanitization.
