import { Link } from '@tanstack/react-router';
import { Money } from '@/components/Money';
import { ProgressBar } from '@/components/Progress';
import { Badge } from '@/components/ui/badge';
import type { BudgetSummary } from '@/features/budgets/api';
import { formatDateRange } from '@/lib/format';

/** Expected vs actual income and expenses to date for one active budget (FR-035). */
export function BudgetSummaryCard({ budget }: { budget: BudgetSummary }) {
  const t = budget.totals;
  const net = Number(t.actualIncomeToDate) - Number(t.actualExpenseToDate);
  const rows = [
    { label: 'Income', actual: t.actualIncomeToDate, expected: t.expectedIncomeToDate, tone: 'primary' as const },
    { label: 'Expenses', actual: t.actualExpenseToDate, expected: t.expectedExpenseToDate, tone: 'info' as const },
  ];
  return (
    <article className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            <Link to="/budgets/$budgetId" params={{ budgetId: budget.id }} className="underline-offset-4 hover:underline">
              {budget.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{formatDateRange(budget.startDate, budget.endDate, { withYear: true })}</p>
        </div>
        <Badge variant="outline">{budget.currency}</Badge>
      </header>
      <div>
        <p className="label-caps">Net cash flow to date</p>
        <p className={`mt-1 text-3xl font-semibold ${net >= 0 ? 'text-primary' : 'text-warning'}`}>
          <Money amount={net} currency={budget.currency} signed />
        </p>
      </div>
      <dl className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <dt className="font-medium">{r.label}</dt>
              <dd className="tabular">
                <Money amount={r.actual} currency={budget.currency} /> <span className="text-muted-foreground">of</span>{' '}
                <Money amount={r.expected} currency={budget.currency} className="text-muted-foreground" />
              </dd>
            </div>
            <ProgressBar value={Number(r.actual)} max={Number(r.expected)} label={`${r.label} to date versus expected`} tone={r.tone} />
          </div>
        ))}
      </dl>
      {(Number(t.unbudgetedExpense) > 0 || Number(t.unbudgetedIncome) > 0) && (
        <p className="text-sm text-muted-foreground">
          Unbudgeted: <Money amount={t.unbudgetedExpense} currency={budget.currency} className="text-warning" /> spent
          {Number(t.unbudgetedIncome) > 0 && (
            <>
              , <Money amount={t.unbudgetedIncome} currency={budget.currency} /> received
            </>
          )}
        </p>
      )}
    </article>
  );
}
