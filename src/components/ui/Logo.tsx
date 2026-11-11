import { site } from '../../config/site';

/**
 * The official WristGame logo, cut from the supplied artwork (pixels untouched,
 * black backdrop made transparent so it sits on the site's black).
 *  - primary: crown monogram + "WristGame" wordmark (header / compact spaces)
 *  - full:    complete lock-up incl. "WEAR THE GAME" and descriptor line
 *  - emblem:  crown monogram only
 */
const VARIANTS = {
  primary: { file: 'logo-primary', ratio: 1134 / 640 },
  full: { file: 'logo-full', ratio: 911 / 640 },
  emblem: { file: 'logo-emblem', ratio: 1072 / 640 },
} as const;

/** Heights the artwork is saved at (public/images/brand/<file>-<height>.webp). */
const FILE_HEIGHTS = [160, 320, 640] as const;

/** Smallest saved file that is at least `pixels` tall, allowing a little upscaling. */
const fileFor = (pixels: number) => FILE_HEIGHTS.find((height) => height >= pixels * 0.8) ?? FILE_HEIGHTS[FILE_HEIGHTS.length - 1];

interface LogoProps {
  variant?: keyof typeof VARIANTS;
  /** Rendered height in CSS pixels (used to pick the right file + reserve space). */
  height?: number;
  className?: string;
  eager?: boolean;
  /** Set when the logo is decorative because adjacent text already names the brand. */
  decorative?: boolean;
}

export function Logo({ variant = 'primary', height = 64, className = '', eager, decorative }: LogoProps) {
  const { file, ratio } = VARIANTS[variant];
  const base = `/images/brand/${file}`;
  // The artwork is detailed and heavy, so sharpness is capped at 2x: a 3x phone screen
  // gets the 2x file (still crisp) instead of a download two to three times the size.
  const standard = fileFor(height);
  const dense = fileFor(height * 2);
  return (
    <img
      className={`logo ${className}`.trim()}
      src={`${base}-${standard}.webp`}
      srcSet={dense === standard ? undefined : `${base}-${standard}.webp 1x, ${base}-${dense}.webp 2x`}
      width={Math.round(height * ratio)}
      height={height}
      alt={decorative ? '' : `${site.name} — ${site.tagline}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
