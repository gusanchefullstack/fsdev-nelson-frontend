import { formatMoney } from '@/lib/format';
import type { Currency } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  amount: string | number;
  currency: Currency;
  className?: string;
  signed?: boolean;
  /** Mark negative values (e.g. overdrawn balances) */
  highlightNegative?: boolean;
}

export function Money({ amount, currency, className, signed, highlightNegative }: Props) {
  const negative = Number(amount) < 0;
  return (
    <span className={cn('tabular', highlightNegative && negative && 'text-destructive', className)}>
      {formatMoney(amount, currency, { signed })}
      {highlightNegative && negative && <span className="sr-only"> (negative)</span>}
    </span>
  );
}
