import { Avatar as AntAvatar } from 'antd';

interface AvatarProps {
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 32, md: 40, lg: 56 };
const fontSizes = { sm: 16, md: 20, lg: 28 };

/**
 * Solid base RGBs per character color. We mix these with the active container
 * bg (light or dark) using color-mix() so the result is always OPAQUE.
 * That makes stacked avatars occlude correctly — the front one fully hides
 * any rear sibling, no see-through layers.
 */
const tintRgb: Record<string, string> = {
  blue: '96, 165, 250',
  red: '248, 113, 113',
  green: '74, 222, 128',
  emerald: '52, 211, 153',
  teal: '45, 212, 191',
  cyan: '34, 211, 238',
  indigo: '129, 140, 248',
  violet: '167, 139, 250',
  purple: '192, 132, 252',
  amber: '251, 191, 36',
  orange: '251, 146, 60',
  pink: '244, 114, 182',
  gray: '168, 162, 152',
  stone: '168, 162, 152',
  slate: '148, 163, 184',
  sky: '56, 189, 248',
  zinc: '161, 161, 170',
  rose: '251, 113, 133',
  yellow: '250, 204, 21',
};

export function Avatar({ emoji, color, size = 'md' }: AvatarProps) {
  const rgb = tintRgb[color] || tintRgb.gray;
  // 22% saturated tint mixed into the container bg → opaque, theme-aware
  const opaqueBg = `color-mix(in srgb, rgb(${rgb}) 22%, var(--ant-color-bg-container))`;
  return (
    <AntAvatar
      shape="square"
      size={sizes[size]}
      style={{
        background: opaqueBg,
        fontSize: fontSizes[size],
        // Container-color ring → when stacked, separates the layers cleanly
        boxShadow: '0 0 0 2px var(--ant-color-bg-container)',
      }}
    >
      {emoji}
    </AntAvatar>
  );
}
