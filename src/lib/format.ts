import type { Currency } from './api';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats a decimal string like "5000.00" in US style for its currency (FR-046). */
export function formatMoney(amount: string | number, currency: Currency, opts: { signed?: boolean } = {}): string {
  const key = `${currency}-${opts.signed ? 's' : ''}`;
  let f = moneyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      signDisplay: opts.signed ? 'exceptZero' : 'auto',
      minimumFractionDigits: currency === 'COP' ? 0 : 2,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(key, f);
  }
  return f.format(Number(amount));
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "2027-03-20" -> "Mar 20, 2027" (plain dates are timezone-free). */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "2027-03-20" -> "Mar 20" */
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDateRange(start: string, end: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

/** Instant shown in the zone it was recorded in (FR-031). */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}
