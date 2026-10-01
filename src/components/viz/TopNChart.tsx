import type { TopN } from '@/features/reports/api';
import type { Currency } from '@/lib/api';
import { Money } from '@/components/Money';
import { cn } from '@/lib/utils';

/** Ranked horizontal bars with amount and share; readable without the chart (it is a list). */
export function TopNList({ title, rows, currency, tone }: { title: string; rows: TopN['incomes']; currency: Currency; tone: 'income' | 'expense' }) {
  const max = Math.max(...rows.map((r) => Number(r.amount)), 1);
  return (
    <div>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded in this period.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="tabular mr-2 text-muted-foreground">{i + 1}.</span>
                  {r.name}
                </span>
                <span className="shrink-0">
                  <Money amount={r.amount} currency={currency} className="font-medium" />{' '}
                  <span className="text-muted-foreground">· {r.sharePct}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted" aria-hidden>
                <div className={cn('h-full rounded-full', tone === 'income' ? 'bg-chart-1' : 'bg-chart-2')} style={{ width: `${(Number(r.amount) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
