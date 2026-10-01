import { cn } from '@/lib/utils';

/** Geometric hummingbird mark + wordmark. */
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-display font-semibold', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden focusable="false">
        <path d="M4 18 L15 14 L28 4 L20 16 Z" fill="var(--chart-1)" />
        <path d="M15 14 L20 16 L14 24 Z" fill="var(--chart-4)" />
        <path d="M4 18 L15 14 L14 24 Z" fill="var(--chart-2)" />
        <path d="M14 24 L10 29 L12 23 Z" fill="var(--chart-6)" />
        <circle cx="22.5" cy="9" r="1.2" fill="var(--background)" />
      </svg>
      {withText && <span className="text-lg tracking-tight">Nelson</span>}
    </span>
  );
}
