import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartFrame } from '@/components/viz/ChartFrame';
import { ForecastChart, ForecastTable } from '@/components/viz/ForecastChart';
import { ProjectionBar } from '@/components/viz/ProjectionBar';
import { TopNList } from '@/components/viz/TopNChart';
import { budgetQuery, type BudgetDetail } from '@/features/budgets/api';
import { forecastQuery, insightsQuery, projectionQuery, topQuery } from '@/features/reports/api';
import { formatDateRange } from '@/lib/format';

const TABS = ['forecast', 'top', 'projection', 'insights'] as const;

export const Route = createFileRoute('/_app/budgets/$budgetId/reports')({
  validateSearch: z.object({ tab: z.enum(TABS).optional() }),
  component: ReportsPage,
});

function ReportsPage() {
  const { budgetId } = Route.useParams();
  const { tab = 'forecast' } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: budget } = useQuery(budgetQuery(budgetId));
  if (!budget) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <>
      <Link to="/budgets/$budgetId" params={{ budgetId }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> {budget.name}
      </Link>
      <PageHeader
        title="Reports"
        eyebrow={
          <>
            <Badge variant="outline">{budget.currency}</Badge>
            <span className="tabular">{formatDateRange(budget.startDate, budget.endDate, { withYear: true })}</span>
          </>
        }
        description={`How ${budget.name} is going and where it's heading.`}
      />
      <Tabs value={tab} onValueChange={(t) => void navigate({ search: { tab: t as (typeof TABS)[number] }, replace: true })}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="forecast">Forecast vs actual</TabsTrigger>
          <TabsTrigger value="top">Top N</TabsTrigger>
          <TabsTrigger value="projection">Projection</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="forecast">
          <ForecastTab budget={budget} />
        </TabsContent>
        <TabsContent value="top">
          <TopTab budget={budget} />
        </TabsContent>
        <TabsContent value="projection">
          <ProjectionTab budget={budget} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab budget={budget} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function LabeledSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} size="sm" className="min-w-36">
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ForecastTab({ budget }: { budget: BudgetDetail }) {
  const [level, setLevel] = useState<'budget' | 'category' | 'item'>('budget');
  const [targetId, setTargetId] = useState<string>();
  const { data } = useQuery(forecastQuery(budget.id, level, targetId));
  const targets =
    level === 'category'
      ? budget.categories.map((c) => ({ value: c.id, label: `${c.name} (${c.kind === 'INCOME' ? 'income' : 'expense'})` }))
      : budget.categories.flatMap((c) => c.items.map((i) => ({ value: i.id, label: `${i.name} · ${c.name}` })));
  return (
    <ChartFrame
      title="Forecast vs actual"
      description="Bars show what happened each month; dashed lines show what you planned."
      actions={
        <>
          <LabeledSelect
            id="fva-level"
            label="Level"
            value={level}
            onChange={(v) => {
              setLevel(v as typeof level);
              setTargetId(undefined);
            }}
            options={[
              { value: 'budget', label: 'Whole budget' },
              { value: 'category', label: 'Category' },
              { value: 'item', label: 'Item' },
            ]}
          />
          {level !== 'budget' && <LabeledSelect id="fva-target" label={level === 'category' ? 'Category' : 'Item'} value={targetId ?? ''} onChange={setTargetId} options={targets} />}
        </>
      }
      chart={data ? <ForecastChart data={data} currency={budget.currency} /> : <Skeleton className="h-80" />}
      table={data ? <ForecastTable data={data} currency={budget.currency} /> : null}
    />
  );
}

function TopTab({ budget }: { budget: BudgetDetail }) {
  const [n, setN] = useState<5 | 10>(5);
  const [by, setBy] = useState<'item' | 'counterparty'>('item');
  const [from, setFrom] = useState(budget.startDate);
  const [to, setTo] = useState(budget.endDate);
  const { data } = useQuery(topQuery(budget.id, { n, by, from: from || undefined, to: to || undefined }));
  return (
    <section className="rounded-xl border bg-card p-5" aria-label="Top N">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <h2 className="mr-auto text-lg font-semibold">Top {n}</h2>
        <LabeledSelect id="top-n" label="Show" value={String(n)} onChange={(v) => setN(Number(v) as 5 | 10)} options={[{ value: '5', label: 'Top 5' }, { value: '10', label: 'Top 10' }]} />
        <LabeledSelect id="top-by" label="Group by" value={by} onChange={(v) => setBy(v as typeof by)} options={[{ value: 'item', label: 'Budget item' }, { value: 'counterparty', label: 'Payor / vendor' }]} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="top-from" className="text-xs">From</Label>
          <Input id="top-from" type="date" className="h-8" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="top-to" className="text-xs">To</Label>
          <Input id="top-to" type="date" className="h-8" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {data ? (
        <div className="grid gap-8 md:grid-cols-2">
          <TopNList title="Income" rows={data.incomes} currency={budget.currency} tone="income" />
          <TopNList title="Expenses" rows={data.expenses} currency={budget.currency} tone="expense" />
        </div>
      ) : (
        <Skeleton className="h-48" />
      )}
    </section>
  );
}

function ProjectionTab({ budget }: { budget: BudgetDetail }) {
  const { data } = useQuery(projectionQuery(budget.id));
  if (!data) return <Skeleton className="h-80 rounded-xl" />;
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-6 rounded-xl border bg-card p-5 md:grid-cols-2" aria-label="End-of-period projection">
        <ProjectionBar label="Income" totals={data.income} currency={budget.currency} kind="INCOME" />
        <ProjectionBar label="Expenses" totals={data.expense} currency={budget.currency} kind="EXPENSE" />
        <p className="text-sm text-muted-foreground md:col-span-2">
          Projected = what's happened so far plus the rest of the plan, adjusted by how each item has performed in closed buckets.
        </p>
      </section>
      <section className="rounded-xl border bg-card" aria-label="Projection by item">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Item</TableHead>
              <TableHead scope="col" className="text-right">Planned</TableHead>
              <TableHead scope="col" className="text-right">Actual to date</TableHead>
              <TableHead scope="col" className="text-right">Projected</TableHead>
              <TableHead scope="col" className="text-right">Pace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.items].sort((a, b) => Number(a.isSystem) - Number(b.isSystem)).map((i) => (
              <TableRow key={i.itemId}>
                <TableHead scope="row" className="font-medium">
                  {i.name} <span className="text-xs font-normal text-muted-foreground">{i.kind === 'INCOME' ? 'income' : 'expense'}</span>
                </TableHead>
                <TableCell className="text-right"><Money amount={i.planned} currency={budget.currency} /></TableCell>
                <TableCell className="text-right"><Money amount={i.actualToDate} currency={budget.currency} /></TableCell>
                <TableCell className="text-right"><Money amount={i.projected} currency={budget.currency} /></TableCell>
                <TableCell className="tabular text-right">{i.isSystem ? '—' : `${Math.round(i.ratio * 100)}%`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function InsightsTab({ budget }: { budget: BudgetDetail }) {
  const { data } = useQuery(insightsQuery(budget.id));
  if (!data) return <Skeleton className="h-48 rounded-xl" />;
  if (data.length === 0) {
    return <EmptyState icon={<Lightbulb />} title="No suggestions right now" description={`Items are tracking within ${budget.alertThresholdPct}% of their estimates, or haven't closed any buckets yet.`} />;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {data.map((i) => (
        <li key={i.itemId} className="rounded-xl border bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="size-5 text-warning" aria-hidden />
            <h2 className="font-semibold">{i.itemName}</h2>
            <Badge variant="outline">{i.kind === 'INCOME' ? 'Income' : 'Expense'}</Badge>
          </div>
          <p>{i.suggestion}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Average difference: {i.averageDeviationPct > 0 ? '+' : ''}
            {i.averageDeviationPct}% across {i.completedBuckets} closed buckets.
          </p>
        </li>
      ))}
    </ul>
  );
}
