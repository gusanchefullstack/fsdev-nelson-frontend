import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { PieChart, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardAlerts } from '@/features/alerts/DashboardAlerts';
import { BudgetSummaryCard } from '@/features/dashboard/BudgetSummaryCard';
import { dashboardQuery } from '@/features/dashboard/api';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { accountTypeLabels } from '@/lib/labels';

export const Route = createFileRoute('/_app/dashboard')({ component: Dashboard });

function greeting(hour: number) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function Dashboard() {
  const { me } = Route.useRouteContext();
  const { data, isPending } = useQuery(dashboardQuery);
  const hour = Temporal.Now.zonedDateTimeISO(me.profile?.timeZone).hour;

  const header = (
    <PageHeader
      title={`${greeting(hour)}, ${me.profile?.firstName ?? 'there'}`}
      description="Here's where your money stands today."
      actions={
        <Button asChild>
          <Link to="/transactions/new">
            <Plus aria-hidden /> New transaction
          </Link>
        </Button>
      }
    />
  );

  if (isPending || !data) {
    return (
      <>
        {header}
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </>
    );
  }

  if (data.activeBudgets.length === 0 && data.recentTransactions.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<PieChart />}
          title="Create your first budget"
          description="Set a period and currency, then add the income and expenses you expect."
          action={
            <Button asChild>
              <Link to="/budgets">Create a budget</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <DashboardAlerts alerts={data.unreadAlerts} />
      <section aria-labelledby="active-h" className="mb-8">
        <h2 id="active-h" className="mb-3 text-lg font-semibold">
          Active budgets
        </h2>
        {data.activeBudgets.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-muted-foreground">
            No budget covers today.{' '}
            <Link to="/budgets" className="font-medium text-primary underline-offset-4 hover:underline">
              See all budgets
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.activeBudgets.map((b) => (
              <BudgetSummaryCard key={b.id} budget={b} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="recent-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-h" className="text-lg font-semibold">
              Recent transactions
            </h2>
            <Link to="/transactions" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card" aria-label="Recent transactions">
              {data.recentTransactions.map((t) => (
                <TransactionRow key={t.id} t={t} />
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="accounts-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="accounts-h" className="text-lg font-semibold">
              Accounts
            </h2>
            <Link to="/accounts" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Manage
            </Link>
          </div>
          <ul className="divide-y rounded-xl border bg-card">
            {data.financialAccounts.length === 0 && <li className="p-4 text-muted-foreground">No accounts yet.</li>}
            {data.financialAccounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{accountTypeLabels[a.type]}</p>
                </div>
                <Money amount={a.currentBalance} currency={a.currency} highlightNegative className="font-semibold" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
