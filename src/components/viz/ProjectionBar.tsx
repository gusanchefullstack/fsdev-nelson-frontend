import { Money } from '@/components/Money';
import type { Projection } from '@/features/reports/api';
import type { Currency } from '@/lib/api';

type Totals = Projection['income'];

/**
 * Planned vs actual-to-date vs projected for one kind (FR-039).
 * Bars share a scale so over/under projections are visible at a glance.
 */
export function ProjectionBar({ label, totals, currency, kind }: { label: string; totals: Totals; currency: Currency; kind: 'INCOME' | 'EXPENSE' }) {
  const planned = Number(totals.planned);
  const actual = Number(totals.actualToDate);
  const projected = Number(totals.projected);
  const max = Math.max(planned, projected, actual, 1);
  const pct = (v: number) => `${(v / max) * 100}%`;
  const delta = projected - planned;
  const good = kind === 'INCOME' ? delta >= 0 : delta <= 0;
  const rows = [
    { name: 'Planned', value: planned, className: 'bg-muted-foreground/40' },
    { name: 'Actual to date', value: actual, className: kind === 'INCOME' ? 'bg-chart-1' : 'bg-chart-2' },
    { name: 'Projected', value: projected, className: good ? 'bg-chart-4' : 'bg-chart-3' },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{label}</h3>
        <p className={`text-sm ${good ? 'text-primary' : 'text-warning'}`}>
          {delta === 0 ? 'On plan' : (
            <>
              <Money amount={Math.abs(delta)} currency={currency} /> {delta > 0 ? 'above' : 'below'} plan
            </>
          )}
        </p>
      </div>
      <dl className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
            <dt className="text-muted-foreground">{r.name}</dt>
            <div className="h-3 rounded-full bg-muted" aria-hidden>
              <div className={`h-full rounded-full ${r.className}`} style={{ width: pct(r.value) }} />
            </div>
            <dd>
              <Money amount={r.value} currency={currency} />
            </dd>
          </div>
        ))}
      </dl>
      {Number(totals.unbudgeted) > 0 && (
        <p className="text-sm text-muted-foreground">
          Includes <Money amount={totals.unbudgeted} currency={currency} className="text-warning" /> unbudgeted.
        </p>
      )}
    </div>
  );
}
