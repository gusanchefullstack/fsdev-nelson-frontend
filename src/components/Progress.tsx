import { cn } from '@/lib/utils';

interface Props {
  value: number;
  max: number;
  label: string;
  tone?: 'primary' | 'info' | 'warning';
}

/** Labelled progress bar; values above max show as full with the warning tone. */
export function ProgressBar({ value, max, label, tone = 'primary' }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : value > 0 ? 100 : 0;
  const over = max > 0 && value > max;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full transition-[width] duration-[var(--duration-slow)]', over ? 'bg-warning' : { primary: 'bg-primary', info: 'bg-info', warning: 'bg-warning' }[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
