import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { z } from 'zod';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { budgetsQuery } from '@/features/budgets/api';
import { sourcesQuery } from '@/features/sources/api';
import { transactionsQuery } from '@/features/transactions/api';
import { TransactionRow } from '@/features/transactions/TransactionRow';

const search = z.object({
  budgetId: z.string().optional(),
  itemId: z.string().optional(),
  kind: z.enum(['INCOME', 'EXPENSE']).optional(),
  financialAccountId: z.string().optional(),
  payorId: z.string().optional(),
  vendorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute('/_app/transactions/')({
  validateSearch: search,
  component: TransactionsPage,
});

const ALL = '__all';

function FilterSelect({ id, label, value, options, onChange }: { id: string; label: string; value?: string; options: { value: string; label: string }[]; onChange: (v?: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
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

function TransactionsPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setFilter = (patch: Partial<z.infer<typeof search>>) => void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const list = useInfiniteQuery(transactionsQuery(filters));
  const budgets = useQuery(budgetsQuery);
  const accounts = useQuery(sourcesQuery('accounts'));
  const payors = useQuery(sourcesQuery('payors'));
  const vendors = useQuery(sourcesQuery('vendors'));
  const rows = list.data?.pages.flatMap((p) => p.data) ?? [];
  const record = (
    <Button asChild>
      <Link to="/transactions/new" search={{ budgetId: filters.budgetId, itemId: filters.itemId }}>
        <Plus aria-hidden /> Record transaction
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader title="Transactions" description="Every income and expense, newest first." actions={record} />
      <section aria-label="Filters" className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect id="f-budget" label="Budget" value={filters.budgetId} onChange={(budgetId) => setFilter({ budgetId, itemId: undefined })} options={(budgets.data ?? []).map((b) => ({ value: b.id, label: b.name }))} />
        <FilterSelect
          id="f-kind"
          label="Type"
          value={filters.kind}
          onChange={(kind) => setFilter({ kind: kind as 'INCOME' | 'EXPENSE' | undefined })}
          options={[
            { value: 'EXPENSE', label: 'Expenses' },
            { value: 'INCOME', label: 'Income' },
          ]}
        />
        <FilterSelect id="f-account" label="Account" value={filters.financialAccountId} onChange={(financialAccountId) => setFilter({ financialAccountId })} options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <FilterSelect id="f-payor" label="Payor" value={filters.payorId} onChange={(payorId) => setFilter({ payorId })} options={(payors.data ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <FilterSelect id="f-vendor" label="Vendor" value={filters.vendorId} onChange={(vendorId) => setFilter({ vendorId })} options={(vendors.data ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-from">From</Label>
          <Input id="f-from" type="date" value={filters.from ?? ''} onChange={(e) => setFilter({ from: e.target.value || undefined })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-to">To</Label>
          <Input id="f-to" type="date" value={filters.to ?? ''} onChange={(e) => setFilter({ to: e.target.value || undefined })} />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => void navigate({ search: {} })}>
            Clear filters
          </Button>
        </div>
      </section>

      {list.isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight />} title="No transactions found" description="Record income or expenses to see them here." action={record} />
      ) : (
        <>
          <ul className="divide-y rounded-xl border bg-card" aria-label="Transactions">
            {rows.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </ul>
          {list.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                {list.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
