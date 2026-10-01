import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ListTree, PieChart, Plus, Rows3, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { budgetsQuery } from '@/features/budgets/api';
import { formatDateRange } from '@/lib/format';

export const Route = createFileRoute('/_app/budgets/')({ component: BudgetsPage });

const MODES = [
  { to: '/budgets/new/lite', title: 'Lite', icon: Rows3, text: 'Name, currency and dates now. Add categories and items later.', ready: true },
  { to: '/budgets/new/guided', title: 'Guided', icon: Sparkles, text: 'Step by step: income first, then expenses.', ready: false },
  { to: '/budgets/new/complete', title: 'Complete', icon: ListTree, text: 'Everything on one screen as a tree.', ready: false },
] as const;

function NewBudgetButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> New budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How do you want to start?</DialogTitle>
          <DialogDescription>You can always add or change categories and items later.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {MODES.map(({ to, title, icon: Icon, text, ready }) => (
            <li key={to}>
              {ready ? (
                <Link to={to} className="flex items-start gap-3 rounded-lg border p-4 transition hover:border-primary hover:bg-surface-hover">
                  <Icon className="mt-0.5 size-5 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border p-4 opacity-60" aria-disabled>
                  <Icon className="mt-0.5 size-5" aria-hidden />
                  <span>
                    <span className="block font-semibold">
                      {title} <Badge variant="secondary">Coming soon</Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function BudgetsPage() {
  const { data, isPending } = useQuery(budgetsQuery);
  return (
    <>
      <PageHeader title="Budgets" description="Each budget covers one currency and one period." actions={<NewBudgetButton />} />
      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<PieChart />}
          title="No budgets yet"
          description="Create your first budget to start planning income and expenses."
          action={<NewBudgetButton />}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((b) => (
            <li key={b.id}>
              <Link
                to="/budgets/$budgetId"
                params={{ budgetId: b.id }}
                className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{b.name}</h2>
                    <p className="text-sm text-muted-foreground">{formatDateRange(b.startDate, b.endDate, { withYear: true })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Badge variant="outline">{b.currency}</Badge>
                    {b.isActive && <Badge className="bg-primary-soft text-primary">Active</Badge>}
                  </div>
                </div>
                {(
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="label-caps">Income to date</dt>
                      <dd>
                        <Money amount={b.totals.actualIncomeToDate} currency={b.currency} className="text-base" />
                      </dd>
                    </div>
                    <div>
                      <dt className="label-caps">Spent to date</dt>
                      <dd>
                        <Money amount={b.totals.actualExpenseToDate} currency={b.currency} className="text-base" />
                      </dd>
                    </div>
                  </dl>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
