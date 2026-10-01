import type { Currency } from '@/lib/api';
import { formatDateRange, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface GaugeBucket {
  startDate: string;
  endDate: string;
  estimatedAmount: string;
  actualAmount: string;
  status: 'PAST' | 'CURRENT' | 'FUTURE';
  over: boolean;
  currency: Currency;
}

export type GaugeState = 'on-target' | 'over' | 'under' | 'open' | 'upcoming';

export function gaugeState(b: GaugeBucket): GaugeState {
  if (b.over) return 'over';
  if (b.status === 'FUTURE') return 'upcoming';
  if (b.status === 'CURRENT') return 'open';
  return Number(b.actualAmount) < Number(b.estimatedAmount) ? 'under' : 'on-target';
}

const STATE_TEXT: Record<GaugeState, string> = {
  'on-target': 'on target',
  over: 'over',
  under: 'under',
  open: 'open now',
  upcoming: 'upcoming',
};

// Fill colors come from bucket tokens (Principle V)
const FILL: Record<GaugeState, string> = {
  'on-target': 'fill-bucket-on-target',
  over: 'fill-bucket-over',
  under: 'fill-bucket-under',
  open: 'fill-bucket-open',
  upcoming: 'fill-bucket-upcoming',
};

export function gaugeLabel(name: string, b: GaugeBucket): string {
  const actual = Number(b.actualAmount);
  const expected = Number(b.estimatedAmount);
  const money = (v: number) => formatMoney(v, b.currency);
  const diff = actual - expected;
  const delta = diff > 0 ? `, over by ${money(diff)}` : diff < 0 && b.status === 'PAST' ? `, under by ${money(-diff)}` : '';
  return `${name}, ${formatDateRange(b.startDate, b.endDate)}: ${money(actual)} of ${money(expected)}${delta}, ${STATE_TEXT[gaugeState(b)]}`;
}

interface Props {
  name: string;
  bucket: GaugeBucket;
  /** Highlight as selected (e.g. on the item page) */
  selected?: boolean;
  className?: string;
}

/**
 * A bucket-shaped vessel filled in proportion to actual vs expected (FR-037).
 * Over-filled buckets spill over the rim; state is also given in text, never by color alone.
 */
export function BucketGauge({ name, bucket, selected, className }: Props) {
  const state = gaugeState(bucket);
  const expected = Number(bucket.estimatedAmount);
  const actual = Number(bucket.actualAmount);
  const ratio = expected > 0 ? Math.min(actual / expected, 1) : actual > 0 ? 1 : 0;
  // Vessel interior spans y = 8..44; fill rises from the bottom
  const fillTop = 44 - 36 * ratio;
  const clipId = `bucket-clip-${name.replace(/\W/g, '')}-${bucket.startDate}`;
  return (
    <svg
      viewBox="0 0 48 52"
      role="img"
      aria-label={gaugeLabel(name, bucket)}
      data-state={state}
      className={cn('h-14 w-12 shrink-0 overflow-visible', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M6 8 H42 L38 44 Q24 48 10 44 Z" />
        </clipPath>
      </defs>
      <path d="M6 8 H42 L38 44 Q24 48 10 44 Z" className="fill-bucket-upcoming" />
      {ratio > 0 && (
        <rect
          x="0"
          y={fillTop}
          width="48"
          height={48 - fillTop}
          clipPath={`url(#${clipId})`}
          className={cn(FILL[state], 'transition-[y,height] duration-[var(--duration-slow)]')}
        />
      )}
      <path
        d="M6 8 H42 L38 44 Q24 48 10 44 Z"
        fill="none"
        strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={state === 'open' ? '3 2' : undefined}
        className={cn(selected ? 'stroke-foreground' : state === 'open' ? 'stroke-primary' : 'stroke-bucket-outline')}
      />
      {/* Rim / handle */}
      <path d="M10 8 Q24 -2 38 8" fill="none" strokeWidth="1.5" className="stroke-bucket-outline" />
      {state === 'over' && (
        <g className="fill-bucket-over">
          <path d="M42 8 q4 6 2 12 q-2 -4 -2 -12 Z" />
          <circle cx="45" cy="26" r="1.6" />
        </g>
      )}
    </svg>
  );
}
