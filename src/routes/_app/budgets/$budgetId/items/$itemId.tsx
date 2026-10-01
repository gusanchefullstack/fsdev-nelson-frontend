import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, Plus } from 'lucide-react';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { itemQuery, type Bucket } from '@/features/budgets/api';
import { transactionsQuery } from '@/features/transactions/api';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { formatDate, formatDateRange } from '@/lib/format';
import { frequencyLabels } from '@/lib/labels';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app/budgets/$budgetId/items/$itemId')({ component: ItemPage });

const STATUS: Record<Bucket['status'], string> = { PAST: 'Closed', CURRENT: 'Open now', FUTURE: 'Upcoming' };

export function BucketStatusBadge({ bucket }: { bucket: Bucket }) {
  if (bucket.over) return <Badge className="bg-warning-soft text-warning">Over</Badge>;
  return (
    <Badge variant="outline" className={cn(bucket.status === 'CURRENT' && 'border-primary text-primary')}>
      {STATUS[bucket.status]}
    </Badge>
  );
}

function ItemPage() {
  const { budgetId, itemId } = Route.useParams();
  const { data: item, isPending } = useQuery(itemQuery(itemId));
  const transactions = useInfiniteQuery(transactionsQuery({ itemId }, 50));
  const rows = transactions.data?.pages.flatMap((p) => p.data) ?? [];

  if (isPending || !item) return <Skeleton className="h-96" />;

  return (
    <>
      <Link to="/budgets/$budgetId" params={{ budgetId }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Back to budget
      </Link>
      <PageHeader
        title={item.name}
        eyebrow={
          <>
            <Badge variant="outline">{item.kind === 'INCOME' ? 'Income' : 'Expense'}</Badge>
            <span>{item.categoryName}</span>
          </>
        }
        description={item.description}
        actions={
          <Button asChild>
            <Link to="/transactions/new" search={{ budgetId, itemId, kind: item.kind }}>
              <Plus aria-hidden /> Record transaction
            </Link>
          </Button>
        }
      />
      <dl className="mb-8 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4">
        <div>
          <dt className="label-caps">Estimated amount</dt>
          <dd className="mt-1 text-lg font-semibold">
            <Money amount={item.estimatedAmount} currency={item.currency} />
          </dd>
        </div>
        <div>
          <dt className="label-caps">Frequency</dt>
          <dd className="mt-1">{frequencyLabels[item.frequency]}{item.frequency === 'CUSTOM' && ` · every ${item.customInterval} ${item.customUnit?.toLowerCase()}`}</dd>
        </div>
        <div>
          <dt className="label-caps">Period</dt>
          <dd className="mt-1 tabular">{formatDateRange(item.startDate, item.endDate, { withYear: true })}</dd>
        </div>
        <div>
          <dt className="label-caps">Buckets</dt>
          <dd className="mt-1">{item.buckets.length}</dd>
        </div>
      </dl>

      <section aria-labelledby="buckets-heading">
        <h2 id="buckets-heading" className="mb-3 text-lg font-semibold">
          Buckets
        </h2>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">#</TableHead>
                <TableHead scope="col">Window</TableHead>
                <TableHead scope="col">Expected date</TableHead>
                <TableHead scope="col" className="text-right">Expected</TableHead>
                <TableHead scope="col" className="text-right">Actual</TableHead>
                <TableHead scope="col">Last activity</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.buckets.map((b) => (
                <TableRow key={b.id} aria-current={b.status === 'CURRENT' ? 'date' : undefined}>
                  <TableCell className="tabular">{b.sequence + 1}</TableCell>
                  <TableCell className="tabular whitespace-nowrap">{formatDateRange(b.startDate, b.endDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(b.estimatedExecutionDate)}</TableCell>
                  <TableCell className="text-right">
                    <Money amount={b.estimatedAmount} currency={b.currency} />
                  </TableCell>
                  <TableCell className={cn('text-right', b.over && 'text-warning')}>
                    <Money amount={b.actualAmount} currency={b.currency} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{b.actualDate ? formatDate(b.actualDate) : '—'}</TableCell>
                  <TableCell>
                    <BucketStatusBadge bucket={b} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section aria-labelledby="tx-heading" className="mt-8">
        <h2 id="tx-heading" className="mb-3 text-lg font-semibold">
          Transactions
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">No transactions recorded for this item yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card" aria-label={`${item.name} transactions`}>
            {rows.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </ul>
        )}
        {transactions.hasNextPage && (
          <Button variant="outline" className="mt-3" onClick={() => void transactions.fetchNextPage()}>
            Load more
          </Button>
        )}
      </section>
    </>
  );
}
