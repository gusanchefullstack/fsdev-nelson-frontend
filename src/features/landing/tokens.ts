import type { Tone } from './model';

/** Reads token colors at runtime so the bird follows the light/dark theme (Principle V). */
export function readTones(): Record<Tone | 'background', string> {
  const s = getComputedStyle(document.documentElement);
  const get = (n: string) => s.getPropertyValue(`--${n}`).trim() || '#49e2a0';
  return {
    'chart-1': get('chart-1'),
    'chart-2': get('chart-2'),
    'chart-4': get('chart-4'),
    'chart-5': get('chart-5'),
    'chart-6': get('chart-6'),
    'muted-foreground': get('muted-foreground'),
    background: get('background'),
  };
}
